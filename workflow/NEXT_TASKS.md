# Next Tasks & Priorities

Based on the recent comprehensive code review, priorities have been re-evaluated to address critical issues and set the stage for robust development.

## Phase 1: Critical Fixes & Foundation (Immediate Focus)

These tasks are essential for security, stability, and enabling further development and testing.

1.  **[Security] Extract Keys/Config to Environment Variables:** *(Highest Priority)*
    *   **Goal:** Remove hardcoded Mapbox token and Firebase config.
    *   **Action:** Use `.env` files and Webpack `DefinePlugin`.
    *   **Files:** `mapInteractions.js`, `firebaseHandler.js`, `webpack.config.js`.

2.  **[Build] Fix Jest/Babel Configuration:** *(High Priority)*
    *   **Goal:** Resolve ES Module transformation errors (e.g., `kdbush` in `interpolation.js`).
    *   **Action:** Update Jest/Babel config (`jest.config.js`, `babel.config.js` or `package.json`).
    *   **Files:** `jest.config.js`, potentially Babel config.

3.  **[Architecture] Refactor `stateManager.js` for Testability:** *(High Priority)*
    *   **Goal:** Allow resetting state between tests.
    *   **Action:** Add a `reset()` or `clear()` method, conditionally exported/enabled for test environments.
    *   **Files:** `src/core/stateManager.js`, relevant test files.

4.  **[Error Handling] Implement Robust `try/catch` on Critical Paths:** *(High Priority)*
    *   **Goal:** Prevent application crashes from failed external calls.
    *   **Action:** Wrap critical `fetch` calls (Firebase query, Mesonet, Backend warmup) and Mapbox initialization in `try/catch` blocks with basic logging.
    *   **Files:** `firebaseHandler.js`, `webInteractions.js`, `mapInteractions.js`.

5.  **[Refactoring] Start `webInteractions.js` Split (API Service):** *(High Priority)*
    *   **Goal:** Begin breaking down `webInteractions.js` by extracting API call logic.
    *   **Action:** Create `src/core/apiService.js` (or similar) and move Mesonet/Backend fetch logic there. Update `webInteractions.js` to use the service.
    *   **Files:** `webInteractions.js`, `src/core/apiService.js` (new).

6.  **[Refactoring] Decouple UI Panel Updates from `mapInteractions.js`:** *(High Priority)*
    *   **Goal:** Ensure map logic doesn't directly manipulate side panel DOM.
    *   **Action:** Move all DOM updates related to the point info panel (image, text, chart trigger) into `uiInteractions.js`. Make these updates react purely to changes in the `clickedPointValues` state.
    *   **Files:** `mapInteractions.js`, `src/core/ui/uiInteractions.js`.

## Phase 2: Core Refactoring & Stability (Near Term)

Focus on completing the major refactoring, improving code quality, and enabling comprehensive testing.

7.  **[Refactoring] Complete `webInteractions.js` & `mapInteractions.js` Split:** *(High Priority)*
    *   **Goal:** Fully separate concerns into smaller, manageable modules.
    *   **Action:** Extract form handling, NIK logic, etc., from `webInteractions`. Ensure `mapInteractions` focuses solely on map setup, layers, and state updates.
    *   **Files:** `webInteractions.js`, `mapInteractions.js`, potentially new modules.

8.  **[Error Handling] Comprehensive Implementation & User Feedback:** *(Medium Priority)*
    *   **Goal:** Handle errors gracefully across the application.
    *   **Action:** Wrap remaining async operations. Add basic user feedback for critical errors (e.g., toast notification, message area).
    *   **Files:** Various modules.

9.  **[Code Quality] Implement ESLint/Prettier & Constants:** *(Medium Priority)*
    *   **Goal:** Enforce style consistency and remove magic strings.
    *   **Action:** Set up ESLint/Prettier. Create `src/core/constants.js` and replace hardcoded URLs, IDs, etc.
    *   **Files:** Config files, potentially all JS files.

10. **[Testing] Add Unit Tests for `interpolation.js` & Refactored Modules:** *(Medium Priority)*
    *   **Goal:** Increase test coverage for core logic.
    *   **Action:** Write tests now that build config is fixed and modules are smaller.
    *   **Files:** `__tests__` directory.

11. **[Testing] Refine Integration Tests:** *(Medium Priority)*
    *   **Goal:** Ensure integration tests reflect the new architecture.
    *   **Action:** Update `interactions.test.js` to mock dependencies at the new module boundaries.
    *   **Files:** `src/__tests__/interactions.test.js`.

## Phase 3: Optimization & Feature Hardening (Medium Term)

Enhance performance, address technical debt, and improve user experience.

12. **[Performance] Implement Map Rendering Optimizations:** *(Medium Priority)*
13. **[Performance] Parallelize Independent Fetches:** *(Medium Priority)*
14. **[Performance] Add Caching for `loadSubdividedRoads`:** *(Medium Priority)*
15. **[Code Quality] Address TODOs & Add JSDoc:** *(Medium Priority)*
16. **[UI] Add Loading Indicators for Background Tasks:** *(Low Priority)*

## Phase 4: Advanced & Long Term

Consider larger architectural changes and final polishing.

17. **[Architecture] Evaluate Component-Based Architecture:** *(Low Priority)*
18. **[Testing] Implement E2E Testing (e.g., Cypress):** *(Low Priority)*
19. **[Code Quality] Address Remaining Items:** *(Low Priority)* 