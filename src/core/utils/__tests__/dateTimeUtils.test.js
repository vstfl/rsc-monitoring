/**
 * Tests for the date and time utility functions
 */
import { 
  calculateDataRange, 
  DateTimeConstants,
  isInRange,
  isDifferentDay
} from '../dateTimeUtils.js';

describe('Date and Time Utilities', () => {
  describe('calculateDataRange', () => {
    test('should calculate start and end dates correctly for a given window size', () => {
      // Use a fixed date for testing
      const testDate = new Date('2023-01-01T12:00:00Z');
      const windowSize = 30; // 30 minutes
      
      const [startDate, endDate] = calculateDataRange(testDate, windowSize);
      
      // Verify the start date is 30 minutes before the test date
      expect(startDate.getTime()).toBe(testDate.getTime() - 30 * 60 * 1000);
      
      // Verify the end date is 30 minutes after the test date
      expect(endDate.getTime()).toBe(testDate.getTime() + 30 * 60 * 1000);
    });
    
    test('should handle Date objects and ISO strings', () => {
      const testDateString = '2023-01-01T12:00:00Z';
      const testDate = new Date(testDateString);
      const windowSize = 30;
      
      const [startDate1, endDate1] = calculateDataRange(testDate, windowSize);
      const [startDate2, endDate2] = calculateDataRange(testDateString, windowSize);
      
      // Both should give the same results
      expect(startDate1.getTime()).toBe(startDate2.getTime());
      expect(endDate1.getTime()).toBe(endDate2.getTime());
    });
  });
  
  describe('DateTimeConstants', () => {
    test('should parse timestamp into year, month, day, hour, minute', () => {
      const timestamp = '2023-09-15T14:30:00Z';
      const dtc = new DateTimeConstants(timestamp);
      
      expect(dtc.year).toBe(2023);
      expect(dtc.month).toBe('09');
      expect(dtc.day).toBe('15');
      expect(dtc.hour).toBe('14');
      expect(dtc.minute).toBe('30');
    });
    
    test('should add hours to timestamp when specified', () => {
      const timestamp = '2023-09-15T14:30:00Z';
      const hoursToAdd = 2;
      const dtc = new DateTimeConstants(timestamp, hoursToAdd);
      
      expect(dtc.hour).toBe('16'); // 14 + 2
    });
    
    test('should handle date rollover when adding hours', () => {
      const timestamp = '2023-09-15T23:30:00Z';
      const hoursToAdd = 2;
      const dtc = new DateTimeConstants(timestamp, hoursToAdd);
      
      expect(dtc.day).toBe('16'); // Day incremented
      expect(dtc.hour).toBe('01'); // 23 + 2 = 25, which is 01 the next day
    });
  });
  
  describe('isInRange', () => {
    test('should return true when time is within range', () => {
      const urlHHMM = '1445'; // 14:45
      const start = new DateTimeConstants('2023-09-15T14:30:00Z');
      const end = new DateTimeConstants('2023-09-15T15:00:00Z');
      
      expect(isInRange(urlHHMM, start, end)).toBe(true);
    });
    
    test('should return false when time is before range', () => {
      const urlHHMM = '1415'; // 14:15
      const start = new DateTimeConstants('2023-09-15T14:30:00Z');
      const end = new DateTimeConstants('2023-09-15T15:00:00Z');
      
      expect(isInRange(urlHHMM, start, end)).toBe(false);
    });
    
    test('should return false when time is after range', () => {
      const urlHHMM = '1515'; // 15:15
      const start = new DateTimeConstants('2023-09-15T14:30:00Z');
      const end = new DateTimeConstants('2023-09-15T15:00:00Z');
      
      expect(isInRange(urlHHMM, start, end)).toBe(false);
    });
    
    test('should handle edge cases (exact match with boundaries)', () => {
      const urlHHMMStart = '1430'; // 14:30
      const urlHHMMEnd = '1500'; // 15:00
      const start = new DateTimeConstants('2023-09-15T14:30:00Z');
      const end = new DateTimeConstants('2023-09-15T15:00:00Z');
      
      expect(isInRange(urlHHMMStart, start, end)).toBe(true);
      expect(isInRange(urlHHMMEnd, start, end)).toBe(true);
    });
  });
  
  describe('isDifferentDay', () => {
    test('should return true when dates are from different days', () => {
      const date1 = new Date('2023-09-15T14:30:00Z');
      const date2 = new Date('2023-09-16T14:30:00Z');
      
      expect(isDifferentDay(date1, date2)).toBe(true);
    });
    
    test('should return false when dates are from the same day', () => {
      const date1 = new Date('2023-09-15T14:30:00Z');
      const date2 = new Date('2023-09-15T23:45:00Z');
      
      expect(isDifferentDay(date1, date2)).toBe(false);
    });
    
    test('should handle date strings', () => {
      const date1 = '2023-09-15T14:30:00Z';
      const date2 = '2023-09-16T14:30:00Z';
      
      expect(isDifferentDay(date1, date2)).toBe(true);
    });
  });
}); 