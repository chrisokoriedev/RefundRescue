/**
 * Graceful shutdown helper.
 *
 * On SIGTERM/SIGINT: stop accepting new connections, let in-flight requests
 * drain, then close. Force-exits after a timeout if draining hangs.
 *
 * Signal delivery itself is platform-dependent (Linux/Docker delivers SIGTERM
 * reliably; Windows does not), so the logic is extracted here and unit-testable
 * via the returned shutdown function.
 */
export const FORCE_EXIT_MS = 10_000;

export function registerGracefulShutdown(
  server: { close: (cb?: (err?: Error) => void) => unknown },
  opts: {
    log?: (msg: string) => void;
    error?: (msg: string) => void;
    exit?: (code: number) => void;
    forceExitMs?: number;
  } = {}
): (signal: string) => void {
  const log = opts.log ?? console.log;
  const error = opts.error ?? console.error;
  const exit = opts.exit ?? process.exit;
  const forceExitMs = opts.forceExitMs ?? FORCE_EXIT_MS;

  let isShuttingDown = false;

  return function shutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    log(`[Shutdown] ${signal} received — draining in-flight requests…`);

    server.close((err?: Error) => {
      if (err) {
        error(`[Shutdown] Error while closing server: ${err.message}`);
        exit(1);
        return;
      }
      log('[Shutdown] Server closed cleanly. Goodbye.');
      exit(0);
    });

    // Safety net: force exit if draining takes too long
    setTimeout(() => {
      error(`[Shutdown] Force-exiting after ${forceExitMs / 1000}s drain timeout.`);
      exit(1);
    }, forceExitMs).unref();
  };
}
