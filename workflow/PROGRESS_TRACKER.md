# RSI Project Progress Tracker

## Priority Change Areas (Re-prioritized based on Code Review)

1. **Security Improvements**
   - [ ] **(Highest)** Move credentials (Mapbox, Firebase) to environment variables
   - [ ] Implement secure authentication flows (Lower Priority)
   - [ ] Add input validation (Medium Priority)

2. **Code Organization and Architecture**
   - [ ] **(High)** Refactor `stateManager.js` for testability (add reset/clear)
   - [ ] **(High)** Complete refactor of `webInteractions.js` (Split API, UI logic)
   - [ ] **(High)** Refactor `mapInteractions.js` (Separate map logic from DOM updates)
   - [ ] **(High)** Decouple UI panel updates from `mapInteractions` (Use state-driven updates in `uiInteractions`)
   - [x] Analyze circular dependencies (Done)
   - [x] Create state manager (Done)
   - [x] Implement state management pattern (Done)
   - [x] Create clear module separation (Core utils/ui done, *needs more module splitting*)

3. **Testing Infrastructure & Build Fixes**
   - [ ] **(High)** Fix Jest/Babel build config for ES Module transformation (e.g., `kdbush`)
   - [ ] Add unit tests for `interpolation.js` (Blocked by build config)
   - [ ] Add unit tests for `firebaseHandler.js` (Needs strategy - mocking?)
   - [ ] Add unit tests for refactored modules (`apiService`, `mapLogic`, `uiPanel`)
   - [ ] Refine integration tests (`src/__tests__/interactions.test.js`) for new architecture
   - [x] Set up testing framework (Done)
   - [x] Create unit tests for core functionality (Done: `stateManager`, `logger`, `dateTimeUtils`, `dataTransformUtils`, `uiInteractions` - *but `stateManager` test limited*)
   - [x] Create test documentation (Done - *may need update*)

4. **Error Handling**
   - [ ] **(High)** Implement robust `try/catch` for critical async operations (Firebase query, Mesonet, Backend warmup, Mapbox init)
   - [ ] **(Medium)** Implement comprehensive `try/catch` for *all* remaining async operations
   - [ ] **(Medium)** Implement user-friendly error messages/feedback
   - [x] Add error handling to state manager (Done)
   - [x] Added error handling in some event handlers (Done - *partially*)

5. **Code Quality**
   - [ ] **(Medium)** Standardize code style with ESLint/Prettier
   - [ ] **(Medium)** Create `constants.js` module (remove magic strings/URLs)
   - [ ] **(Medium)** Improve documentation with JSDoc (start with core/refactored modules)
   - [ ] Address TODOs (e.g., in `interpolation.js`)
   - [ ] Remove commented-out/dead code
   - [ ] Remove inline styles (`template.html`)
   - [x] Remove code duplication (Core utils extracted - *needs ongoing effort*)

6. **Performance Optimization**
   - [ ] **(Medium)** Implement map rendering optimizations (clustering / zoom filtering)
   - [ ] **(Medium)** Parallelize independent fetches (e.g., Mesonet checks in `checkAndTriggerPredictions`)
   - [ ] **(Medium)** Add caching for `loadSubdividedRoads`
   - [ ] **(Low)** Add loading indicators for background tasks
   - [ ] Move heavy computations to Web Workers (Lower Priority)

## Completed Tasks (Summary - Keep Existing Detail Below if Preferred)

- Initial setup (Testing framework, state manager, logger, core utils)
- Partial refactoring (State manager integration, core utils extraction)
- Basic error handling added (State manager, some event handlers)
- Basic tests for core utils/state manager implemented
- Several UI features/bug fixes implemented (Hover popup, aspect ratio, angle switching, etc.)

## Current Sprint Focus (Revised Priorities)

1.  **Security:** Move all keys/config to environment variables.
2.  **Build:** Fix Jest/Babel build config for ES Modules.
3.  **Architecture:** Refactor `stateManager.js` for testability.
4.  **Error Handling:** Add robust `try/catch` to critical async paths.
5.  **Refactoring:** Start splitting `webInteractions` and decouple UI panel updates from `mapInteractions`.

## Next Steps (Pending Current Sprint)

1.  Complete refactoring of `webInteractions` & `mapInteractions`.
2.  Implement comprehensive error handling & user feedback.
3.  Write tests for `interpolation.js` and refactored modules.
4.  Implement ESLint/Prettier & `constants.js`.
5.  Begin performance optimizations (Map rendering, parallel fetches).
