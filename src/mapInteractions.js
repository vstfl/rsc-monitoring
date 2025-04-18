import mapboxgl from "mapbox-gl";
import { DateTime } from "luxon";
import { scrollToBottom } from "./webInteractions";
import { addData, removeData, newChart } from "./charts.js";
import RainLayer from "mapbox-gl-rain-layer";
import { filterStudyArea } from "./interpolation.js";
import { getState, setState, subscribe } from "./core/stateManager.js";
import Logger from './core/logger.js';
const CONTEXT = 'MapInteractions';

/**
 * Handle's the majority of relevant map interactions for the user.
 *
 * This includes (in this order):
 * - Map Initialization
 * - Map Functions (Panning to points)
 * - Map Styling/Sourcing (Style updates, Layer/GeoJSON source updates)
 * - Point Interactivity (Point Hover, Point Click)
 * - UI Updates (Triggered by a map interaction, Chart updates, point information)
 * - Miscellaneous Map Updates (Real-time views (i.e. rain, new data sources [to-do]))
 */

// Initialize map instance
mapboxgl.accessToken =
  "pk.eyJ1IjoidXJiaXp0b24iLCJhIjoiY2xsZTZvaXd0MGc4MjNzbmdseWNjM213eiJ9.z1YeFXYSbaMe93SMT6muVg";

let map;

try {
  map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/urbizton/clve9aeu900c501rd7qcn14q6", // Default Dark
    center: [-94.53, 41.99],
    zoom: 6.4,
    maxZoom: 18,
  });
  
  // Add listener for map errors (like style loading failure)
  map.on('error', (e) => {
      // Log the underlying error object using the Logger
      Logger.error('Mapbox GL Error', CONTEXT, e.error || e);
      // Optionally: Display a user-friendly message on the UI
      // Example: document.getElementById('map-error-message').textContent = 'Map failed to load. Please try refreshing.';
  });

  // Set initial state only if map initialized successfully
  setState("map", map);
  setState("currentGeoJSON", null);
  setState("currentInterpolation", null);

  // Add map controls only if map initialized successfully
  map.addControl(
    new mapboxgl.NavigationControl({ visualizePitch: true }),
    "bottom-right",
  );
  map.addControl(new mapboxgl.ScaleControl({ maxWidth: 300, unit: "imperial" }));
  map.addControl(
    new mapboxgl.FullscreenControl({ container: document.querySelector("body") }),
    "bottom-right",
  );

  // Attach style.load listener only if map initialized successfully
  map.on("style.load", () => {
    const map = getState("map");
    if (!map) return;

    map.resize();
    console.log("Map resized");

    const currentGeoJSON = getState("currentGeoJSON");
    const currentInterpolation = getState("currentInterpolation");

    if (currentGeoJSON) updateMapData(currentGeoJSON);
    if (currentInterpolation) updateInterpolation(currentInterpolation);
  });

} catch (initializationError) {
    // Catch errors during the map constructor itself (less common)
    Logger.error('Fatal Mapbox GL Initialization Error', CONTEXT, initializationError);
    // Display a critical error message to the user
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Error initializing map. Please refresh the page.</div>';
    }
    // Prevent further map-related operations if initialization failed
    map = null; // Ensure map variable is null
}

// Export the map instance (might be null if init failed)
export { map };

// When user clicks home, pans back to iowa
function panToIowa() {
  const map = getState("map");
  if (!map) return;

  map.flyTo({
    center: [-94.53, 41.99],
    zoom: 6.7,
    pitch: 0,
    bearing: 0,
  });
}

document
  .getElementById("center-iowa")
  ?.addEventListener("click", function (event) {
    event.preventDefault();
    panToIowa();
  });

function panToAverage(coordinates) {
  const map = getState("map");
  if (!map) {
    Logger.error("[panToAverage] Map state is not available.", CONTEXT);
    return;
  }

  Logger.debug(`[panToAverage] Received ${coordinates?.length || 0} coordinates.`, CONTEXT);
  if (!coordinates || coordinates.length === 0) {
    Logger.warn("[panToAverage] No coordinates provided, cannot pan.", CONTEXT);
    return; 
  }

  let sumLong = 0;
  let sumLat = 0;
  let validCoordsCount = 0;

  for (let i = 0; i < coordinates.length; i++) {
    if (coordinates[i] && typeof coordinates[i][0] === 'number' && typeof coordinates[i][1] === 'number' && !isNaN(coordinates[i][0]) && !isNaN(coordinates[i][1])) {
      sumLong += coordinates[i][0]; // longitude
      sumLat += coordinates[i][1]; // latitude
      validCoordsCount++;
    } else {
      Logger.warn(`[panToAverage] Skipping invalid coordinate pair at index ${i}:`, CONTEXT, coordinates[i]);
    }
  }

  if (validCoordsCount === 0) {
    Logger.warn("[panToAverage] No valid coordinates found, cannot calculate average.", CONTEXT);
    return; 
  }

  const avgLongitude = sumLong / validCoordsCount;
  const avgLatitude = sumLat / validCoordsCount;
  Logger.debug(`[panToAverage] Calculated average LngLat: [${avgLongitude}, ${avgLatitude}]`, CONTEXT);

  Logger.debug("[panToAverage] Easing map to average coordinates...", CONTEXT);
  map.easeTo({
    center: [avgLongitude, avgLatitude],
    zoom: 6.5, // Consider if zoom needs adjustment based on data bounds
    duration: 800 // Adjusted duration slightly
  });
}

