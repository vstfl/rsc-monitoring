/**
 * Date and Time Utility Functions
 * This module provides utilities for date/time operations used throughout the application.
 */

/**
 * Calculates a time range based on a center date and window size
 * @param {Date|string} date - The center date/time
 * @param {number} windowSize - The size of the window in minutes
 * @returns {Array<Date>} - Array containing [startDate, endDate]
 */
export function calculateDataRange(date, windowSize) {
  let timeDiff = windowSize * 1; // minutes
  const dateTime = date instanceof Date ? date : new Date(date);

  // Create range with dateTime at the center
  const startDate = new Date(dateTime.getTime() - timeDiff * 60000);
  const endDate = new Date(dateTime.getTime() + timeDiff * 60000);

  return [startDate, endDate];
}

/**
 * A utility class for handling date/time components in a consistent way
 */
export class DateTimeConstants {
  /**
   * Creates a new DateTimeConstants instance
   * @param {string|Date} timestamp - The timestamp to parse
   * @param {number} hoursToAdd - Optional hours to add to the timestamp
   */
  constructor(timestamp, hoursToAdd = 0) {
    this.date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (hoursToAdd) {
      this.date.setHours(this.date.getHours() + hoursToAdd);
    }
  }

  /**
   * Gets the UTC year
   * @returns {number} The year
   */
  get year() {
    return this.date.getUTCFullYear();
  }

  /**
   * Gets the UTC month (1-12) with leading zero
   * @returns {string} The month as a two-digit string
   */
  get month() {
    return String(this.date.getUTCMonth() + 1).padStart(2, "0");
  }

  /**
   * Gets the UTC day of month with leading zero
   * @returns {string} The day as a two-digit string
   */
  get day() {
    return String(this.date.getUTCDate()).padStart(2, "0");
  }

  /**
   * Gets the UTC hour with leading zero
   * @returns {string} The hour as a two-digit string
   */
  get hour() {
    return String(this.date.getUTCHours()).padStart(2, "0");
  }

  /**
   * Gets the UTC minute with leading zero
   * @returns {string} The minute as a two-digit string
   */
  get minute() {
    return String(this.date.getUTCMinutes()).padStart(2, "0");
  }
}

/**
 * Checks if a time string (HHMM) is within a given range
 * @param {string} urlHHMM - Time in HHMM format (e.g., "1430" for 2:30 PM)
 * @param {DateTimeConstants} s - Start time
 * @param {DateTimeConstants} e - End time
 * @returns {boolean} True if the time is within range
 */
export function isInRange(urlHHMM, s, e) {
  const urlHour = parseInt(urlHHMM.slice(0, 2), 10);
  const urlMinute = parseInt(urlHHMM.slice(-2), 10);

  const startHour = parseInt(s.hour, 10);
  const startMinute = parseInt(s.minute, 10);
  const endHour = parseInt(e.hour, 10);
  const endMinute = parseInt(e.minute, 10);

  const urlTime = urlHour * 60 + urlMinute;
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  return urlTime >= startTime && urlTime <= endTime;
}

/**
 * Checks if two dates are from different calendar days
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if the dates are from different days
 */
export function isDifferentDay(date1, date2) {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  
  return (
    d1.getUTCFullYear() !== d2.getUTCFullYear() ||
    d1.getUTCMonth() !== d2.getUTCMonth() ||
    d1.getUTCDate() !== d2.getUTCDate()
  );
} 