/**
 * Simple in-memory retry queue for failed CALL-E calls.
 * 
 * For production, replace with BullMQ + Redis for:
 * - Persistent retry state across restarts
 * - Distributed retry processing
 * - Better concurrency handling
 * 
 * For MVP, this in-memory queue is sufficient.
 */

interface RetryJob {
  id: string;
  logId: string;
  payload: any;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  createdAt: string;
  lastError?: string;
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [30_000, 120_000, 300_000]; // 30s, 2min, 5min

class RetryQueue {
  private jobs: Map<string, RetryJob> = new Map();
  private processing = false;

  /**
   * Add a failed call to the retry queue.
   */
  enqueue(logId: string, payload: any, lastError?: string): RetryJob {
    const id = `retry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const job: RetryJob = {
      id,
      logId,
      payload,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      nextRetryAt: Date.now() + RETRY_DELAYS_MS[0],
      createdAt: new Date().toISOString(),
      lastError,
    };

    this.jobs.set(id, job);
    console.log(`[RetryQueue] Job ${id} enqueued for log ${logId}. Will retry in ${RETRY_DELAYS_MS[0] / 1000}s.`);
    return job;
  }

  /**
   * Process pending retries. Call this periodically (e.g., every 10 seconds).
   */
  async process(retryHandler: (job: RetryJob) => Promise<boolean>): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const now = Date.now();
      for (const [id, job] of this.jobs) {
        if (now < job.nextRetryAt) continue;
        if (job.attempts >= job.maxAttempts) {
          console.warn(`[RetryQueue] Job ${id} exhausted all ${job.maxAttempts} attempts. Dropping.`);
          this.jobs.delete(id);
          continue;
        }

        job.attempts++;
        console.log(`[RetryQueue] Retrying job ${id} (attempt ${job.attempts}/${job.maxAttempts})...`);

        try {
          const success = await retryHandler(job);
          if (success) {
            console.log(`[RetryQueue] Job ${id} succeeded on attempt ${job.attempts}.`);
            this.jobs.delete(id);
          } else {
            job.nextRetryAt = now + RETRY_DELAYS_MS[Math.min(job.attempts, RETRY_DELAYS_MS.length - 1)];
            console.log(`[RetryQueue] Job ${id} failed. Next retry at ${new Date(job.nextRetryAt).toISOString()}.`);
          }
        } catch (err: any) {
          job.lastError = err.message;
          job.nextRetryAt = now + RETRY_DELAYS_MS[Math.min(job.attempts, RETRY_DELAYS_MS.length - 1)];
          console.error(`[RetryQueue] Job ${id} error: ${err.message}. Next retry at ${new Date(job.nextRetryAt).toISOString()}.`);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Get queue stats.
   */
  getStats() {
    return {
      pending: this.jobs.size,
      jobs: Array.from(this.jobs.values()),
    };
  }

  /**
   * Clear all jobs (for testing).
   */
  clear() {
    this.jobs.clear();
  }
}

export const retryQueue = new RetryQueue();

// Start the retry processor every 10 seconds (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    retryQueue.process(async (job) => {
      // Re-attempt the CALL-E call
      const { calleService } = await import('./calleService.js');
      const result = await calleService.startCall(job.payload);
      return !!result.runId;
    });
  }, 10_000);
}
