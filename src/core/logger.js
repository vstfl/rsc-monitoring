/**
 * Centralized logging utility for RSI application
 * Provides consistent logging with levels, timestamps, and context
 */

// Log levels with numeric values for comparison
const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4, // For disabling logs
};

// Determine initial log level based on environment variables
const getInitialLogLevel = () => {
  // Prefer LOG_LEVEL if defined by build process
  if (process.env.LOG_LEVEL && LogLevels[process.env.LOG_LEVEL.toUpperCase()] !== undefined) {
    return LogLevels[process.env.LOG_LEVEL.toUpperCase()];
  }
  // Fallback to NODE_ENV
  return process.env.NODE_ENV === 'production' ? LogLevels.WARN : LogLevels.DEBUG;
};

// Default configuration
let config = {
  level: LogLevels.INFO, // Default level
  enableTimestamps: true,
  enableContext: true,
};

/**
 * Configure the logger settings
 * @param {Object} options - Configuration options
 * @param {string} options.level - Minimum log level to display (e.g., 'DEBUG', 'INFO')
 * @param {boolean} options.enableTimestamps - Whether to include timestamps
 * @param {boolean} options.enableContext - Whether to include context information
 */
function configure(options = {}) {
  let newLevel = config.level;
  // Check if a level option is provided
  if (options.level !== undefined) {
    // Check if the provided level is a string (log level name)
    if (typeof options.level === 'string') {
      const upperCaseLevel = options.level.toUpperCase();
      if (LogLevels[upperCaseLevel] !== undefined) {
        newLevel = LogLevels[upperCaseLevel];
      } else {
        console.warn(`[Logger] Invalid log level string: '${options.level}'. Using current level.`);
      }
    // Check if the provided level is a number (log level value)
    } else if (typeof options.level === 'number') {
      // Check if the number corresponds to a valid log level value
      const isValidLevel = Object.values(LogLevels).includes(options.level);
      if (isValidLevel) {
        newLevel = options.level;
      } else {
        console.warn(`[Logger] Invalid log level number: ${options.level}. Using current level.`);
      }
    } else {
       console.warn(`[Logger] Invalid type for log level: ${typeof options.level}. Using current level.`);
    }
  }
  
  // Update the configuration, only overriding provided options
  config = {
    level: newLevel,
    enableTimestamps: options.enableTimestamps !== undefined ? options.enableTimestamps : config.enableTimestamps,
    enableContext: options.enableContext !== undefined ? options.enableContext : config.enableContext,
  };
}

/**
 * Format a log message with timestamp and context
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {string} context - Context/module name
 * @param {Object} data - Additional data to log
 * @returns {string} Formatted log message
 */
function formatMessage(level, message, context, data) {
  const parts = [];
  
  if (config.enableTimestamps) {
    parts.push(`[${new Date().toISOString()}]`);
  }
  
  parts.push(`[${level}]`);
  
  if (config.enableContext && context) {
    parts.push(`[${context}]`);
  }
  
  parts.push(message);
  
  return parts.join(' ');
}

/**
 * Log a message at the specified level
 * @param {string} level - Log level 
 * @param {string} message - Message to log
 * @param {string} context - Context/module name
 * @param {Object} data - Additional data to log
 */
function log(level, message, context = '', data = null) {
  const numericLevel = LogLevels[level] || LogLevels.INFO;
  
  if (numericLevel < config.level) {
    return; // Skip logs below configured level
  }

  const formattedMsg = formatMessage(level, message, context, data);
  
  switch (level) {
    case 'DEBUG':
      console.debug(formattedMsg, data || '');
      break;
    case 'INFO':
      console.info(formattedMsg, data || '');
      break;
    case 'WARN':
      console.warn(formattedMsg, data || '');
      break;
    case 'ERROR':
      console.error(formattedMsg, data || '');
      break;
    default:
      console.log(formattedMsg, data || '');
  }
}

/**
 * Log a debug message
 * @param {string} message - Message to log
 * @param {string} context - Context/module name
 * @param {Object} data - Additional data to log
 */
function debug(message, context = '', data = null) {
  log('DEBUG', message, context, data);
}

/**
 * Log an info message
 * @param {string} message - Message to log
 * @param {string} context - Context/module name
 * @param {Object} data - Additional data to log
 */
function info(message, context = '', data = null) {
  log('INFO', message, context, data);
}

/**
 * Log a warning message
 * @param {string} message - Message to log
 * @param {string} context - Context/module name
 * @param {Object} data - Additional data to log
 */
function warn(message, context = '', data = null) {
  log('WARN', message, context, data);
}

/**
 * Log an error message
 * @param {string} message - Message to log
 * @param {string} context - Context/module name
 * @param {Object} data - Additional data to log
 */
function error(message, context = '', data = null) {
  log('ERROR', message, context, data);
}

/**
 * Time an operation and log its duration
 * @param {string} label - Operation label
 * @param {Function} operation - Function to time
 * @param {string} context - Context/module name
 * @returns {Promise<any>} Result of the operation
 */
async function timeAsync(label, operation, context = '') {
  if (config.level > LogLevels.DEBUG) {
    return operation();
  }
  
  const start = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - start;
    debug(`${label} completed in ${duration.toFixed(2)}ms`, context);
    return result;
  } catch (err) {
    const duration = performance.now() - start;
    error(`${label} failed after ${duration.toFixed(2)}ms: ${err.message}`, context, err);
    throw err;
  }
}

/**
 * Time a synchronous operation and log its duration
 * @param {string} label - Operation label
 * @param {Function} operation - Function to time
 * @param {string} context - Context/module name
 * @returns {any} Result of the operation
 */
function time(label, operation, context = '') {
  if (config.level > LogLevels.DEBUG) {
    return operation();
  }
  
  const start = performance.now();
  try {
    const result = operation();
    const duration = performance.now() - start;
    debug(`${label} completed in ${duration.toFixed(2)}ms`, context);
    return result;
  } catch (err) {
    const duration = performance.now() - start;
    error(`${label} failed after ${duration.toFixed(2)}ms: ${err.message}`, context, err);
    throw err;
  }
}

export default {
  LogLevels,
  configure,
  debug,
  info,
  warn,
  error,
  timeAsync,
  time
}; 