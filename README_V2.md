# Mapbox RSI - Road Surface Information System

## Overview

This project is a lightweight re-implementation of DemoRSI using Mapbox, designed to provide road surface information visualization and analysis. The system integrates various data sources including IDOT dashcam data and weather information to provide comprehensive road surface insights.

## Project Structure

```
mapbox-rsi/
├── src/                    # Source code directory
│   ├── index.js           # Main entry point
│   ├── startup.js         # Initialization and loading screen
│   ├── mapInteractions.js # Map-related functionality
│   ├── webInteractions.js # UI interactions and controls
│   ├── interpolation.js   # Data interpolation algorithms
│   ├── firebaseHandler.js # Firebase integration
│   ├── charts.js          # Data visualization components
│   ├── styles.css         # Styling
│   └── template.html      # HTML template
├── functions/             # Firebase Cloud Functions
│   ├── main.py           # Python backend functions
│   └── requirements.txt  # Python dependencies
├── dist/                  # Built/compiled files
├── docs/                  # Built/compiled files for production
└── webpack.*.js          # Webpack configuration files
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Python 3.x (for Firebase Functions)
- Firebase account and project setup

## Installation

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd mapbox-rsi
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project
   - Copy your Firebase configuration to `src/firebaseHandler.js`
   - Install Firebase Functions dependencies:
     ```bash
     cd functions
     pip install -r requirements.txt
     ```

## Development Workflow

### Option 1: Using webpack-dev-server (Recommended)

1. Install development dependencies:

   ```bash
   npm install --save-dev webpack-dev-server
   ```

2. Start development server:
   ```bash
   npm run dev
   ```
   This will:
   - Start webpack-dev-server on port 9000
   - Automatically open your default browser to http://localhost:9000
   - Enable hot module replacement (HMR) for instant updates
   - Watch for file changes and rebuild automatically
   - Serve files from the `/dist` directory

### Option 2: Using Live Server Extension

1. Build the project:

   ```bash
   npm run dev
   ```

   This will create the necessary files in the `/dist` directory.

2. Open `dist/index.html` with Live Server:

   - Right-click on `dist/index.html`
   - Select "Open with Live Server"
   - The website will open in your default browser
   - Live Server will automatically reload when files change

3. Access the development website:

   - The website will be available at http://localhost:5500 (default Live Server port)
   - You can see build errors and warnings in the browser console
   - Note: You'll need to manually rebuild (run `npm run dev`) when making changes to see updates

4. Build for production:

   ```bash
   npm run build
   ```

   This will:

   - Build the optimized production version
   - Output directly to the `/docs` directory
   - Ready for GitHub Pages deployment

5. Deploy to GitHub Pages:
   - The `/docs` folder is automatically served by GitHub Pages
   - Simply commit and push your changes to trigger a new deployment
   - No additional deployment steps needed

## Key Features

- Interactive Mapbox-based visualization
- Real-time weather data integration
- Road surface condition analysis
- Data interpolation for missing values
- Chart-based data visualization
- Firebase authentication and data storage

## Data Sources

- IDOT Dashcam Data (`idot_dashcam.json`)
- Weather data (via API integration)
- User-generated data (stored in Firebase)

## Code Organization

- `mapInteractions.js`: Handles all map-related functionality including:

  - Layer management
  - Marker placement
  - Map controls
  - Data visualization on map

- `webInteractions.js`: Manages user interface interactions:

  - Control panel functionality
  - Data filtering
  - User input handling
  - Dynamic UI updates

- `interpolation.js`: Contains algorithms for:

  - Data interpolation
  - Missing value handling
  - Spatial analysis

- `firebaseHandler.js`: Manages:
  - Authentication
  - Data storage
  - Real-time updates
  - User preferences

## Testing

Currently, the project uses a basic test setup. To run tests:

```bash
npm test
```

## Deployment

The project uses GitHub Pages for hosting, with the `/docs` folder serving as the deployment target:

1. Build the project:

   ```bash
   npm run build
   ```

   This automatically builds to the `/docs` directory

2. Commit and push your changes:

   ```bash
   git add docs/
   git commit -m "Update production build"
   git push
   ```

3. GitHub Pages will automatically serve the new version from the `/docs` directory

Note: The `/docs` directory is the production build target, while `/dist` is used for development builds.

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## Troubleshooting

Common issues and solutions:

1. Map not loading: Check Mapbox token configuration
2. Firebase connection issues: Verify Firebase configuration
3. Build errors: Ensure all dependencies are installed

## License

ISC License - See LICENSE file for details

## Contact

For questions or support, please contact Michael Urbiztondo
