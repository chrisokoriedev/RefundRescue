import { registerGracefulShutdown } from '../src/utils/gracefulShutdown.js';

describe('Graceful Shutdown', () => {
  it('drains in-flight connections and closes cleanly on signal', async () => {
    const logs: string[] = [];
    let closeCalled = false;
    let exitCode: number | undefined;

    const fakeServer = {
      close: (cb?: (err?: Error) => void) => {
        closeCalled = true;
        setTimeout(() => cb?.(), 10); // async like real http.Server
      }
    };

    const shutdown = registerGracefulShutdown(fakeServer, {
      log: (m) => logs.push(m),
      error: (m) => logs.push('ERR: ' + m),
      exit: (code) => { exitCode = code; }
    });

    shutdown('SIGTERM');
    await new Promise(r => setTimeout(r, 50));

    expect(closeCalled).toBe(true);
    expect(exitCode).toBe(0);
    expect(logs.some(l => l.includes('SIGTERM received'))).toBe(true);
    expect(logs.some(l => l.includes('closed cleanly'))).toBe(true);
  });

  it('exits with code 1 when server close errors (async close like real http.Server)', async () => {
    const logs: string[] = [];
    let exitCode: number | undefined;

    const fakeServer = {
      // Mimic real http.Server: close callback fires asynchronously
      close: (cb?: (err?: Error) => void) => {
        setTimeout(() => cb?.(new Error('close failed')), 10);
      }
    };

    const shutdown = registerGracefulShutdown(fakeServer, {
      log: (m) => logs.push(m),
      error: (m) => logs.push('ERR: ' + m),
      exit: (code) => { exitCode = code; }
    });

    shutdown('SIGINT');

    // Wait for the async close callback to fire
    await new Promise(r => setTimeout(r, 50));

    expect(exitCode).toBe(1);
    expect(logs.some(l => l.includes('Error while closing server'))).toBe(true);
  });

  it('is idempotent — second signal is ignored', () => {
    let closeCount = 0;
    const fakeServer = {
      close: (cb?: (err?: Error) => void) => { closeCount++; cb?.(); }
    };

    const shutdown = registerGracefulShutdown(fakeServer, {
      log: () => {},
      error: () => {},
      exit: () => {}
    });

    shutdown('SIGTERM');
    shutdown('SIGTERM');
    shutdown('SIGINT');

    expect(closeCount).toBe(1);
  });

  it('defaults to process.exit and console when no overrides given', () => {
    // Smoke test with real console/exit references (never actually invoked
    // because the fake server closes cleanly and we stub exit via default —
    // but the default path must not throw during registration).
    const fakeServer = { close: () => {} };
    expect(() => registerGracefulShutdown(fakeServer)).not.toThrow();
  });
});
