import mapboxgl from "mapbox-gl";
import { DateTime } from "luxon";
import { scrollToBottom } from "./webInteractions";
import { addData, removeData, newChart } from "./charts.js";
import RainLayer from "mapbox-gl-rain-layer";
import { filterStudyArea } from "./interpolation.js";
import { getState, setState, subscribe } from "./core/stateManager.js";
import { toggleImageSrc } from './core/ui/uiInteractions.js';

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
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/urbizton/clve9aeu900c501rd7qcn14q6", // Default Dark
  center: [-94.53, 41.99],
  zoom: 6.4,
  maxZoom: 18,
});

// Add listener for map errors (like style loading failure)
map.on('error', (e) => {
    console.error('Mapbox GL Error:', e.error); // Log the underlying error object
    // Optionally: Display a user-friendly message on the UI
    // Example: document.getElementById('map-error-message').textContent = 'Failed to load map style. Please check token or style URL.';
});

// Set initial state
setState("map", map);
setState("currentGeoJSON", null);
setState("currentInterpolation", null);

// Add map controls
map.addControl(
  new mapboxgl.NavigationControl({ visualizePitch: true }),
  "bottom-right",
);
map.addControl(new mapboxgl.ScaleControl({ maxWidth: 300, unit: "imperial" }));
map.addControl(
  new mapboxgl.FullscreenControl({ container: document.querySelector("body") }),
  "bottom-right",
);

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
  .addEventListener("click", function (event) {
    event.preventDefault();
    panToIowa();
  });

function panToAverage(coordinates) {
  const map = getState("map");
  if (!map) {
    console.error("[panToAverage] Map state is not available.");
    return;
  }

  console.log(`[panToAverage] Received ${coordinates?.length || 0} coordinates.`);
  if (!coordinates || coordinates.length === 0) {
    console.warn("[panToAverage] No coordinates provided, cannot pan.");
    return; 
  }

  let sumLong = 0;
  let sumLat = 0;
  let validCoordsCount = 0;

  for (let i = 0; i < coordinates.length; i++) {
    // Ensure coordinates are valid numbers
    if (coordinates[i] && typeof coordinates[i][0] === 'number' && typeof coordinates[i][1] === 'number' && !isNaN(coordinates[i][0]) && !isNaN(coordinates[i][1])) {
      sumLong += coordinates[i][0]; // longitude
      sumLat += coordinates[i][1]; // latitude
      validCoordsCount++;
    } else {
      console.warn(`[panToAverage] Skipping invalid coordinate pair at index ${i}:`, coordinates[i]);
    }
  }

  if (validCoordsCount === 0) {
    console.warn("[panToAverage] No valid coordinates found, cannot calculate average.");
    return; 
  }

  const avgLongitude = sumLong / validCoordsCount;
  const avgLatitude = sumLat / validCoordsCount;
  console.log(`[panToAverage] Calculated average LngLat: [${avgLongitude}, ${avgLatitude}]`);

  const arrowImg = document.getElementById("arrow-img");
  const consoleElement = document.getElementById("console");
  const flipped = arrowImg ? !arrowImg.classList.contains("flipped") : true; // Default to true if arrowImg not found
  const padding = {};
  const currentWidth = consoleElement ? consoleElement.clientWidth - 200 : 0;
  padding["left"] = flipped ? 0 : currentWidth;

  console.log("[panToAverage] Easing map to average coordinates...");
  map.easeTo({
    padding: padding,
    center: [avgLongitude, avgLatitude],
    zoom: 6.5,
  });
}

