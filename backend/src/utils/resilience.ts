/**
 * Resilience primitives for outbound calls (LLM APIs, etc.):
 *   - withTimeout: hard deadline wrapper — a hung call can't wedge a request
 *   - retryWithBackoff: exponential backoff with full jitter
 *   - CircuitBreaker: stop hammering a failing dependency; self-heal after cooldown
 */

// ── Timeout ──
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label = 'operation'): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer!)) as Promise<T>;
}

// ── Retry with exponential backoff + jitter ──
export interface RetryOptions {
  attempts?: number;        // total attempts (first try + retries). Default 3
  baseDelayMs?: number;     // initial delay. Default 300ms
  maxDelayMs?: number;      // delay cap. Default 5000ms
  /** Return true for errors worth retrying (timeouts, 429, 5xx). Default: retry everything except non-retryable list */
  isRetryable?: (err: unknown) => boolean;
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
}

const DEFAULT_NON_RETRYABLE = [
  'auth', 'api key', 'permission', 'invalid', 'parse' // config/logic errors won't fix themselves
];

export function isRetryableError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (DEFAULT_NON_RETRYABLE.some(s => msg.includes(s))) return false;
  if (err instanceof TimeoutError) return true;
  // Anything with an HTTP-ish status hint: retry 429 and 5xx
  const status = (err as any)?.status ?? (err as any)?.code;
  if (typeof status === 'number') return status === 429 || status >= 500;
  return true;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 300;
  const maxDelayMs = opts.maxDelayMs ?? 5000;
  const isRetryable = opts.isRetryable ?? isRetryableError;

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === attempts || !isRetryable(err)) {
        throw err;
      }
      // Exponential backoff with full jitter: delay = random(0, min(cap, base * 2^(attempt-1)))
      const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
      const delayMs = Math.floor(Math.random() * exponential);
      opts.onRetry?.(err, attempt, delayMs);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastError; // unreachable, satisfies TS
}

// ── Circuit Breaker ──
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  name?: string;
  /** Failures within the window before opening. Default 3 */
  failureThreshold?: number;
  /** Sliding window for failure counting (ms). Default 60s */
  windowMs?: number;
  /** How long the circuit stays open before probing. Default 30s */
  cooldownMs?: number;
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

interface CircuitMetrics {
  failures: number[];      // failure timestamps inside window
  state: CircuitState;
  openedAt: number;
  lastError?: unknown;
}

/**
 * Circuit breaker that protects against a failing downstream (e.g. Gemini API).
 * CLOSED → normal operation; failures tracked in a sliding window.
 * OPEN   → calls fail fast (isAvailable=false) without hitting the network.
 * HALF_OPEN → after cooldown, a single probe call is allowed through;
 *             success closes the circuit, failure re-opens it.
 */
export class CircuitBreaker {
  private metrics: CircuitMetrics;
  private readonly opts: Required<Omit<CircuitBreakerOptions, 'name' | 'onStateChange'>> & Pick<CircuitBreakerOptions, 'name' | 'onStateChange'>;

  constructor(opts: CircuitBreakerOptions = {}) {
    this.opts = {
      name: opts.name ?? 'downstream',
      failureThreshold: opts.failureThreshold ?? 3,
      windowMs: opts.windowMs ?? 60_000,
      cooldownMs: opts.cooldownMs ?? 30_000,
      onStateChange: opts.onStateChange
    };
    this.metrics = { failures: [], state: 'CLOSED', openedAt: 0 };
  }

  get state(): CircuitState {
    if (this.metrics.state === 'OPEN' && Date.now() - this.metrics.openedAt >= this.opts.cooldownMs) {
      // Cooldown elapsed — the next execute() call is the probe.
      return 'HALF_OPEN';
    }
    return this.metrics.state;
  }

  get isOpen(): boolean {
    return this.state === 'OPEN';
  }

  /** Fast-fail check — skip the network call entirely when open */
  canCall(): boolean {
    return this.state !== 'OPEN';
  }

  getStats() {
    const cutoff = Date.now() - this.opts.windowMs;
    this.metrics.failures = this.metrics.failures.filter(t => t > cutoff);
    return {
      name: this.opts.name,
      state: this.state,
      recentFailures: this.metrics.failures.length,
      failureThreshold: this.opts.failureThreshold,
      cooldownRemainingMs: this.state === 'OPEN'
        ? Math.max(0, this.opts.cooldownMs - (Date.now() - this.metrics.openedAt))
        : 0
    };
  }

  private transition(to: CircuitState) {
    const from = this.metrics.state;
    if (from === to) return;
    this.metrics.state = to;
    if (to === 'OPEN') this.metrics.openedAt = Date.now();
    this.opts.onStateChange?.(from, to);
  }

  recordSuccess() {
    this.metrics.failures = [];
    if (this.metrics.state === 'OPEN') this.transition('CLOSED');
  }

  recordFailure(err?: unknown) {
    const now = Date.now();
    const cutoff = now - this.opts.windowMs;
    this.metrics.failures = this.metrics.failures.filter(t => t > cutoff);
    this.metrics.failures.push(now);
    this.metrics.lastError = err;

    // Cooldown elapsed while OPEN → that execute() was the half-open probe.
    // A failed probe re-opens immediately and restarts the cooldown window.
    if (
      this.metrics.state === 'OPEN' &&
      Date.now() - this.metrics.openedAt >= this.opts.cooldownMs
    ) {
      this.metrics.openedAt = Date.now(); // restart cooldown
    } else if (this.metrics.failures.length >= this.opts.failureThreshold) {
      this.transition('OPEN');
    }
  }

  /**
   * Execute fn under circuit protection.
   * Throws a descriptive error immediately when the circuit is OPEN.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen) {
      const stats = this.getStats();
      throw new Error(
        `Circuit breaker '${this.opts.name}' is OPEN — failing fast. Retry in ~${Math.ceil(stats.cooldownRemainingMs / 1000)}s. Last error: ${String(this.metrics.lastError ?? 'unknown')}`
      );
    }
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure(err);
      throw err;
    }
  }
}
