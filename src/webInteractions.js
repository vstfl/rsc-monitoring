import { queryImagesByDateRange } from "./firebaseHandler.js";
// currentInterpolatedGeoJSON = await interpolateGeoJSON(currentGeoJSON);
import {
  // currentInterpolatedGeoJSON = await interpolateGeoJSON(currentGeoJSON);
  updateMapData,
  updateInterpolation,
  panToAverage,
  currentGeoJSON,
  clickedPointValues,
} from "./mapInteractions.js";
import {
  interpolateGeoJSON,
  interpolateGeoJSONLanes,
  enableLoadingScreen,
  fadeOutLoadingScreen,
  interpolateGeoJSONLanesNIK,
} from "./interpolation.js";
import { map } from "./mapInteractions.js";
import * as geojson from "geojson";
import { DateTime } from "luxon";
import { getState, setState, subscribe } from "./core/stateManager.js";

// Import our new modular utility functions
import { 
  calculateDataRange, 
  DateTimeConstants, 
  isInRange, 
  isDifferentDay 
} from "./core/utils/dateTimeUtils.js";

import { 
  convertToGeoJSON, 
  removeLettersAfterUnderscore, 
  classByNumber, 
  highestNumberString 
} from "./core/utils/dataTransformUtils.js";

import { 
  toggleConsole, 
  toggleArrow, 
  scrollToBottom,
  setupEventListeners,
  initializeUI
} from "./core/ui/uiInteractions.js";

import Logger from './core/logger.js';
import {
    mesonetGETAVL,
    mesonetScrapeRWISv2,
    triggerBackendStartup,
    postRequestToBackend,
    fetchNikFileList,
    fetchNikGeoJson
} from './core/apiService.js';
const CONTEXT = 'WebInteractions'; // Define context for logging

// Initialize state subscriptions
subscribe("map", (newMap) => {
  console.log("Map state updated:", newMap);
});

// Initialize event listeners
document.addEventListener('DOMContentLoaded', async (event) => {
  // Initialize all UI interactions and subscriptions
  initializeUI(); 

  Logger.info("Webpage loaded, initializing backend warmup and NIK list...", CONTEXT);
  
  // Trigger backend warmup (moved from potentially global scope)
  try {
    await triggerBackendStartup();
    Logger.info("Backend warmup request sent.", CONTEXT);
  } catch (error) {
    Logger.error("Error triggering backend warmup:", CONTEXT, error);
  }

  // Fetch initial NIK file list (moved from potentially global scope)
  try {
    const nikFiles = await fetchNikFileList();
    // Assuming populateNikDropdown is part of initializeUI or uiInteractions
    // populateNikDropdown(nikFiles); 
    Logger.info("Initial NIK file list fetched.", CONTEXT, { count: nikFiles?.length });
  } catch (error) {
    Logger.error("Error fetching initial NIK file list:", CONTEXT, error);
  }
});

// Export function for use in other modules
export { scrollToBottom };

// Handle study area toggle
const studyAreaToggle = document.querySelector("#studyarea-toggle");
if (studyAreaToggle) { // Add null check
  studyAreaToggle.addEventListener("change", async (e) => {
    Logger.debug("Study area toggle changed:", CONTEXT, { checked: e.target.checked });
    setState("studyAreaState", e.target.checked);
    
    // Refresh the map data by updating state, mapInteractions should subscribe
    const currentGeoJSON = getState("currentGeoJSON");
    if (currentGeoJSON) {
      Logger.debug("Triggering map data update via state change.", CONTEXT);
      // Re-setting the state triggers subscribers like updateMapData
      setState("currentGeoJSON", currentGeoJSON); 
    }
  });
} else {
  Logger.warn("Study area toggle element not found.", CONTEXT);
}

// Handle realtime toggle
const realtimeToggle = document.querySelector("#realtime-toggle");
const archivedQuery = document.querySelectorAll(".archived-query");
let realtimeState = false;
let realtimeIntervalId = null; // Variable to hold the interval ID