// Initial state of map, also ensures points stay the same when style changes
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
const idDisplay = document.getElementById("pointID");
const timeDisplay = document.getElementById("pointTimestamp");
const imageDisplay = document.getElementById("pointImage");
const chart = newChart();

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
  let coordinate = features[0].geometry.coordinates;
  scrollToBottom();

  if (clickedPoint) {
    const currentClickedPoint = getState("clickedPointValues");
    if (currentClickedPoint) {
      map.setFeatureState(
        { source: "latestSource", id: currentClickedPoint.specificID },
        { hover: false },
      );
    }
  }

  const arrowImg = document.getElementById("arrow-img");
  const flipped = !arrowImg.classList.contains("flipped");
  const padding = {};
  const currentWidth = document.getElementById("console").clientWidth - 200;
  padding["left"] = flipped ? 0 : currentWidth;

  map.easeTo({
    center: coordinate,
    padding: padding,
    duration: 600,
  });

  clickedPoint = true;

  // Define how values are interpreted
  const feature = event.features[0];
  const eventProperties = feature.properties;
  const imgControls = document.getElementById("img-buttons");
  console.log("[Click] Feature Properties (Raw):", eventProperties);

  let newClickedPointValues;
  let classData; // To hold the class object for addData
  let imageUrl; // To hold the image URL
  
  if (eventProperties.type === "AVL") {
    console.log("[Click] AVL point clicked.");
    imageUrl = eventProperties.image;
    
    if (typeof eventProperties.classes === 'string') {
        try {
            classData = JSON.parse(eventProperties.classes);
            console.log("[Click] Parsed AVL classes data.");
        } catch (e) {
            console.error("[Click] Error parsing AVL classes data:", e, "Raw data:", eventProperties.classes);
            classData = {};
        }
    } else if (typeof eventProperties.classes === 'object' && eventProperties.classes !== null) {
        classData = eventProperties.classes;
    } else {
        console.warn("[Click] AVL classes data is not a string or object:", eventProperties.classes);
        classData = {};
    }
    
    newClickedPointValues = {
      specificID: feature.id,
      avlID: eventProperties.id, 
      timestamp: timestampToISOString(eventProperties.timestamp),
      classification: eventProperties.classification,
      classes: classData,
      image: imageUrl,
      CAM: false,
      type: eventProperties.type
    };
    imgControls.style.display = "none";
    
    // Remove listener if it exists from a previous RWIS click
    imageDisplay.removeEventListener('click', toggleImageSrc);
    
  } else if (eventProperties.type === "RWIS") {
    console.log("[Click] RWIS point clicked.");
    imgControls.style.display = "flex";
    stateCAM = true; // Enable CAM toggling for RWIS
    
    const recentAngle = eventProperties.recentAngle;
    let angles = eventProperties.angles;
    
    if (typeof angles === 'string') {
        try {
            angles = JSON.parse(angles);
             console.log("[Click] Parsed RWIS angles data.");
        } catch (e) {
            console.error("[Click] Error parsing RWIS angles data:", e, "Raw data:", eventProperties.angles);
            angles = {};
        }
    }
    
    console.log("[Click] RWIS Debug - recentAngle:", recentAngle, "(Type:", typeof recentAngle, ")");
    console.log("[Click] RWIS Debug - angles object (after potential parse):", angles, "(Type:", typeof angles, ")");

    if (angles && typeof angles === 'object' && recentAngle && angles[recentAngle]) {
      const recentAngleData = angles[recentAngle];
      console.log(`[Click] RWIS Angle ${recentAngle} Data:`, recentAngleData);
      imageUrl = recentAngleData.url;
      classData = recentAngleData.class;
      
      newClickedPointValues = {
        type: eventProperties.type,
        specificID: feature.id,
        avlID: eventProperties.id, 
        timestamp: timestampToISOString(eventProperties.timestamp),
        classification: recentAngleData.classification, 
        classes: classData,
        image: imageUrl,
        CAM: false 
      };
    } else {
      console.warn("[Click] Could not find recent angle data for RWIS point (after potential parse):", eventProperties.id, "Recent Angle:", recentAngle);
      newClickedPointValues = {
          type: eventProperties.type,
          specificID: feature.id,
          avlID: eventProperties.id,
          timestamp: timestampToISOString(eventProperties.timestamp),
          classification: 'Undefined', 
          classes: {}, 
          image: undefined, 
          CAM: false
      };
      imageUrl = undefined;
      classData = undefined;
    }
    
    // Add the listener AFTER setting the image source and display
    if (imageUrl) {
        imageDisplay.src = imageUrl;
        imageDisplay.parentNode.style.display = "block";
        // Remove any old listener first, then add the new one
        imageDisplay.removeEventListener('click', toggleImageSrc); 
        imageDisplay.addEventListener('click', toggleImageSrc); 
    } else {
        imageDisplay.src = ""; 
        imageDisplay.parentNode.style.display = "none";
        // Remove listener if image isn't displayed
        imageDisplay.removeEventListener('click', toggleImageSrc);
    }
  } else {
    console.error("[Click] Unknown feature type:", eventProperties.type);
    // Remove listener for unknown types too
    imageDisplay.removeEventListener('click', toggleImageSrc);
    return; 
  }

  console.log("[Click] Setting clickedPointValues state:", newClickedPointValues);
  setState("clickedPointValues", newClickedPointValues);

  idDisplay.textContent = newClickedPointValues.avlID || '';
  timeDisplay.textContent = newClickedPointValues.timestamp || '';
  
  removeData(chart);
  if (classData) {
      console.log("[Click] Updating chart with data:", classData);
      addData(chart, classData); 
  } else {
      console.warn("[Click] Class data is undefined, cannot update chart.");
  }
});

function timestampToISOString(timestamp) {
  const date = DateTime.fromSeconds(timestamp, { zone: "America/Chicago" });
  const formattedDateTime = date.toLocaleString(DateTime.DATETIME_FULL);
  return formattedDateTime;
}

