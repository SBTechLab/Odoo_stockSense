/**
 * Background jobs entry point, called by server.js after the HTTP server starts.
 *
 * Owner: Member 3. Planned jobs (see docs/PRD.md):
 *  - low-stock / out-of-stock scan → Notification rows + eventBus 'notification.created'
 *  - late-operations scan → LATE_OPERATION notifications
 *
 * Keep each job idempotent, and return a stop function so tests/shutdown can clear timers.
 *
 * @returns {() => void} stop function
 */
export function startBackgroundJobs() {
  const timers = [];
  // Member 3: e.g. timers.push(setInterval(scanLowStock, 5 * 60 * 1000));
  return () => timers.forEach(clearInterval);
}
