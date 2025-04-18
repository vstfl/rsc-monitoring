# RSI Project - Next Tasks

Based on the current progress and priority areas identified in the project, the following tasks should be addressed next:

## Immediate Priority Tasks

### 1. Security Improvements (Highest)

- **Task 2.1.2**: Move Mapbox access token to environment variables
  - Create .env file configuration
  - Update build process to use environment variables
  - Document setup requirements

- **Task 2.1.3**: Move Firebase configuration to environment variables
  - Extract Firebase credentials to environment
  - Implement secure authentication flows (Consider using App Check)
  - Add proper security rules (Review existing rules)

### 2. Architecture & Maintainability (High)

- **Task 1.3.1**: Split `webInteractions.js` further into domain-specific modules
  - Create separate modules for UI components/logic (e.g., form handling, NIK logic)
  - Extract event handlers into separate modules or integrate with UI modules
  - Create dedicated modules for specific functionality (e.g., Mesonet API interaction)

- **(New) Task 1.4.1**: Refactor `stateManager.js` for testability
  - Expose a reset/clear function for testing purposes.
  - Ensure module state doesn't leak between tests.

- **(New) Task 6.1.5**: Investigate & Fix Build Config for ES Module Transformation
  - Analyze Jest and Babel configuration (`jest.config.js`, `babel.config.js` if exists).
  - Ensure `node_modules` like `kdbush` are correctly transformed.
  - *Goal: Unblock testing for `interpolation.js`.*

- **Task 1.3.3**: Create a proper config module for application settings (e.g., API URLs, constants)

- **Task 1.3.4**: Implement clear interfaces between modules
  - Define clear API boundaries
  - Document module interfaces
  - Remove direct cross-module access (ensure state manager is used)


### 3. Error Handling Improvements (High)

- **Task 4.1.1**: Add try/catch blocks to all Firebase operations (`firebaseHandler.js`)
  - Audit all Firebase API calls
  - Implement proper error handling and logging
  - Add recovery mechanisms where appropriate

- **Task 4.1.x**: Implement error handling for Mesonet API fetches (`webInteractions.js`)
  - Ensure `fetch` calls have `.catch()` blocks
  - Handle network errors gracefully and inform the user

- **Task 4.1.2**: Implement error handling for Mapbox operations
  - Add error handling for map initialization
  - Implement error recovery for layer operations
  - Create fallbacks for map rendering failures

- **Task 4.2.1**: Design and implement user-friendly error messages
  - Create standardized error message components
  - Implement error state UI
  - Add contextual help for common errors

### 4. Testing Infrastructure (Refinement & Blockers)

- **Task 6.1.3**: Set up test coverage reporting
  - Configure Jest coverage reporting
  - Add coverage thresholds for critical modules
  - Generate coverage reports during CI/CD

- **Task 6.2.2**: Review and Refine tests for map functionality
  - Review existing integration tests in `src/__tests__/interactions.test.js` and `src/__tests__/integration.test.js`.
  - Improve test clarity and assertions.
  - Consider adding tests for specific map interactions (zoom, pan effects if any).

- **(Deferred) Task 6.2.3**: Implement tests for data processing (`interpolation.js`, `firebaseHandler.js`)
  - *Blocked by Task 1.4.1 (stateManager refactor) and Task 6.1.5 (build config).*
  - *Also blocked by complex mocking required for `firebaseHandler.js`.*

- **(Deferred) Task 6.2.x**: Fix failing test in `dataTransformUtils.test.js`
  - Investigate the cause of the expectation failure.

## Medium Priority Tasks

### 5. Performance Optimization

- **Task 3.1.1**: Implement efficient caching for processed GeoJSON data
  - Add in-memory caching for frequently accessed data
  - Implement localStorage for persistence
  - Create cache invalidation strategy

- **Task 3.2.1**: Implement level-of-detail rendering based on zoom
  - Create zoom-based rendering rules
  - Optimize point density at different zoom levels
  - Implement dynamic feature simplification

### 6. Code Quality Improvements

- **Task 5.1.1**: Set up ESLint with appropriate configuration
  - Create ESLint configuration
  - Add rules for consistent coding style
  - Configure integration with development environment

- **Task 5.3.1**: Add JSDoc comments to all public functions
  - Document function parameters and return values
  - Add usage examples where appropriate
  - Document complex algorithms and logic

## Specific Issues to Address (Maintainability)

1.  **Fix TODO items in interpolation.js** (when module is testable/build issues resolved)
    - Implement real-time NIK interpolation
    - Optimize spatial queries with proper indexing
    - Document complex spatial algorithms

2.  **Refactor DEFUNCT/outdated code**
    - Remove or update legacy functions like `parseTruckURL`
    - Replace deprecated API calls
    - Remove commented-out code (e.g., the `DOMContentLoaded` block in `webInteractions.js`)

3.  **Improve test maintainability**
    - Add more descriptive test names
    - Create helper functions for common test operations
    - Implement better mock strategies (Review existing mocks)

## Next Steps for Implementation (Updated)

1.  Address security concerns (move keys/config to env vars).
2.  Continue module separation for `webInteractions.js`.
3.  Refactor `stateManager.js` for testability.
4.  Investigate and fix the build configuration issue blocking ES module transforms.
5.  Implement error handling for async operations (Firebase, Mesonet, Mapbox).
6.  Set up test coverage reporting and refine existing tests.
7.  *(Deferred)* Write tests for `interpolation.js` and `firebaseHandler.js` once blockers are removed.
8.  Gradually implement performance optimizations and code quality improvements (Linting, Docs).

This plan prioritizes security and resolving critical architectural/build blockers before attempting currently infeasible tests or lower-priority items. 