// Obtain list of all coordinates from geoJSON
function extractCoordinatesFromGeoJSON(geoJSON) {
  if (geoJSON.type === "FeatureCollection") {
    return geoJSON.features.map((feature) => feature.geometry.coordinates);
  } else if (geoJSON.type === "Feature") {
    return [geoJSON.geometry.coordinates];
  } else {
    return [];
  }
}

// Handle update of map data
async function updateMapData(newGeoJSON) {
  const map = getState("map");
  if (!map) {
    console.error("[updateMapData] Map state is not available.");
    return;
  }
  console.log("[updateMapData] Received GeoJSON with features:", newGeoJSON?.features?.length);
  // Optional: Deep log for debugging
  // console.log("[updateMapData] GeoJSON input:", JSON.stringify(newGeoJSON));

  setState("currentGeoJSON", newGeoJSON);

  // Need to add filter here to only visualize data that lies on the study area
  const studyAreaState = getState("studyAreaState");
  
  if (studyAreaState) {
    console.log("[updateMapData] Filtering GeoJSON to study area...");
    newGeoJSON = await filterStudyArea(newGeoJSON);
    console.log("[updateMapData] Filtered GeoJSON features:", newGeoJSON?.features?.length);
  }

  if (map.getLayer("latestLayer")) {
    console.log("[updateMapData] Removing existing layer: latestLayer");
    map.removeLayer("latestLayer");
  }
  if (map.getSource("latestSource")) {
    console.log("[updateMapData] Removing existing source: latestSource");
    map.removeSource("latestSource");
  }
  console.log("[updateMapData] Adding new point layer...");
  // console.log("[updateMapData] GeoJSON for layer:", JSON.stringify(newGeoJSON));
  addPointLayer(newGeoJSON);
  
  const coordinates = extractCoordinatesFromGeoJSON(newGeoJSON);
  console.log(`[updateMapData] Extracted ${coordinates.length} coordinates for panning.`);
  panToAverage(coordinates);
  console.log("[updateMapData] Map data update complete.");
}

// Same as above but specifically for interpolation data
function updateInterpolation(interpolationGeoJSON) {
  const map = getState("map");
  if (!map) return;

  setState("currentInterpolation", interpolationGeoJSON);

  if (map.getLayer("latestInterpolationLayer")) {
    map.removeLayer("latestInterpolationLayer");
  }
  if (map.getSource("latestInterpolation")) {
    map.removeSource("latestInterpolation");
  }
  addInterpolationLayer(interpolationGeoJSON);
  // console.log(interpolationGeoJSON);
}

// Customize visualization/interactivity of geoJSON data here
function addInterpolationLayer(interpolationGeoJSON) {
  map.addSource("latestInterpolation", {
    type: "geojson",
    data: interpolationGeoJSON,
    generateId: true, // Ensure that each feature has a unique ID at the PROPERTY level
    tolerance: 0,
  });

  map.addLayer(
    {
      id: "latestInterpolationLayer",
      type: "line",
      source: "latestInterpolation",
      layout: {
        visibility: "visible",
        "line-cap": "square",
        "line-join": "round",
        "line-sort-key": [
          "match",
          ["get", "classification"],
          "Undefined",
          0,
          "Bare",
          4,
          "Partly",
          3,
          "Full",
          2,
          0,
        ],
      },
      paint: {
        "line-color": [
          "match",
          ["get", "classification"],
          "Undefined",
          "#554f56",
          "Bare",
          "#80B932",
          "Partly",
          "#EFC44E",
          "Full",
          "#E51000",
          "#554f56",
        ],
        "line-width": 3,
        "line-offset": 2,
      },
    },
    "latestLayer",
  );
}

