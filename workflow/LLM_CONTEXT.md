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
- State Management: Custom Pub/Sub implementation

## Key Dependencies

- mapbox-gl: Core mapping functionality
- geoflatbush/geokdbush: Spatial indexing and querying
- firebase: Authentication and data storage
- chart.js: Data visualization
- luxon: Date/time handling
- @turf/turf: Geospatial analysis

## File Relationships

1. Entry Points:

   - `src/index.js`: Main entry point, imports all modules
   - `src/startup.js`: Handles initialization and loading screen

2. Core Modules:
   - `src/core/stateManager.js`: Central state management and event bus
   - `mapInteractions.js` ↔ `webInteractions.js`: Bidirectional communication for map-UI sync
   - `interpolation.js` → `mapInteractions.js`: Provides interpolated data for visualization
   - `firebaseHandler.js` → `webInteractions.js`: Supplies data and authentication state
   - `charts.js` → `webInteractions.js`: Renders data visualizations

## Data Flow

1. Data Sources:

   - Static: `idot_dashcam.json`
   - Dynamic: Firebase realtime database
   - External: Weather API

2. Processing Pipeline:
   - Raw data → Interpolation → Visualization → User interaction

## Key Functions and Their Purposes

1. Map Interactions (`mapInteractions.js`):

   - `initializeMap()`: Sets up Mapbox instance
   - `addLayer()`: Manages map layers
   - `updateMarkers()`: Handles marker placement
   - `handleMapClick()`: Processes user map interactions

2. Web Interactions (`webInteractions.js`):

   - `setupControls()`: Initializes UI controls
   - `handleFilterChange()`: Processes data filtering
   - `updateUI()`: Reflects state changes in UI
   - `loadData()`: Manages data loading and processing

3. Interpolation (`interpolation.js`):

   - `interpolateData()`: Main interpolation algorithm
   - `findNearestPoints()`: Spatial querying
   - `calculateWeights()`: Weight calculation for interpolation

4. Firebase Handler (`firebaseHandler.js`):
   - `initializeFirebase()`: Sets up Firebase connection
   - `authenticateUser()`: Handles user authentication
   - `saveData()`: Stores user data
   - `loadUserData()`: Retrieves user-specific data

## State Management

1. Centralized State:

   - Map instance
   - Current filters
   - User authentication state
   - Active data set
   - UI state (control panel, time range, etc.)

2. State Updates:

   - Pub/Sub pattern for cross-module communication
   - State changes trigger UI updates
   - Event-based architecture for loose coupling

3. State Access:
   - Modules subscribe to state changes
   - State updates through centralized manager
   - Immutable state updates

## Data Structures

1. Map Data:

   ```javascript
   {
     type: "FeatureCollection",
     features: [
       {
         type: "Feature",
         geometry: {
           type: "Point",
           coordinates: [longitude, latitude]
         },
         properties: {
           timestamp: "ISO8601",
           surface_condition: "string",
           weather_data: {}
         }
       }
     ]
   }
   ```

2. Interpolation Data:
   ```javascript
   {
     points: [
       {
         id: "string",
         coordinates: [longitude, latitude],
         value: number,
         timestamp: "ISO8601"
       }
     ],
     parameters: {
       radius: number,
       method: "string"
     }
   }
   ```

## Common Patterns

1. Event Handling:

   - Map events → State update → UI refresh
   - User input → Data processing → Visualization update

2. Data Processing:

   - Raw data → Filter → Interpolate → Visualize
   - Time series → Aggregate → Chart

3. Error Handling:
   - Try-catch blocks for API calls
   - Fallback mechanisms for missing data
   - Graceful degradation for unsupported features

## Performance Considerations

1. Spatial Indexing:

   - Uses geoflatbush for efficient spatial queries
   - Implements bounding box optimization

2. Data Loading:

   - Progressive loading for large datasets
   - Caching of frequently accessed data
   - Lazy loading of map layers

3. Rendering:
   - Layer-based rendering optimization
   - Marker clustering for dense areas
   - Conditional rendering based on zoom level

## Security Context

1. Authentication:

   - Firebase Authentication integration
   - Role-based access control
   - Secure token management

2. Data Protection:
   - Input validation
   - Output sanitization
   - Secure API communication

## Testing Context

1. Unit Tests:

   - Focus on interpolation algorithms
   - Data processing functions
   - Utility functions

2. Integration Tests:
   - Map-UI interaction
   - Data flow between components
   - Firebase integration

## Deployment Context

1. Build Process:

   - Webpack configuration for development/production
   - Development builds (`npm run dev`) output to `/dist`
   - Production builds (`npm run build`) output to `/docs`
   - Asset optimization and code splitting

2. Environment:

   - GitHub Pages hosting from `/docs` directory
   - Automatic deployment on push to main branch
   - No manual deployment steps required
   - Development environment uses `/dist` for testing

3. Build Configuration:

   - `webpack.dev.js`: Development config → `/dist`
   - `webpack.prod.js`: Production config → `/docs`
   - Same entry point and plugins for both
   - Production builds are optimized

4. Deployment Workflow:
   - Local development: `npm run dev` → `/dist`
   - Production build: `npm run build` → `/docs`
   - Commit and push changes
   - GitHub Pages automatically serves from `/docs`