// Remove this function if not working properly
map.on("mousemove", "latestLayer", (event) => {
  const map = getState("map");
  if (!map) return;
  
  map.getCanvas().style.cursor = "pointer";

  const features = map.queryRenderedFeatures(event.point, {
    layers: ["latestLayer"],
  });

  // Check if any features are hovered
  if (features.length > 0) {
    const hoveredFeature = features[0];
    const hoveredFeatureId = hoveredFeature.id;

    // Update feature state for hover effect (regardless of whether it's the same feature)
    // Clear previous hover state if the feature ID has changed
    if (uniqueID && uniqueID !== hoveredFeatureId) {
       map.setFeatureState(
          { source: "latestSource", id: uniqueID },
          { hover: false },
        );
    }
    // Set hover state for the current feature
    map.setFeatureState(
      { source: "latestSource", id: hoveredFeatureId },
      { hover: true },
    );
    uniqueID = hoveredFeatureId; // Update the tracked hovered ID
    
    // --- Replace side panel update with Popup --- 
    const properties = hoveredFeature.properties;
    const coordinates = hoveredFeature.geometry.coordinates.slice();
    
    // Get image URL for preview (use base image for RWIS)
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
        ${previewImageUrl ? '<img src="' + previewImageUrl + '" alt="Preview" width="60" style="display: block; margin-bottom: 5px; border-radius: 3px;">' : ''}
        <strong>ID:</strong> ${properties.id || 'N/A'}<br>
        <strong>Time:</strong> ${timestampToISOString(properties.timestamp) || 'N/A'}<br>
        <strong>Class:</strong> ${properties.classification || 'N/A'}
      </div>
    `;

    // Ensure coordinates are valid
    while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    
    // Remove existing popup if it exists
    if (hoverPopup) {
      hoverPopup.remove();
      hoverPopup = null;
    }
    
    // Create and show the new popup
    hoverPopup = new mapboxgl.Popup({ 
      closeButton: false,
      closeOnClick: false,
      offset: 15 // Offset the popup slightly from the point
    })
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map);

    // --- Remove side panel update logic --- 
    // // Don't update clickedPointValues state if a point is already clicked
    // if (clickedPoint) return;
    // // Update UI with the hovered feature's information
    // idDisplay.textContent = properties.id;
    // timeDisplay.textContent = timestampToISOString(properties.timestamp);
    // // ... (logic for imageUrl, classData, setState, addData, imageDisplay updates removed)

  } else {
    // If no features are hovered, reset cursor and remove popup
    map.getCanvas().style.cursor = "default";
    if (hoverPopup) {
      hoverPopup.remove();
      hoverPopup = null;
    }
    // Clear feature state for the previously hovered feature if mouse moves off features entirely
    if (uniqueID !== null) {
      map.setFeatureState(
        { source: "latestSource", id: uniqueID },
        { hover: false },
      );
      uniqueID = null;
    }
    // --- Remove side panel clearing logic --- 
    // // Only clear UI if no point is clicked
    // if (!clickedPoint) { ... }
  }
});

// Function to shift/zoom the map view based on changes in container width (thank you chatgpt)
function shiftMapView() {
  const currentCenter = map.getCenter();
  let currentZoom = map.getZoom();

  const containerWidth = document.getElementById("console").offsetWidth;

  // Check if the container width has changed
  if (containerWidth !== prevContainerWidth) {
    const widthChange = containerWidth - prevContainerWidth;

    // Calculate the relative change in container width
    const widthRatio = prevContainerWidth / containerWidth;

    // Calculate the new zoom level based on the relative change in width
    currentZoom *= widthRatio ** 0.1; // Adjust this value if you want more extreme zooms

    // Project current center to screen coordinates
    const currentScreenPoint = map.project(currentCenter);

    // Calculate new screen coordinates based on the change in container width
    const newScreenX = currentScreenPoint.x - widthChange * 0.7;
    const newScreenY = currentScreenPoint.y;

    // Unproject new screen coordinates back to geographical coordinates
    const newCenter = map.unproject([newScreenX, newScreenY]);

    map.setCenter(newCenter);
    map.setZoom(currentZoom);
    prevContainerWidth = containerWidth;
  }
}

// Wait till elements are loaded before recording container width
let prevContainerWidth;
setTimeout(() => {
  prevContainerWidth = document.getElementById("console").offsetWidth;
}, 1000);

let isMouseDown = false;
window.addEventListener("mousedown", (event) => {
  if (event.target.id === "console") {
    isMouseDown = true;
  }
});
window.addEventListener("mousemove", () => {
  if (isMouseDown) {
    shiftMapView();
  }
});
window.addEventListener("mouseup", () => {
  isMouseDown = false;
});

// Handle specific realtime functionalities:
function convertUnixTimestamp(unixTimestamp) {
  return new Date(unixTimestamp * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Handle realtime toggle
const realtimeToggle = document.querySelector("#realtime-toggle");
realtimeToggle.addEventListener("change", (e) => {
  if (e.target.checked) {
    // Init GL JS Rain Layer
    const rainLayer = new RainLayer({
      id: "rain",
      source: "rainviewer",
      meshOpacity: 0,
      rainColor: "hsla(213, 76%, 73%, 0.86)",
      snowColor: "hsla(0, 0%, 100%, 1)",
      scale: "noaa",
    });
    map.addLayer(rainLayer);

    rainLayer.on("refresh", (data) => {
      console.log(
        `Last Weather Update: ${convertUnixTimestamp(data.timestamp)}`,
      );
    });

    // remove existing geoJSON source
    map.removeLayer("latestLayer");
    map.removeSource("latestSource");
    // TODO: Add realtime source and logic

    // console.log('checked')
  } else {
    // console.log('unchecked')
    map.removeLayer("rain");
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

// Export map instance and functions
export { map };

// Export functions at the end
export { updateMapData, updateInterpolation };