// Customize visualization/interactivity of geoJSON data here
function addPointLayer(geojsonSource) {
  map.addSource("latestSource", {
    type: "geojson",
    data: geojsonSource,
    generateId: true, // Ensure that each feature has a unique ID at the PROPERTY level
  });

  map.addLayer({
    id: "latestLayer",
    type: "circle",
    source: "latestSource",
    layout: {
      visibility: "visible",
    },
    paint: {
      "circle-color": [
        "match",
        ["get", "classification"],
        "Undefined",
        "#554f56",
        "Bare",
        "#80B932",
        "Partly",
        "#EFC44E",
        "Full",
        "#E51000",
        "#554f56",
      ],
      "circle-radius": [
        "match",
        ["get", "type"],
        "RWIS",
        [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          16, // Larger when true
          14,
        ],
        [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          12, // Larger when true
          6,
        ],
      ],
      "circle-stroke-width": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        2,
        0.5,
      ],
      "circle-stroke-color": "#242225",
      // "circle-sort-key": ["to-number", "timestamp"],
    },
  });
}

// Handle map style change
document.addEventListener("DOMContentLoaded", function () {
  const radios = document.querySelectorAll('.map-styles input[type="radio"]');

  radios.forEach((radio) => {
    radio.addEventListener("click", function () {
      if (this.checked) {
        const mapStyle = this.value;
        setMapStyle(mapStyle);
      }
    });
  });

  function setMapStyle(style) {
    const map = getState("map");
    if (!map) return;
    map.setStyle("mapbox://styles/urbizton/" + style);
    console.log("Map style set to:", style);
  }
});

// Handle point interactivity
let pointID = null;
let uniqueID = null;
let clickedPoint = false;
let stateCAM = false;

// Initialize UI elements
const chart = newChart();
setState('chart', chart); // Store chart instance in state

// Variable to hold the hover popup
let hoverPopup = null; 

// General point interactivity
map.on("mouseleave", "latestLayer", () => {
  const map = getState("map");
  if (!map) return;

  map.getCanvas().style.cursor = "default";

  if (uniqueID) {
    map.setFeatureState(
      { source: "latestSource", id: uniqueID },
      { hover: false },
    );
  }
  
  // Remove hover popup when mouse leaves the layer
  if (hoverPopup) {
    hoverPopup.remove();
    hoverPopup = null;
  }
});

