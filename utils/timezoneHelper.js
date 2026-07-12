/**
 * Get the start and end of a day in Indian Standard Time (IST), represented as UTC dates.
 * @param {string|Date} [dateInput] - Optional date input to convert. Defaults to current time.
 * @returns {{ start: Date, end: Date }}
 */
export const getISTDateRange = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  
  // Shift by 5.5 hours to align with IST
  const shifted = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  
  // Set start (00:00:00.000 IST) and convert back to UTC
  const startUTC = new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - (5.5 * 60 * 60 * 1000));
  
  // Set end (23:59:59.999 IST) and convert back to UTC
  const endUTC = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - (5.5 * 60 * 60 * 1000));
  
  return { start: startUTC, end: endUTC };
};

/**
 * Get the calendar date string in Indian Standard Time (IST) (format YYYY-MM-DD).
 * @param {string|Date} [dateInput] - Optional date input to convert. Defaults to current time.
 * @returns {string}
 */
export const getISTDateString = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  const shifted = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
