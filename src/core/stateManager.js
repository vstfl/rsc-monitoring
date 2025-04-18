/**
 * Central state management module for the RSI application.
 * Implements a pub/sub pattern for cross-module communication.
 */
import Logger from './logger.js';

// Module context for logging
const CONTEXT = 'StateManager';

// Event subscribers
const subscribers = new Map();

// Shared state
const state = {
  currentGeoJSON: null,
  currentInterpolation: null,
  studyAreaState: true,
  clickedPointValues: {
    CAM: false,
    type: null,
    specificID: null,
    avlID: null,
    timestamp: null,
    classification: null,
    classes: null,
    image: null
  },
  map: null
};

/**
 * Subscribe to state changes
 * @param {string} key - State key to subscribe to
 * @param {Function} callback - Function to call when state changes
 */
export function subscribe(key, callback) {
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key).add(callback);
  Logger.debug(`New subscriber added for key: ${key}`, CONTEXT, { 
    subscriberCount: subscribers.get(key).size 
  });
}

/**
 * Unsubscribe from state changes
 * @param {string} key - State key to unsubscribe from
 * @param {Function} callback - Function to remove from subscribers
 */
export function unsubscribe(key, callback) {
  if (subscribers.has(key)) {
    subscribers.get(key).delete(callback);
    Logger.debug(`Subscriber removed for key: ${key}`, CONTEXT, { 
      subscriberCount: subscribers.get(key).size 
    });
  }
}

/**
 * Update state and notify subscribers
 * @param {string} key - State key to update
 * @param {any} value - New value
 */
export function setState(key, value) {
  // Skip update if value is unchanged (to prevent unnecessary renders)
  if (state[key] === value) {
    Logger.debug(`State unchanged for key: ${key}, skipping update`, CONTEXT);
    return;
  }
  
  Logger.debug(`Setting state for key: ${key}`, CONTEXT, { 
    previousValue: state[key] ? typeof state[key] : 'null',
    newValue: value ? typeof value : 'null'
  });
  
  state[key] = value;
  
  if (subscribers.has(key)) {
    const subscriberCount = subscribers.get(key).size;
    Logger.debug(`Notifying ${subscriberCount} subscribers for key: ${key}`, CONTEXT);
    
    subscribers.get(key).forEach(callback => {
      try {
        callback(value);
      } catch (error) {
        Logger.error(`Error in subscriber for key ${key}`, CONTEXT, error);
      }
    });
  }
}

/**
 * Get current state value
 * @param {string} key - State key to get
 * @returns {any} Current state value
 */
export function getState(key) {
  Logger.debug(`Getting state for key: ${key}`, CONTEXT);
  return state[key];
}

/**
 * Initialize the state manager with required dependencies
 * @param {Object} map - Mapbox map instance
 */
export function initialize(map) {
  Logger.info('Initializing state manager', CONTEXT);
  setState('map', map);
} 