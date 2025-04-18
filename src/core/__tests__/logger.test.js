/**
 * Tests for the logger utility
 */
import Logger from '../logger.js';

describe('Logger', () => {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error
  };
  
  // Mock console methods before each test
  beforeEach(() => {
    console.log = jest.fn();
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    
    // Reset logger configuration to default
    Logger.configure({
      level: Logger.LogLevels.DEBUG,
      enableTimestamps: true,
      enableContext: true
    });
  });
  
  // Restore original console methods after each test
  afterEach(() => {
    console.log = originalConsole.log;
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });
  
  describe('Log Levels', () => {
    test('should log messages at the appropriate level', () => {
      Logger.debug('Debug message');
      Logger.info('Info message');
      Logger.warn('Warn message');
      Logger.error('Error message');
      
      expect(console.debug).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
    
    test('should not log messages below configured level', () => {
      Logger.configure({ level: Logger.LogLevels.WARN });
      
      Logger.debug('Debug message');
      Logger.info('Info message');
      Logger.warn('Warn message');
      Logger.error('Error message');
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
    
    test('should disable all logs at NONE level', () => {
      Logger.configure({ level: Logger.LogLevels.NONE });
      
      Logger.debug('Debug message');
      Logger.info('Info message');
      Logger.warn('Warn message');
      Logger.error('Error message');
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });
  
  describe('Formatting', () => {
    test('should include context when enabled', () => {
      Logger.configure({ enableContext: true });
      Logger.info('Test message', 'TestContext');
      
      // Get the first argument of the first call
      const logMessage = console.info.mock.calls[0][0];
      expect(logMessage).toContain('[TestContext]');
    });
    
    test('should not include context when disabled', () => {
      Logger.configure({ enableContext: false });
      Logger.info('Test message', 'TestContext');
      
      const logMessage = console.info.mock.calls[0][0];
      expect(logMessage).not.toContain('[TestContext]');
    });
    
    test('should include timestamp when enabled', () => {
      Logger.configure({ enableTimestamps: true });
      Logger.info('Test message');
      
      const logMessage = console.info.mock.calls[0][0];
      // Verify timestamp format [YYYY-MM-DDThh:mm:ss.sssZ]
      expect(logMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]/);
    });
    
    test('should not include timestamp when disabled', () => {
      Logger.configure({ enableTimestamps: false });
      Logger.info('Test message');
      
      const logMessage = console.info.mock.calls[0][0];
      // Verify timestamp format is not present
      expect(logMessage).not.toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]/);
    });
  });
  
  describe('Time Functions', () => {
    test('should time synchronous operations', () => {
      const operation = jest.fn().mockReturnValue('result');
      const result = Logger.time('Test operation', operation, 'TestContext');
      
      expect(operation).toHaveBeenCalled();
      expect(result).toBe('result');
      expect(console.debug).toHaveBeenCalled();
      expect(console.debug.mock.calls[0][0]).toContain('Test operation completed in');
    });
    
    test('should time asynchronous operations', async () => {
      const operation = jest.fn().mockResolvedValue('async result');
      const result = await Logger.timeAsync('Async operation', operation, 'TestContext');
      
      expect(operation).toHaveBeenCalled();
      expect(result).toBe('async result');
      expect(console.debug).toHaveBeenCalled();
      expect(console.debug.mock.calls[0][0]).toContain('Async operation completed in');
    });
    
    test('should handle synchronous errors', () => {
      const operation = jest.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });
      
      expect(() => Logger.time('Error operation', operation)).toThrow('Sync error');
      expect(console.error).toHaveBeenCalled();
      expect(console.error.mock.calls[0][0]).toContain('Error operation failed after');
    });
    
    test('should handle asynchronous errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Async error'));
      
      await expect(Logger.timeAsync('Async error', operation)).rejects.toThrow('Async error');
      expect(console.error).toHaveBeenCalled();
      expect(console.error.mock.calls[0][0]).toContain('Async error failed after');
    });
    
    test('should skip timing in production mode', () => {
      Logger.configure({ level: Logger.LogLevels.ERROR });
      const operation = jest.fn().mockReturnValue('result');
      
      Logger.time('Test operation', operation);
      
      expect(operation).toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
    });
  });
}); 