if (realtimeToggle) { // Add null check
  realtimeToggle.addEventListener("change", (e) => {
    realtimeState = e.target.checked;
    setState("realtimeState", realtimeState); // Update global state
    
    archivedQuery.forEach((query) => {
      if (query && query.style) { // Add null checks
        query.style.display = realtimeState ? "none" : "flex";
      }
    });
    
    if (realtimeState) {
      Logger.info("Realtime Mode ENABLED", CONTEXT);
      if (realtimeIntervalId) clearInterval(realtimeIntervalId);
      updateRealtimeData(); 
      realtimeIntervalId = setInterval(updateRealtimeData, 40000); // 40 seconds
    } else {
      Logger.info("Realtime Mode DISABLED", CONTEXT);
      if (realtimeIntervalId) {
        clearInterval(realtimeIntervalId);
        realtimeIntervalId = null;
        Logger.debug("Realtime update interval cleared.", CONTEXT);
      }
    }
  });
} else {
  Logger.warn("Realtime toggle element not found.", CONTEXT);
}

// Handle range slider value change visual
const slider = document.getElementById("time-range");
const sliderValue = document.getElementById("slider-value");

if (slider && sliderValue) { // Add null checks
  slider.addEventListener("input", function () {
    sliderValue.textContent = this.value;
    // Set state instead of using a local variable
    setState('timeRange', parseInt(this.value, 10)); 
    Logger.debug("Time range slider changed:", CONTEXT, { value: this.value });
  });
  // Initialize display and state
  const initialValue = slider.value;
  sliderValue.textContent = initialValue;
  setState('timeRange', parseInt(initialValue, 10));
} else {
   Logger.warn("Time range slider or value display element not found.", CONTEXT);
}

async function startQuery(date, window) {
  Logger.debug(`Starting query process`, CONTEXT, { date, window });
  enableLoadingScreen();
  let imageQueryAVL, imageQueryRWIS;
  try {
      const [startTimestamp, endTimestamp] = calculateDataRange(date, window);
      Logger.debug(`Calculated query range`, CONTEXT, { start: startTimestamp.toISOString(), end: endTimestamp.toISOString() });
      
      // === Step 1: Initial Firebase Fetch ===
      [imageQueryAVL, imageQueryRWIS] = await queryImagesByDateRange(
          startTimestamp,
          endTimestamp,
      );
      Logger.info(`Initial Firebase query results`, CONTEXT, { avl: imageQueryAVL?.length ?? 0, rwis: imageQueryRWIS?.length ?? 0 });

      // === Step 2: Initial Map Update ===
      Logger.debug("Updating map with initial data...", CONTEXT);
      updateAll(imageQueryAVL, imageQueryRWIS); // updateAll remains here as it orchestrates map/interpolation updates
      Logger.debug("Initial map update complete.", CONTEXT);

  } catch (error) {
      Logger.error(`Error during initial fetch or map update: ${error.message}`, CONTEXT, error);
      // Optionally show error to user
  } finally {
      fadeOutLoadingScreen();
  } 

  // === Step 3: Handle Predictions Asynchronously ===
  // This function now uses API service calls internally
  checkAndTriggerPredictions(date, window, imageQueryAVL, imageQueryRWIS)
      .then(() => Logger.info("Background prediction check process completed.", CONTEXT))
      .catch(error => Logger.error(`Background prediction check process failed: ${error.message}`, CONTEXT, error));
  
  Logger.debug("Initial query processing complete. Prediction checks running in background.", CONTEXT);
}