map.on("click", "latestLayer", (event) => {
  const map = getState("map");
  if (!map) return;

  const features = map.queryRenderedFeatures(event.point, {
    layers: ["latestLayer"],
  });
  if (!features.length) return; // No features clicked

  const feature = features[0];
  const coordinate = feature.geometry.coordinates;
  // scrollToBottom(); // REMOVED - UI concern, should be handled elsewhere if needed

  // Unset hover state for previously clicked point
  const previouslyClicked = getState("clickedPointValues");
  if (previouslyClicked && previouslyClicked.specificID) {
    map.setFeatureState(
      { source: "latestSource", id: previouslyClicked.specificID },
      { hover: false }, 
    );
  }

  // Ease map view - REMOVED padding calculation and map.easeTo related to console state
  // Panning/zooming on click might be desired, but console-aware padding is a UI concern.
  // Simple centering can be done if needed:
  map.easeTo({ 
      center: coordinate,
      zoom: Math.max(map.getZoom(), 10), // Zoom in slightly if zoomed out
      duration: 600
  });

  clickedPoint = true; // Keep track locally if needed, though state drives UI

  // Prepare data object for state update
  const eventProperties = feature.properties;
  Logger.debug("[Click] Feature Properties (Raw):", CONTEXT, eventProperties);

  let newClickedPointValues = null;
  let imageUrl = null;
  let classData = {};
  
  try { // Process properties and set newClickedPointValues 
     if (eventProperties.type === "AVL") {
          imageUrl = eventProperties.image;
          // Safely parse classes
          if (typeof eventProperties.classes === 'string') {
              try { classData = JSON.parse(eventProperties.classes); } catch (e) { 
                  Logger.warn("[Click] Failed to parse AVL classes data", CONTEXT, { raw: eventProperties.classes, error: e });
                  classData = {}; 
              }
          } else if (typeof eventProperties.classes === 'object' && eventProperties.classes !== null) {
              classData = eventProperties.classes;
          } else {
               Logger.warn("[Click] AVL classes data is not a string or object", CONTEXT, { raw: eventProperties.classes });
               classData = {};
          }
          
          newClickedPointValues = {
              type: eventProperties.type,
              specificID: feature.id, 
              avlID: eventProperties.id, // Use original AVL ID here
              timestamp: timestampToISOString(eventProperties.timestamp), // Format timestamp
              classification: eventProperties.classification,
              classes: classData,
              image: imageUrl,
              CAM: false, // AVL cannot have CAM view
              angles: null,
              currentAngle: null
          };

      } else if (eventProperties.type === "RWIS") {
          let anglesObject = {};
          if (typeof eventProperties.angles === 'string') {
              try { anglesObject = JSON.parse(eventProperties.angles); } catch (e) { 
                   Logger.error("[Click] Failed to parse RWIS angles data", CONTEXT, { raw: eventProperties.angles, error: e });
                   anglesObject = {}; 
              }
          }
          
          const recentAngle = eventProperties.recentAngle;
          let initialAngle = recentAngle;
          
          if (!initialAngle || !anglesObject[initialAngle]) {
              const availableKeys = Object.keys(anglesObject).sort();
              if (availableKeys.length > 0) {
                  initialAngle = availableKeys[0];
                  Logger.warn(`[Click] Recent angle '${recentAngle}' invalid. Using first available: '${initialAngle}'`, CONTEXT);
              } else {
                  Logger.error("[Click] No valid angles found in RWIS data.", CONTEXT, { angles: anglesObject });
                  initialAngle = null;
              }
          }

          const initialAngleData = initialAngle ? anglesObject[initialAngle] : {};
          imageUrl = initialAngleData.url; // Use initial angle image
          classData = initialAngleData.class; // Use initial angle class data

          newClickedPointValues = {
              type: eventProperties.type,
              specificID: feature.id,
              avlID: eventProperties.id, // Use original RWIS ID here
              timestamp: timestampToISOString(eventProperties.timestamp),
              classification: initialAngleData.classification,
              classes: classData,
              image: imageUrl,
              CAM: false, // Initial CAM state is false
              angles: anglesObject,
              currentAngle: initialAngle
          };
          // Reset aspect ratio state when a new RWIS point is clicked
          setState('imageAspectRatio', null); 

      } else {
          Logger.error("Unknown feature type clicked:", CONTEXT, eventProperties.type);
          setState("clickedPointValues", null); // Clear state on unknown type
          return; 
      }

      // Update the central state
      Logger.debug("Setting clickedPointValues state with:", CONTEXT, newClickedPointValues);
      setState("clickedPointValues", newClickedPointValues);

  } catch (processingError) {
      Logger.error("Error processing clicked feature properties", CONTEXT, processingError);
      setState("clickedPointValues", null); // Clear state on error
  }

});

function timestampToISOString(timestamp) {
  const date = DateTime.fromSeconds(timestamp, { zone: "America/Chicago" });
  const formattedDateTime = date.toLocaleString(DateTime.DATETIME_FULL);
  return formattedDateTime;
}

map.on("mousemove", "latestLayer", (event) => {
  const map = getState("map");
  if (!map) return;
  
  map.getCanvas().style.cursor = "pointer";

  const features = map.queryRenderedFeatures(event.point, {
    layers: ["latestLayer"],
  });

  if (features.length > 0) {
    const hoveredFeature = features[0];
    const hoveredFeatureId = hoveredFeature.id;

    // Update feature state for hover effect
    if (uniqueID && uniqueID !== hoveredFeatureId) {
       map.setFeatureState(
          { source: "latestSource", id: uniqueID },
          { hover: false },
        );
    }
    map.setFeatureState(
      { source: "latestSource", id: hoveredFeatureId },
      { hover: true },
    );
    uniqueID = hoveredFeatureId;
    
    // --- Popup logic --- 
    const properties = hoveredFeature.properties;
    const coordinates = hoveredFeature.geometry.coordinates.slice();
    
    let previewImageUrl = null;
    if (properties.type === "RWIS") {
        let angles = properties.angles;
        const recentAngle = properties.recentAngle;
        if (typeof angles === 'string') {
            try { angles = JSON.parse(angles); } catch (e) { angles = {}; }
        }
        if (angles && typeof angles === 'object' && recentAngle && angles[recentAngle]) {
            previewImageUrl = angles[recentAngle].url; 
        }
    } else { // AVL
        previewImageUrl = properties.image;
    }
    
    const popupContent = `
      <div class="hover-popup-content">
        ${previewImageUrl ? '<img src="' + previewImageUrl + '" alt="Preview" width="100%" style="display: block; margin-bottom: 5px; border-radius: 3px;">' : ''}
        <strong>ID:</strong> ${properties.id || 'N/A'}<br>
        <strong>Time:</strong> ${timestampToISOString(properties.timestamp) || 'N/A'}<br>
        <strong>Class:</strong> ${properties.classification || 'N/A'}
      </div>
    `;

    while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    
    if (hoverPopup) hoverPopup.remove();
    
    hoverPopup = new mapboxgl.Popup({ 
      closeButton: false,
      closeOnClick: false,
      offset: 15 // Offset the popup slightly from the point
    })
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map);

    // --- REMOVED side panel update logic --- 
    // // if (clickedPoint) return;
    // // idDisplay.textContent = properties.id;
    // // ... 

  } else {
    map.getCanvas().style.cursor = "default";
    if (hoverPopup) {
      hoverPopup.remove();
      hoverPopup = null;
    }
    if (uniqueID !== null) {
      map.setFeatureState(
        { source: "latestSource", id: uniqueID },
        { hover: false },
      );
      uniqueID = null;
    }
    // --- REMOVED side panel clearing logic --- 
    // // if (!clickedPoint) { ... }
  }
});

