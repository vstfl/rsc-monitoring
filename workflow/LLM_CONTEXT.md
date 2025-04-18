# Mapbox RSI - LLM Context Documentation

## Project Context

This is a web-based Road Surface Information (RSI) system built with Mapbox GL JS, focusing on road surface condition visualization and analysis. The system processes and visualizes various data sources including IDOT dashcam data and weather information.

## Technical Stack

- Frontend: JavaScript (ES6+)
- Backend: Firebase Cloud Functions (Python)
- Mapping: Mapbox GL JS v3.3.0
- Data Storage: Firebase
- Build Tool: Webpack
- Visualization: Chart.js
- State Management: Custom Pub/Sub implementation (`src/core/stateManager.js`)
- Testing: Jest, JSDOM

## Key Dependencies

- mapbox-gl: Core mapping functionality
- geoflatbush/geokdbush: Spatial indexing and querying
- firebase: Authentication and data storage
- chart.js: Data visualization
- luxon: Date/time handling
- @turf/turf: Geospatial analysis
- jest: Testing framework

## File Relationships & Structure

1.  **Entry Points**:
    *   `src/index.js`: Main entry point, imports all modules
    *   `src/startup.js`: Handles initialization and loading screen

2.  **Core Application Logic**:
    *   `src/mapInteractions.js`: Handles map setup, layers, styling, click/hover/leave events, panning.
    *   `src/webInteractions.js`: Handles form submission, data fetching orchestration (Firebase, Mesonet), prediction requests, real-time updates.
    *   `src/interpolation.js`: Contains algorithms for spatial interpolation and study area filtering.
    *   `src/firebaseHandler.js`: Manages Firebase connection, authentication, and data queries.
    *   `src/charts.js`: Sets up and updates the Chart.js doughnut chart.

3.  **Core Utilities & State**:
    *   `src/core/stateManager.js`: Central state management (Pub/Sub) for shared state (`map`, `currentGeoJSON`, `clickedPointValues`, etc.).
    *   `src/core/logger.js`: Configurable logging utility.
    *   `src/core/utils/dateTimeUtils.js`: Date/time calculation and formatting utilities (e.g., `calculateDataRange`, `DateTimeConstants`, `isDifferentDay`, `isInRange`).
    *   `src/core/utils/dataTransformUtils.js`: Data transformation utilities (e.g., `convertToGeoJSON`, `removeLettersAfterUnderscore`, `classByNumber`, `highestNumberString`).
    *   `src/core/ui/uiInteractions.js`: UI-specific event handlers and logic (e.g., `toggleConsole`, `toggleArrow`, `scrollToBottom`, `toggleStudyArea`, `toggleRealtime`, `toggleImageSrc`, `setupEventListeners`).

4.  **Testing**:
    *   `src/core/utils/__tests__/`: Unit tests for utility modules.
    *   `src/core/ui/__tests__/`: Unit tests for UI interaction module.
    *   `src/core/__tests__/`: Unit tests for core modules like `stateManager`, `logger`.
    *   `src/__tests__/`: Contains integration tests (e.g., `interactions.test.js`).

5.  **Other**:
    *   `src/styles.css`: Main application styles.
    *   `src/template.html`: Main HTML structure.

## Data Flow

1.  **Query Initiation** (`webInteractions.js`):
    *   User submits form (date, window size) or real-time interval triggers.
    *   `startQuery` orchestrates the process.
    *   `calculateDataRange` determines time bounds.
2.  **Data Fetching** (`webInteractions.js`, `firebaseHandler.js`):
    *   `queryImagesByDateRange` fetches existing data from Firebase.
    *   `mesonetGETAVL` / `mesonetScrapeRWISv2` fetch latest image availability from Mesonet.
3.  **Prediction Check** (`webInteractions.js`):
    *   `predictionExistsAVL` / `predictionExistsRWIS` compare Firebase data and Mesonet data.
    *   If new images need predictions, `sendPredictionsAVL` / `sendPredictionsRWIS` POST to backend (via `postRequestToBackend`).
4.  **GeoJSON Conversion** (`webInteractions.js` -> `dataTransformUtils.js`):
    *   `updateAll` calls `convertToGeoJSON` with the *Firebase* data (AVL & RWIS).
    *   `convertToGeoJSON` processes AVL points and RWIS points (grouping by station, finding most recent angle) into a GeoJSON FeatureCollection.
        *   **Important:** Properties like `angles` (RWIS) and `classes` (AVL) are stored as *objects* in the GeoJSON properties.
5.  **Map Update** (`webInteractions.js` -> `mapInteractions.js`):
    *   `updateAll` calls `updateMapData` with the new GeoJSON.
    *   `updateMapData` updates the map source (`latestSource`), adds the layer (`latestLayer`), and pans (`panToAverage`).
6.  **User Interaction** (`mapInteractions.js`):
    *   `click`, `mousemove`, `mouseleave` events query map features.
    *   Handlers extract feature properties.
    *   **Important:** Because Mapbox may stringify object properties, the handlers *re-parse* `properties.angles` and `properties.classes` if they are strings.
    *   Update `clickedPointValues` state.
    *   Update UI elements (ID, timestamp, image) and chart (`addData` in `charts.js`, which now expects an *object* for class data).

## State Management

(Content remains largely the same, but re-emphasize key state elements affected by recent changes)