async function checkAndTriggerPredictions(date, window, initialAvlData, initialRwisData) {
    Logger.debug("Starting background prediction checks...", CONTEXT);
    try {
        const [startTimestamp, endTimestamp] = calculateDataRange(date, window);
        let predictionsSent = false;
        const predictionPromises = [];

        // --- Fetch Mesonet Data (Use ApiService) --- 
        Logger.debug("Fetching Mesonet AVL data via ApiService...", CONTEXT);
        const actualImagesAVL = await mesonetGETAVL(date, window); // Uses imported function
        Logger.debug(`Mesonet AVL results received`, CONTEXT, { count: actualImagesAVL?.data?.length ?? 0 });

        Logger.debug("Fetching Mesonet RWIS data via ApiService...", CONTEXT);
        const actualImagesRWIS = await mesonetScrapeRWISv2( // Uses imported function
            startTimestamp,
            endTimestamp,
        );
         Logger.debug(`Mesonet RWIS scrape results received`, CONTEXT, { count: actualImagesRWIS?.length ?? 0 });

        // --- Check for Missing Predictions (Logic stays here) ---
        Logger.debug("Checking for missing RWIS predictions...", CONTEXT);
        const imagesForPredRWIS = predictionExistsRWIS(
            actualImagesRWIS,
            initialRwisData, 
        );
        Logger.debug(`RWIS images needing prediction: ${Object.keys(imagesForPredRWIS || {}).length}`, CONTEXT);
        
        Logger.debug("Checking for missing AVL predictions...", CONTEXT);
        const imagesForPredAVL = predictionExistsAVL(
            actualImagesAVL, 
            initialAvlData
        );
         Logger.debug(`AVL images needing prediction: ${Object.keys(imagesForPredAVL || {}).length}`, CONTEXT);

        // --- Send Prediction Requests (Use ApiService potentially, or keep logic here) ---
        // Current implementation uses postRequestToBackend which we moved to apiService
        // Assuming sendPredictionsAVL/RWIS wrap the call to postRequestToBackend
        if (imagesForPredAVL) {
            Logger.debug("Sending AVL prediction request...", CONTEXT);
            // Assume sendPredictionsAVL calls apiService.postRequestToBackend internally
            predictionPromises.push(sendPredictionsAVL(imagesForPredAVL, date, window)); 
            predictionsSent = true;
        } else {
            Logger.debug("No AVL predictions needed.", CONTEXT);
        }

        if (imagesForPredRWIS) {
            Logger.debug("Sending RWIS prediction request...", CONTEXT);
             // Assume sendPredictionsRWIS calls apiService.postRequestToBackend internally
            predictionPromises.push(sendPredictionsRWIS(imagesForPredRWIS, date, window));
            predictionsSent = true;
        } else {
            Logger.debug("No RWIS predictions needed.", CONTEXT);
        }

        // --- Wait for Predictions and Final Update --- 
        if (predictionsSent) {
            Logger.debug("Waiting for prediction requests...", CONTEXT);
            await Promise.all(predictionPromises);
            Logger.debug("Prediction requests finished. Re-querying Firebase...", CONTEXT);

            // Final Firebase Query (Remains the same)
            const [finalAvlData, finalRwisData] = await queryImagesByDateRange(
                startTimestamp,
                endTimestamp,
            );
            Logger.info(`Final Firebase query results`, CONTEXT, { avl: finalAvlData?.length ?? 0, rwis: finalRwisData?.length ?? 0 });
            
            // Final Map Update (Remains the same)
            Logger.debug("Updating map with final data after predictions...", CONTEXT);
            updateAll(finalAvlData, finalRwisData);
            Logger.debug("Final map update complete.", CONTEXT);
        } else {
            Logger.debug("No predictions were sent, skipping final update.", CONTEXT);
        }

    } catch (error) {
        // Catch errors from API calls or internal logic
        Logger.error(`Error during background prediction handling: ${error.message}`, CONTEXT, error);
        // Optionally: update UI to indicate background task failure
    }
}

// Keep sendPredictionsAVL/RWIS stubs for now, assuming they call postRequestToBackend
// TODO: Refactor these later if needed
async function sendPredictionsAVL(images, date, window) { 
    Logger.debug('Stub: Sending AVL predictions', CONTEXT, { count: Object.keys(images).length });
    // Placeholder - Replace with actual logic potentially calling postRequestToBackend
    await postRequestToBackend(images, 50, '/predict_avl'); // Example call
}
async function sendPredictionsRWIS(images, date, window) { 
    Logger.debug('Stub: Sending RWIS predictions', CONTEXT, { count: Object.keys(images).length });
    // Placeholder - Replace with actual logic potentially calling postRequestToBackend
     await postRequestToBackend(images, 50, '/predict_rwis'); // Example call
}

async function updateAll(imageQueryAVL, imageQueryRWIS) {
  console.log("[Update All] Preparing GeoJSON...");
  const newGeoJSON = convertToGeoJSON(imageQueryAVL, imageQueryRWIS);
  console.log(`[Update All] Generated GeoJSON with ${newGeoJSON?.features?.length || 0} features.`);
  // Optional: Log the generated GeoJSON for debugging
  // console.log("[Update All] GeoJSON Sample:", JSON.stringify(newGeoJSON?.features?.slice(0, 2)));

  updateMapData(newGeoJSON);

  if (interpolationState) {
    // Change inner variable to currentGeoJSON once NIK is fully automated, for now, use manual generations
    console.log("\n\nINTERPOLATION GEOJSON: ");
    console.log(currentGeoJSON);
    currentInterpolatedGeoJSON = await interpolateGeoJSONLanes(currentGeoJSON);
    updateInterpolation(currentInterpolatedGeoJSON);
  }

  if (interpolationStateNIK) {
    console.log("\n\nINTERPOLATION GEOJSON: ");
    console.log(currentNIKGeoJSON);
    currentInterpolatedGeoJSON =
      await interpolateGeoJSONLanesNIK(currentNIKGeoJSON);
    updateInterpolation(currentInterpolatedGeoJSON);
  }
  console.log("[Update All] Map update initiated.");
}

