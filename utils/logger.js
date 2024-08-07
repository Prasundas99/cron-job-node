/**
 * Creates a logger object with info, warn, and error methods.
 * @returns {{info: function, warn: function, error: function}} Logger object
 */
export const createLogger = () => ({
  info: (message) =>
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  warn: (message) =>
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  error: (message) =>
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`),
});