// Handle specific realtime functionalities:
function convertUnixTimestamp(unixTimestamp) {
  return new Date(unixTimestamp * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Handle realtime toggle - Listener kept in webInteractions.js for now
// But the layer adding/removing logic happens here based on map instance
// This might be better handled via state subscription if complexity grows.
subscribe('realtimeState', (isRealtime) => {
  const map = getState('map');
  if (!map) return;

  if (isRealtime) {
      Logger.info("Adding RainLayer due to realtime state change.", CONTEXT);
      if (!map.getLayer("rain")) { // Prevent adding multiple times
        const rainLayer = new RainLayer({ /* ... options ... */ });
        map.addLayer(rainLayer);
        rainLayer.on("refresh", (data) => {
            Logger.debug(`Weather data refreshed: ${convertUnixTimestamp(data.timestamp)}`, CONTEXT);
        });
      }
      // If there's a realtime data source separate from rain, handle it here.
      // Currently, it seems tied to removing/adding latestLayer?
      // Consider a dedicated realtime data state.
      if (map.getLayer("latestLayer")) map.removeLayer("latestLayer");
      if (map.getSource("latestSource")) map.removeSource("latestSource");
      // TODO: Add realtime data source and layer setup
  } else {
      Logger.info("Removing RainLayer due to realtime state change.", CONTEXT);
      if (map.getLayer("rain")) {
          map.removeLayer("rain");
          // rainLayer instance might need to be stored to remove listeners properly
      }
      // Re-add the latestLayer/Source if it was removed
      const currentGeoJSON = getState("currentGeoJSON");
      if (currentGeoJSON && !map.getSource("latestSource")) {
          Logger.debug("Re-adding latestSource/latestLayer after realtime disabled.", CONTEXT);
          addPointLayer(currentGeoJSON); 
      }
  }
});

// Handle toggling of layers, toggling of CAM
map.on("idle", () => {
  if (stateCAM) {
    // console.log("yes");
  }

  // If these two layers were not added to the map, abort
  if (
    !map.getLayer("latestLayer") ||
    !map.getLayer("latestInterpolationLayer")
  ) {
    document.getElementById("menu").style.display = "none";
    return;
  }
  document.getElementById("menu").style.display = "flex";

  // Enumerate ids of the layers.
  const toggleableLayerIds = ["latestLayer", "latestInterpolationLayer"];

  // Set up the corresponding toggle button for each layer.
  for (const id of toggleableLayerIds) {
    // Skip layers that already have a button set up.
    if (document.getElementById(id)) {
      continue;
    }

    // Create a link.
    const link = document.createElement("a");
    link.id = id;
    link.href = "#";
    let text;
    if (id == "latestLayer") {
      text = "Actual";
    } else {
      text = "Interpolated";
    }
    link.textContent = text;
    link.className = "active";

    // Show or hide layer when the toggle is clicked.
    link.onclick = function (e) {
      const clickedLayer = id;
      e.preventDefault();
      e.stopPropagation();
      const visibility = map.getLayoutProperty(clickedLayer, "visibility");
      // Toggle layer visibility by changing the layout object's visibility property.
      if (visibility === "visible") {
        map.setLayoutProperty(clickedLayer, "visibility", "none");
        this.className = "";
      } else {
        this.className = "active";
        map.setLayoutProperty(clickedLayer, "visibility", "visible");
      }
    };

    const layers = document.getElementById("menu");
    layers.appendChild(link);
  }
});

// Export functions at the end
export { 
    updateMapData, 
    updateInterpolation, 
    panToAverage, 
    // Removed shiftMapView
    // Removed convertUnixTimestamp if only used locally for rain layer?
};