// Handle form submission for querying
document
  .getElementById("query-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form submission
    scrollToBottom();
    let date, window;
    // If archived mode, get Calendar and Window
    if (!realtimeState) {
      // Get the query data
      const formData = new FormData(this);

      // Conversion from local machine time to CDT Timezone (Iowa)
      date = formData.get("calendar");
      console.log("TEST 1:" + date);
      const dateTime = DateTime.fromISO(date, { zone: "America/Chicago" });
      date = dateTime.setZone("America/Chicago").toISO();
      console.log("QUERY DATE: " + date);
      window = formData.get("window");

      // Disables button temporarily (prevent for request spam)
      const btn = document.getElementById("submit-query");

      btn.disabled = true;
      btn.style.cursor = "not-allowed";
      setTimeout(() => {
        btn.disabled = false;
        btn.style.cursor = "pointer";
        console.log("Button Available");
      }, 160 * window); // Scale button cooldown depending on size of window
      console.log(
        "\n\nTEST DATE: " + date + "\nTEST WINDOW: " + window + "\n\n",
      );
      await startQuery(date, window);
    }
  });

function updateInterfaceNIK() {
  const removeUI = document.querySelectorAll(".nik-remove");
  const addUI = document.querySelectorAll(".nik-add");
  removeUI.forEach((query) => {
    query.style.display = "none";
  });
  addUI.forEach((query) => {
    query.style.display = "flex";
  });
}

// Keep NIKData (utility function, could move to dateTimeUtils later)
function NIKData(inputString) {
  // console.log(inputString)
  const parts = inputString.split("/").pop().split("_");
  let [year, month, day, hour] = parts;
  hour = hour.split(".")[0];

  // Note: We use America/Chicago timezone as the input is in CST
  const dateTime = DateTime.fromObject(
    {
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour),
      minute: 30,
      second: 0,
      millisecond: 0,
    },
    { zone: "America/Chicago" },
  );
  // Convert to ISO format
  return dateTime.toISO();
}

let currentNIKGeoJSON;
document
  .getElementById("nik-options")
  .addEventListener("change", async function () {
    var selectedValue = this.value;
    if (!selectedValue) return; // Ignore empty selection
    Logger.debug("Selected NIK interpolation URL: ", CONTEXT, selectedValue);

    try {
      // Fetch GeoJSON using ApiService
      currentNIKGeoJSON = await fetchNikGeoJson(selectedValue);
      Logger.debug("Loaded NIK GeoJSON file via ApiService:", CONTEXT, selectedValue);
      
      // Trigger query based on the NIK file
      let date = NIKData(selectedValue); // NIKData remains here
      let window = 30; 
      Logger.debug("Triggering query for NIK data", CONTEXT, { date, window });
      await startQuery(date, window); // startQuery remains here

    } catch (error) { // Catch errors from fetchNikGeoJson or startQuery
      Logger.error(`Error processing NIK selection ${selectedValue}: ${error.message}`, CONTEXT, error);
      // Handle error appropriately
    }
  });

// Handle NIK Interpolation Trigger
let interpolationStateNIK = false;
document
  .getElementById("nik-interpolation")
  .addEventListener("click", async (event) => {
    event.preventDefault();
    interpolationState = false;
    console.log("NIK Interpolation Enabled");

    updateInterfaceNIK();

    // currentInterpolatedGeoJSON =
    //   await interpolateGeoJSONLanesNIK(currentGeoJSON);
    // updateInterpolation(currentInterpolatedGeoJSON);

    interpolationStateNIK = true;
  });

