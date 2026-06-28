/**
 * Get the start and end of a day in Indian Standard Time (IST), represented as UTC dates.
 * @param {string|Date} [dateInput] - Optional date input to convert. Defaults to current time.
 * @returns {{ start: Date, end: Date }}
 */
export const getISTDateRange = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  
  // Get time in UTC
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  // Add IST offset (+5.5 hours = 330 minutes)
  const istDate = new Date(utcTime + (330 * 60000));
  
  const start = new Date(istDate);
  start.setHours(0, 0, 0, 0);
  const startUTC = new Date(start.getTime() - (330 * 60000));
  
  const end = new Date(istDate);
  end.setHours(23, 59, 59, 999);
  const endUTC = new Date(end.getTime() - (330 * 60000));
  
  return { start: startUTC, end: endUTC };
};
