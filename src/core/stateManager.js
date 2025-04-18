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
  if (typeof callback !== 'function') {
    Logger.error(`Attempted to subscribe to key '${key}' with a non-function callback:`, CONTEXT, callback);
    return;
  }
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key).add(callback);
  Logger.info(`Subscription registered for key: '${key}'`, CONTEXT, { 
    callbackName: callback.name || 'anonymous',
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

// Define the initial state structure for resetting
const initialState = {
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
  map: null // Map instance is usually set during initialization
};

/**
 * Resets the state to its initial values. 
 * ONLY intended for use in testing environments.
 */
function resetStateForTesting() {
  Logger.warn('Resetting state for testing purposes.', CONTEXT);
  // Deep copy the initial state to avoid modifying the template
  const initialStateCopy = JSON.parse(JSON.stringify(initialState));
  // Preserve the map instance if it exists, as it's often needed across tests
  initialStateCopy.map = state.map; 

  // Clear current state keys
  Object.keys(state).forEach(key => {
    delete state[key];
  });

  // Assign initial state keys
  Object.assign(state, initialStateCopy);

  // Clear all subscribers
  subscribers.clear();
}

// Conditionally export the reset function only for non-production environments
let exportedResetFunction = null;
if (process.env.NODE_ENV !== 'production') {
  exportedResetFunction = resetStateForTesting;
}
export { exportedResetFunction as resetStateForTesting };

/**
 * Initialize the state manager with required dependencies
 * @param {Object} map - Mapbox map instance
 */
export function initialize(map) {
  Logger.info('Initializing state manager', CONTEXT);
  setState('map', map);
} 