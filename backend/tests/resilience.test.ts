import { withTimeout, retryWithBackoff, CircuitBreaker, TimeoutError, isRetryableError } from '../src/utils/resilience.js';

describe('withTimeout', () => {
  it('resolves when the promise completes in time', async () => {
    const result = await withTimeout(Promise.resolve('fast'), 1000);
    expect(result).toBe('fast');
  });

  it('throws TimeoutError when the promise exceeds the deadline', async () => {
    await expect(
      withTimeout(new Promise(resolve => setTimeout(resolve, 500)), 50)
    ).rejects.toThrow(TimeoutError);
  });
});

describe('retryWithBackoff', () => {
  it('returns the result when the first attempt succeeds', async () => {
    const result = await retryWithBackoff(async () => 'ok', { baseDelayMs: 10 });
    expect(result).toBe('ok');
  });

  it('retries retryable failures and eventually succeeds', async () => {
    let calls = 0;
    const result = await retryWithBackoff(
      async () => {
        calls++;
        if (calls < 3) {
          const err: any = new Error('503 Service Unavailable');
          err.status = 503;
          throw err;
        }
        return 'recovered';
      },
      { attempts: 3, baseDelayMs: 10 }
    );
    expect(calls).toBe(3);
    expect(result).toBe('recovered');
  });

  it('fails fast on non-retryable errors (no delay burn)', async () => {
    const start = Date.now();
    await expect(
      retryWithBackoff(
        async () => { throw new Error('invalid API key provided'); },
        { attempts: 3, baseDelayMs: 1000 }
      )
    ).rejects.toThrow('invalid API key');
    expect(Date.now() - start).toBeLessThan(200);
  });

  it('exhausts attempts and throws the last error', async () => {
    let calls = 0;
    await expect(
      retryWithBackoff(
        async () => {
          calls++;
          const err: any = new Error('429 Too Many Requests');
          err.status = 429;
          throw err;
        },
        { attempts: 3, baseDelayMs: 10 }
      )
    ).rejects.toThrow('429');
    expect(calls).toBe(3);
  });
});

describe('isRetryableError', () => {
  it('classifies timeouts and 5xx/429 as retryable', () => {
    expect(isRetryableError(new TimeoutError(1000))).toBe(true);
    const e503: any = new Error('boom'); e503.status = 503;
    expect(isRetryableError(e503)).toBe(true);
    const e429: any = new Error('limited'); e429.status = 429;
    expect(isRetryableError(e429)).toBe(true);
  });

  it('classifies auth/config errors as non-retryable', () => {
    expect(isRetryableError(new Error('API key invalid'))).toBe(false);
    expect(isRetryableError(new Error('permission denied'))).toBe(false);
  });
});

describe('CircuitBreaker', () => {
  it('stays closed while failures are below threshold', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    try { await cb.execute(async () => { throw new Error('fail'); }); } catch {}
    expect(cb.state).toBe('CLOSED');
    expect(cb.canCall()).toBe(true);
  });

  it('opens after reaching the failure threshold', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    for (let i = 0; i < 3; i++) {
      try { await cb.execute(async () => { throw new Error('fail'); }); } catch {}
    }
    expect(cb.state).toBe('OPEN');
    expect(cb.canCall()).toBe(false);
  });

  it('fails fast with a descriptive error while open', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, name: 'test-svc' });
    try { await cb.execute(async () => { throw new Error('downstream down'); }); } catch {}
    await expect(cb.execute(async () => 'never')).rejects.toThrow(/OPEN/);
  });

  it('moves to HALF_OPEN after cooldown and closes on success', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 50 });
    try { await cb.execute(async () => { throw new Error('fail'); }); } catch {}
    expect(cb.state).toBe('OPEN');

    await new Promise(r => setTimeout(r, 80));
    expect(cb.state).toBe('HALF_OPEN');

    const result = await cb.execute(async () => 'healthy');
    expect(result).toBe('healthy');
    expect(cb.state).toBe('CLOSED');
  });

  it('re-opens immediately when the half-open probe fails', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 50 });
    try { await cb.execute(async () => { throw new Error('fail'); }); } catch {}

    await new Promise(r => setTimeout(r, 80));
    expect(cb.state).toBe('HALF_OPEN');

    try { await cb.execute(async () => { throw new Error('still down'); }); } catch {}
    expect(cb.state).toBe('OPEN');
  });

  it('resets failures on success so intermittent blips do not open the circuit', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    // 2 failures, then a success, then 2 more failures — never 3 consecutive-in-window
    for (let i = 0; i < 2; i++) {
      try { await cb.execute(async () => { throw new Error('blip'); }); } catch {}
    }
    await cb.execute(async () => 'ok');
    try { await cb.execute(async () => { throw new Error('blip'); }); } catch {}
    expect(cb.state).toBe('CLOSED');
  });
});
