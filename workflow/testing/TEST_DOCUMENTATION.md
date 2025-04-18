# RSI Project Test Documentation

This document describes the current test implementation for the RSI Monitoring project, including test architecture, coverage, and future plans.

## Current Test Architecture

The project uses Jest as its primary testing framework with the following configuration:

- **Test Environment**: JSDOM (for simulating browser environment)
- **Module Mapping**: CSS modules are mocked using identity-obj-proxy
- **Test Setup**: Custom setup in jest.setup.js
- **Transformation**: JavaScript files are transformed with babel-jest

## Implemented Tests

### Core Module Tests

#### State Manager (`src/core/__tests__/stateManager.test.js`)

Tests for the central state management module which implements a pub/sub pattern:

- **State Setting and Getting**
  - Setting and retrieving state values
  - Handling unchanged values
  - Behavior with non-existent keys

- **Subscription System**
  - Calling subscribers when state changes
  - Filtering subscribers by key
  - Unsubscribing from state updates
  - Managing multiple subscribers for the same key

- **Error Handling**
  - Gracefully handling errors in subscribers
  - Preserving state integrity despite subscriber errors
  - Properly logging errors that occur in subscribers

- **Initialization**
  - Proper initialization of the application state

#### Logger (`src/core/__tests__/logger.test.js`)

Tests for the custom logging utility:

- **Log Levels**
  - Respecting configured log levels
  - Not logging messages below the set level
  - Complete disabling of logs at NONE level

- **Formatting**
  - Context inclusion in log messages
  - Timestamp formatting and inclusion
  - Customizable logging format

- **Performance Timing**
  - Measuring synchronous operation duration
  - Tracking asynchronous operation completion time
  - Error handling during timed operations

### Integration Tests

#### Map and UI Interactions (`src/__tests__/interactions.test.js`)

Tests covering the integration between map functionality and UI:

- **Study Area Filtering**
  - Proper filtering of GeoJSON data when study area is enabled
  - Skipping filtering when study area is disabled

- **RWIS Image Toggling**
  - Correct handling of image URL switching for RWIS images
  - Toggle between normal and CAM (GradCAM) images
  - Proper state updates during image toggling
  - No modifications for non-RWIS images

## Test Coverage

The current test suite provides coverage for:

- Core utility functions (Logger, StateManager)
- Basic integration between map and UI components
- Error handling in the state management system

Areas with partial or no coverage:
- Firebase authentication and data fetching
- MapBox GL rendering and interactions
- Interpolation algorithms
- Most UI event handlers
- Complex GeoJSON processing

## Mock Strategy

The tests extensively use Jest's mocking capabilities:

- **External Libraries**: MapBox GL, Firebase, and other third-party libraries
- **DOM Elements**: Document, Element, and Event objects
- **Network Requests**: API calls and file loading
- **Core Utilities**: Logger for isolating components during testing

## Future Test Improvements

### Short-term Goals

1. **Increase Unit Test Coverage**
   - Add tests for remaining core utilities
   - Test data processing functions
   - Test GeoJSON interpolation algorithms

2. **Improve Integration Tests**
   - Add tests for Firebase interactions
   - Test map layer management
   - Test UI responsiveness

3. **Error State Testing**
   - Test application behavior with malformed data
   - Test network error recovery
   - Test user error handling

### Medium-term Goals

1. **End-to-End Testing**
   - Set up Cypress for UI testing
   - Create critical user flow tests
   - Test real-time data updates

2. **Performance Testing**
   - Benchmark data processing functions
   - Test rendering performance
   - Measure load times for large datasets

3. **Visual Regression Testing**
   - Test UI components visual consistency
   - Ensure map rendering consistency
   - Test responsive design breakpoints

### Long-term Goals

1. **Continuous Integration**
   - Automate test running in CI/CD pipeline
   - Set up coverage thresholds
   - Implement automatic regression detection

2. **Test-Driven Development**
   - Transition to TDD for new features
   - Create test specifications before implementation
   - Use tests to guide refactoring efforts

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage reporting
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

## Test Structure Conventions

Tests in this project follow these conventions:

1. Tests are located near the code they test (in `__tests__` directories)
2. Test files are named after the module they test with `.test.js` suffix
3. Jest's `describe` blocks group related tests
4. Test cases use descriptive names explaining expected behavior
5. Setup and teardown use Jest's lifecycle methods (beforeEach, afterEach) 