1.  Key State Elements:
    *   `map`: The Mapbox GL JS map instance
    *   `currentGeoJSON`: Current point data being displayed (structured by `convertToGeoJSON`)
    *   `currentInterpolation`: Current interpolated data
    *   `studyAreaState`: Whether to filter points to the study area
    *   `clickedPointValues`: Information about the currently selected/hovered point.
        *   Contains properties like `type`, `specificID`, `avlID`, `timestamp`, `classification`, `classes` (object), `image`, and `CAM`.

## Key Functions and Their Purposes

(Update descriptions based on refactoring)

1.  Map Interactions (`mapInteractions.js`):
    *   (Existing descriptions are mostly accurate, ensure `handleMapClick/mousemove/leave` reflects parsing logic)

2.  Web Interactions (`webInteractions.js`):
    *   `startQuery()`: Orchestrates data query/fetch/prediction/update flow.
    *   `updateRealtimeData()`: Handles periodic updates in real-time mode.
    *   `sendPredictionsAVL/RWIS()`: Sends data to backend for prediction.
    *   `postRequestToBackend()`: Handles actual fetch POST request logic.
    *   `mesonetGETAVL/mesonetScrapeRWISv2()`: Fetch data from external Mesonet source.
    *   `predictionExistsAVL/RWIS()`: Logic to determine which images need prediction.

3.  Utilities (`core/utils/...`):
    *   `dateTimeUtils.js`: `calculateDataRange`, `DateTimeConstants`, `isDifferentDay`, `isInRange`.
    *   `dataTransformUtils.js`: `convertToGeoJSON` (key data structuring logic), `removeLettersAfterUnderscore`, `classByNumber`, `highestNumberString`.

4.  UI Interactions (`core/ui/uiInteractions.js`):
    *   `setupEventListeners()`: Attaches listeners for controls.
    *   `toggleConsole`, `toggleArrow`, `scrollToBottom`, `toggleStudyArea`, `toggleRealtime`, `toggleImageSrc`: Handle specific UI element interactions and associated state updates.

5.  Charts (`charts.js`):
    *   `addData()`: Updates the chart with classification data (now expects an *object*).

## Feature Implementations

(Update paths and details)

### RWIS Image Toggling

1.  Implementation:
    *   User clicks on an RWIS camera image.
    *   `toggleImageSrc()` in `src/core/ui/uiInteractions.js` is triggered (via event listener set up in `setupEventListeners`).
    *   Current `clickedPointValues` is retrieved from state manager.
    *   Image URL is transformed to/from the GradCAM version.
    *   The `CAM` flag and `image` URL are updated in `clickedPointValues` state.

### Key Bug Fixes (Recent)

*   **GeoJSON Data Structure:** Fixed `convertToGeoJSON` to correctly extract coordinates (`Position` for AVL, `Coordinates` for RWIS) and structure RWIS angle data.
*   **Event Handler Parsing:** Addressed errors in `click`, `mousemove`, and `mouseleave` handlers in `mapInteractions.js` where object properties (`angles`, `classes`) stored in GeoJSON features were being treated as strings by Mapbox. Added defensive `JSON.parse()` logic within the handlers.
*   **Chart Data Input:** Modified `addData` in `charts.js` to primarily expect an object for class probabilities, resolving JSON parsing errors when receiving data from event handlers.
*   **Initial Image Load:** Removed redundant `DOMContentLoaded` listener in `webInteractions.js` that caused errors when `toggleImageSrc` was called before state was ready.

## Data Structures

1.  Point Data (GeoJSON - Post `convertToGeoJSON`):
    ```javascript
    {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: number, // Mapbox generated ID
          geometry: { type: "Point", coordinates: [longitude, latitude] },
          properties: {
            // --- Common Properties ---
            id: "string", // Original Station/Vehicle ID (e.g., "IDOT-XXX", "AVL-YYY")
            type: "AVL" | "RWIS",
            specificID: "string", // Often same as id or feature.id, used for state tracking
            timestamp: number, // Unix timestamp
            classification: "Bare" | "Partly" | "Full" | "Undefined", // Overall/Most Recent Classification
            image: "string", // URL for the primary image to display
            classes: { // Object containing class probabilities
              "Undefined": number,
              "Bare": number,
              "Partly": number,
              "Full": number
            },
            // --- RWIS Specific Properties ---
            recentAngle: "string", // Key for the most recent angle in the angles object
            angles: { // Object containing data for each camera angle
              "angleKey": {
                angle: "string",
                timestamp: number,
                url: "string",
                class: { /* Class probabilities */ },
                classification: "string",
                gradcam: "string" // URL or identifier
              }, 
              // ... other angles
            }
          }
        }
      ]
    }
    ```

2.  Interpolation Data: (Seems unchanged)

3.  ClickedPointValues: (Reflects parsed data)
    ```javascript
    {
      type: "AVL" | "RWIS",
      specificID: number, 
      avlID: string, 
      timestamp: string, // Formatted
      classification: string, 
      classes: object, // Parsed object, not string
      image: string, 
      CAM: boolean 
    }
    ```

## Common Patterns

(Largely unchanged, but parsing in event handlers is a new pattern)

## Performance Considerations

(Unchanged by recent work)

## Security Context

(Unchanged by recent work)
