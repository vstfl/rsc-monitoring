/**
 * Central state management module for the RSI application.
 * Implements a pub/sub pattern for cross-module communication.
 */

// Event subscribers
const subscribers = new Map();

// Shared state
const state = {
  currentGeoJSON: null,
  studyAreaState: true,
  clickedPointValues: {
    CAM: false
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
}

/**
 * Unsubscribe from state changes
 * @param {string} key - State key to unsubscribe from
 * @param {Function} callback - Function to remove from subscribers
 */
export function unsubscribe(key, callback) {
  if (subscribers.has(key)) {
    subscribers.get(key).delete(callback);
  }
}

/**
 * Update state and notify subscribers
 * @param {string} key - State key to update
 * @param {any} value - New value
 */
export function setState(key, value) {
  state[key] = value;
  if (subscribers.has(key)) {
    subscribers.get(key).forEach(callback => callback(value));
  }
}

/**
 * Get current state value
 * @param {string} key - State key to get
 * @returns {any} Current state value
 */
export function getState(key) {
  return state[key];
}

/**
 * Initialize the state manager with required dependencies
 * @param {Object} map - Mapbox map instance
 */
export function initialize(map) {
  setState('map', map);
} 