// Handle NN Interpolation Trigger
let interpolationState = false;
let currentInterpolatedGeoJSON;
document
  .getElementById("interpolation")
  .addEventListener("click", async (event) => {
    event.preventDefault(); // Prevent default anchor behavior
    interpolationStateNIK = false;
    console.log("NN Interpolation Enabled");

    // Get the current GeoJSON from the state manager
    const geoJsonInput = getState('currentGeoJSON');
    
    // Check if input data is valid before proceeding
    if (!geoJsonInput || !geoJsonInput.type || !geoJsonInput.features) {
        console.error("Cannot run interpolation: Invalid or missing input GeoJSON data in state.");
        // Optionally: Show user feedback
        return; 
    }

    // Pass the correct data to the interpolation function
    currentInterpolatedGeoJSON = await interpolateGeoJSONLanes(geoJsonInput);
    
    // Add a check here to see if the result is valid before updating map
    if (!currentInterpolatedGeoJSON || !currentInterpolatedGeoJSON.type || !currentInterpolatedGeoJSON.features) {
        console.error("Interpolation function returned invalid data:", currentInterpolatedGeoJSON);
        // Optionally: Show user feedback
        return;
    }
    
    updateInterpolation(currentInterpolatedGeoJSON);
    interpolationState = true;
  });

// Logic to update website every minute in realtime mode
let isUpdating = false;
async function updateRealtimeData() {
  const isRealtimeEnabled = getState("realtimeState");
  if (!isRealtimeEnabled) {
    console.log("Not in realtime state (checked via stateManager), skipping update.");
    // Also clear interval just in case it wasn't cleared by the toggle (safety net)
    if (realtimeIntervalId) {
        clearInterval(realtimeIntervalId);
        realtimeIntervalId = null;
        console.warn("Realtime interval cleared unexpectedly inside update function.");
    }
    return;
  }
  
  if (isUpdating) {
    console.log(
      "Previous realtime update is already in progress, skipping this interval",
    );
    return;
  }

  isUpdating = true;
  Logger.debug("Performing realtime update...", CONTEXT);
  let d = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const window = getState('timeRange') || 30;
  let date = DateTime.now().setZone("America/Chicago").toISO(); // Ensure ISO format
  Logger.debug("Realtime Query Params", CONTEXT, { date, window });

  try { // Wrap the core update logic
      await startQuery(date, window); 
      Logger.info(`Realtime map update complete: ${d}`, CONTEXT);
  } catch (error) {
      // Error is already logged within startQuery/queryImagesByDateRange/etc.
      // We catch here primarily to ensure isUpdating is reset.
      Logger.error(`Realtime update cycle failed: ${error.message}`, CONTEXT, error);
  } finally {
      isUpdating = false;
  }
}
// setInterval(updateRealtimeData, 40000); // REMOVE unconditional interval setup

function predictionExistsAVL(actualImagesAVL, firebaseImages) {
  // console.log("Inside predictionExistsAVL()");
  console.log(actualImagesAVL);
  // "https://mesonet.agron.iastate.edu/archive/data/2019/01/12/camera/idot_trucks/A31614/A31614_201901121352.jpg"
  // console.log(firebaseImages);
  //

  const requestJSON = {};

  for (const image of actualImagesAVL.data) {
    let imgFound = false;
    for (const fireImage of firebaseImages) {
      if (fireImage.data.IMAGE_URL == image.imgurl) {
        imgFound = true;
        console.log("TRUE TRUE TRUE");
        break;
      }
    }
    if (!imgFound) {
      let imgKey = image.imgurl.split("/").pop().replace(".jpg", "");
      requestJSON[imgKey] = image;
    }
  }
  // console.log(requestJSON);
  // console.log(Object.keys(requestJSON).length);
  return Object.keys(requestJSON).length === 0 ? false : requestJSON;
}

function predictionExistsRWIS(actualImagesRWIS, firebaseImages) {
  //actual images is a list of urls

  // console.log("Inside predictionExistsRWIS()");
  // console.log(actualImagesRWIS);
  // console.log(firebaseImages);

  const requestJSON = {};

  for (const image of actualImagesRWIS) {
    let imgFound = false;
    for (const fireImage of firebaseImages) {
      // These are URLS
      if (fireImage.data.Image == image) {
        imgFound = true;
        break;
      }
    }
    // If not found, generate the requestJSON for the RWIS backend
    if (!imgFound) {
      let imgKey = image.replace(".jpg", "").split("/").pop();
      requestJSON[imgKey] = image;
    }
  }

  // console.log(requestJSON);
  // Return falsy if requestJSON is empty
  return Object.keys(requestJSON).length === 0 ? false : requestJSON;
}
