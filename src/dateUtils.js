/**
 * Date Utilities - Timezone-safe date parsing and formatting
 * 
 * This module provides utility functions to handle date parsing and formatting
 * without timezone issues that commonly occur when using new Date(dateString)
 * with YYYY-MM-DD formatted strings.
 */

/**
 * Parse a date string in YYYY-MM-DD format to a Date object in local time
 * This avoids the timezone interpretation issue where new Date("2025-09-27")
 * is interpreted as UTC midnight, which can display as the previous day in local time.
 * 
 * @param {string|Date} dateInput - Date string in YYYY-MM-DD format or Date object
 * @returns {Date} Date object in local time
 */
export const parseDate = (dateInput) => {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  
  if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateInput.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }
  
  // Fallback for other formats - this might still have timezone issues
  return new Date(dateInput);
};

/**
 * Format a Date object as YYYY-MM-DD string in local time
 * This avoids using toISOString() which formats in UTC
 * 
 * @param {Date|string} dateInput - Date object or date string
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDateForInput = (dateInput) => {
  let dateObj;
  
  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else if (typeof dateInput === 'string') {
    // Use our parseDate function to avoid timezone issues
    dateObj = parseDate(dateInput);
  } else {
    console.error('Invalid date passed to formatDateForInput:', dateInput);
    return new Date().toISOString().split('T')[0];
  }
  
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date passed to formatDateForInput:', dateInput);
    return new Date().toISOString().split('T')[0];
  }
  
  // Format as YYYY-MM-DD in local time (not UTC)
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format a date for display with timezone-safe parsing
 * 
 * @param {string|Date} dateInput - Date string or Date object
 * @param {object} options - toLocaleDateString options
 * @returns {string} Formatted date string
 */
export const formatDateDisplay = (dateInput, options = {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric'
}) => {
  const date = parseDate(dateInput);
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format time from HH:MM string to display format
 * 
 * @param {string} timeString - Time string in HH:MM format
 * @returns {string} Formatted time string
 */
export const formatTimeDisplay = (timeString) => {
  if (!timeString) return '';
  return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get a date range string from start and end dates
 * 
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Formatted date range
 */
export const getDateRange = (startDate, endDate) => {
  const start = formatDateDisplay(startDate);
  const end = formatDateDisplay(endDate);
  
  if (formatDateForInput(startDate) === formatDateForInput(endDate)) {
    return start;
  }
  return `${start} - ${end}`;
};

/**
 * Calculate the number of days between two dates (inclusive)
 * 
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Number of days
 */
export const getDaysCount = (startDate, endDate) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

/**
 * Get an array of dates for a week starting from Sunday
 * 
 * @param {string|Date} sundayDate - The Sunday date to start from
 * @returns {Date[]} Array of 7 Date objects for the week
 */
export const getWeekDates = (sundayDate) => {
  const dates = [];
  const sunday = parseDate(sundayDate);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

/**
 * Check if a date is within a date range (inclusive)
 * 
 * @param {string|Date} checkDate - Date to check
 * @param {string|Date} startDate - Range start date
 * @param {string|Date} endDate - Range end date
 * @returns {boolean} True if date is in range
 */
export const isDateInRange = (checkDate, startDate, endDate) => {
  const check = parseDate(checkDate);
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  return check >= start && check <= end;
};

/**
 * Check if two dates are the same day
 * 
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {boolean} True if same day
 */
export const isSameDay = (date1, date2) => {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

/**
 * Compare two dates (ignoring time)
 * 
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export const compareDates = (date1, date2) => {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  
  // Reset time to compare just dates
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
};