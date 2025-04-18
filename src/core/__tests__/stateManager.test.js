/**
 * Tests for the state manager
 */
import { getState, setState, subscribe, unsubscribe, initialize, resetStateForTesting } from '../stateManager.js';
import Logger from '../logger.js';

// Mock the logger to prevent console output during tests
jest.mock('../logger.js', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  time: jest.fn(),
  timeAsync: jest.fn(),
  LogLevels: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
  },
  configure: jest.fn()
}));

describe('State Manager', () => {
  // Clear mocks and reset state between tests
  beforeEach(() => {
    if (resetStateForTesting) {
      resetStateForTesting();
    } else {
      console.error('resetStateForTesting is not available in this environment!');
    }
    jest.clearAllMocks();
  });

  describe('setState and getState', () => {
    test('should set and get a state value', () => {
      const testValue = { test: 'value' };
      setState('testKey', testValue);
      expect(getState('testKey')).toBe(testValue);
    });

    test('should not update state if value is unchanged', () => {
      const testValue = { test: 'value' };
      
      // Set initial value
      setState('testKey', testValue);
      expect(Logger.debug).toHaveBeenCalled();
      
      // Reset mock to check if it gets called again
      Logger.debug.mockClear();
      
      // Set the same value again
      setState('testKey', testValue);
      
      // The first debug call should be about skipping the update
      expect(Logger.debug).toHaveBeenCalledWith(
        'State unchanged for key: testKey, skipping update',
        'StateManager'
      );
    });

    test('should return undefined for non-existent key', () => {
      expect(getState('nonExistentKey')).toBeUndefined();
    });
  });

  describe('subscribe and unsubscribe', () => {
    test('should call subscribers when state changes', () => {
      const callback = jest.fn();
      const testValue = { test: 'value' };
      
      subscribe('testKey', callback);
      setState('testKey', testValue);
      
      expect(callback).toHaveBeenCalledWith(testValue);
    });

    test('should not call subscribers for other keys', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      subscribe('testKey1', callback1);
      subscribe('testKey2', callback2);
      
      setState('testKey1', 'value1');
      
      expect(callback1).toHaveBeenCalledWith('value1');
      expect(callback2).not.toHaveBeenCalled();
    });

    test('should stop calling subscriber after unsubscribe', () => {
      const callback = jest.fn();
      
      subscribe('testKey', callback);
      setState('testKey', 'value1');
      
      expect(callback).toHaveBeenCalledWith('value1');
      
      // Clear the mock to check if it gets called again
      callback.mockClear();
      
      unsubscribe('testKey', callback);
      setState('testKey', 'value2');
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should handle multiple subscribers for the same key', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      subscribe('testKey', callback1);
      subscribe('testKey', callback2);
      
      setState('testKey', 'value');
      
      expect(callback1).toHaveBeenCalledWith('value');
      expect(callback2).toHaveBeenCalledWith('value');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });
    
    test('should handle errors gracefully', () => {
      // Create a simple subscriber that will throw
      const errorFn = () => {
        throw new Error('Test error');
      };
      
      // Subscribe to changes
      subscribe('testKey', errorFn);
      
      // Verify set state doesn't throw
      expect(() => {
        setState('testKey', 'new value');
      }).not.toThrow();
      
      // Verify the state was updated despite the error
      expect(getState('testKey')).toBe('new value');
      
      // Verify the error was logged
      expect(Logger.error).toHaveBeenCalled();
    });
  });

  describe('initialization', () => {
    test('should initialize map state', () => {
      const mockMap = { test: 'map' };
      initialize(mockMap);
      
      expect(Logger.info).toHaveBeenCalledWith('Initializing state manager', 'StateManager');
      expect(getState('map')).toBe(mockMap);
    });
  });
}); 