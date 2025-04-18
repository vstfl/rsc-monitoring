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
  setupEventListeners
} from "./core/ui/uiInteractions.js";

// Initialize state subscriptions
subscribe("map", (newMap) => {
  console.log("Map state updated:", newMap);
});

// Initialize event listeners
document.addEventListener('DOMContentLoaded', setupEventListeners);

// Export function for use in other modules
export { scrollToBottom };

// Handle study area toggle
const studyAreaToggle = document.querySelector("#studyarea-toggle");
studyAreaToggle.addEventListener("change", async (e) => {
  console.log("Study area toggle changed:", e.target.checked);
  setState("studyAreaState", e.target.checked);
  
  // Refresh the map data if we have current GeoJSON
  const currentGeoJSON = getState("currentGeoJSON");
  if (currentGeoJSON) {
    console.log("Refreshing map data with studyAreaState:", e.target.checked);
    updateMapData(currentGeoJSON);
  }
});

// Handle realtime toggle
const realtimeToggle = document.querySelector("#realtime-toggle");
const archivedQuery = document.querySelectorAll(".archived-query");
let realtimeState = false;
let realtimeIntervalId = null; // Variable to hold the interval ID

realtimeToggle.addEventListener("change", (e) => {
  realtimeState = e.target.checked;
  setState("realtimeState", realtimeState); // Update global state
  
  archivedQuery.forEach((query) => {
    query.style.display = realtimeState ? "none" : "flex";
  });
  
  if (realtimeState) {
    console.log("Realtime Mode ENABLED");
    // Clear any existing interval just in case
    if (realtimeIntervalId) {
      clearInterval(realtimeIntervalId);
    }
    // Update immediately and start interval
    updateRealtimeData(); 
    realtimeIntervalId = setInterval(updateRealtimeData, 40000); // 40 seconds
  } else {
    console.log("Realtime Mode DISABLED");
    // Clear the interval when toggling off
    if (realtimeIntervalId) {
      clearInterval(realtimeIntervalId);
      realtimeIntervalId = null;
      console.log("Realtime update interval cleared.");
    }
    // Optionally: Add logic here to revert map to last archived query state if desired
  }
});

// Handle console shift toggle button
document.getElementById("shift-button").addEventListener("click", function () {
  document.getElementById("console").classList.toggle("shifted");
  document.getElementById("shift-button").classList.toggle("shifted");
  var arrowImg = document.getElementById("arrow-img");
  const flipped = arrowImg.classList.toggle("flipped");
  const padding = {};
  let currentWidth = document.getElementById("console").clientWidth;
  padding["right"] = flipped ? 0 : currentWidth;
  if (map) {
    map.easeTo({
      padding: padding,
      duration: 1000,
    });
  }
});

// Handle range slider value change visual
const slider = document.getElementById("time-range");
const sliderValue = document.getElementById("slider-value");
let currentRange = 0;
slider.addEventListener("input", function () {
  sliderValue.textContent = this.value;
  currentRange = this.value;
  console.log(currentRange);
});

// Handle image click to view// handHandle RWIS data
// Check if caLogic to gobtain lbmost recent image for specific said angleeach angle
/*
document.addEventListener("DOMContentLoaded", function () {
  let imageElement = document.getElementById("pointImage");

  function toggleImageSrc() {
    // Get the latest clickedPointValues from state
    const clickedPointValues = getState("clickedPointValues");
    if (!clickedPointValues) return;
    
    let img1 = clickedPointValues.image;
    if (!clickedPointValues.CAM && clickedPointValues.type == "RWIS") {
      // let img2 = `./assets/gradcamimages/Grad-CAM_${img1.split("/").pop()}`;
      // https://storage.googleapis.com/rwis_cam_images/images/IDOT-048-04_201901121508.jpg_gradcam.png
      // Grad-CAM_IDOT-026-01_201901121420.jpg

      console.log("Toggling to GradCAM image");
      console.log("Original image:", img1);
      let img2 = `https://storage.googleapis.com/rwis_cam_images/images/${img1.split("/").pop()}_gradcam.png`;
      console.log("GradCAM image URL:", img2);

      imageElement.src = img2;
      // Update the state with the new CAM value
      setState("clickedPointValues", { ...clickedPointValues, CAM: true });
    } else {
      console.log("Toggling back to original image");
      imageElement.src = img1;
      // Update the state with the new CAM value
      setState("clickedPointValues", { ...clickedPointValues, CAM: false });
    }
  }

  imageElement.addEventListener("click", toggleImageSrc);
});
*/

async function startQuery(date, window) {
  console.log(`[Start Query] Date: ${date}, Window: ${window}`);
  const [startTimestamp, endTimestamp] = calculateDataRange(date, window);
  console.log(`[Start Query] Calculated Range: ${startTimestamp.toISOString()} to ${endTimestamp.toISOString()}`);
  
  const [imageQueryAVL, imageQueryRWIS] = await queryImagesByDateRange(
    startTimestamp,
    endTimestamp,
  );
  console.log(`[Start Query] Firebase results - AVL: ${imageQueryAVL?.length || 0}, RWIS: ${imageQueryRWIS?.length || 0}`);
  // Optional: Log first few items for inspection
  // console.log("[Start Query] Firebase AVL Sample:", imageQueryAVL?.slice(0, 2));
  // console.log("[Start Query] Firebase RWIS Sample:", imageQueryRWIS?.slice(0, 2));

  // Scrape online database if AVL/RWIS images exist during time window
  console.log("[Start Query] Fetching Mesonet AVL data...");
  const actualImagesAVL = await mesonetGETAVL(date, window);
  console.log(`[Start Query] Mesonet AVL results: ${actualImagesAVL?.data?.length || 0}`);

  console.log("[Start Query] Fetching Mesonet RWIS data...");
  const actualImagesRWIS = await mesonetScrapeRWISv2(
    startTimestamp,
    endTimestamp,
  );
  console.log(`[Start Query] Mesonet RWIS results: ${actualImagesRWIS?.length || 0}`);

  // Construct the request for backend if predictions need to be completed
  console.log("[Start Query] Checking for missing RWIS predictions...");
  const imagesForPredRWIS = predictionExistsRWIS(
    actualImagesRWIS,
    imageQueryRWIS,
  );
  console.log(`[Start Query] Found ${Object.keys(imagesForPredRWIS || {}).length} RWIS images needing prediction.`);
  
  console.log("[Start Query] Checking for missing AVL predictions...");
  const imagesForPredAVL = predictionExistsAVL(actualImagesAVL, imageQueryAVL);
   console.log(`[Start Query] Found ${Object.keys(imagesForPredAVL || {}).length} AVL images needing prediction.`);

  // If there are images to predict, prep request to RWIS/AVL backend asynchronously
  if (imagesForPredAVL) {
    console.log("[Start Query] Sending AVL prediction request...");
    // console.log("[Start Query] AVL Prediction Payload Sample:", JSON.stringify(Object.values(imagesForPredAVL || {}).slice(0,2)));
    sendPredictionsAVL(imagesForPredAVL, date, window);
  } else {
    console.log("[Start Query] No AVL predictions needed.");
  }

  if (imagesForPredRWIS) {
    console.log("[Start Query] Sending RWIS prediction request...");
    // console.log("[Start Query] RWIS Prediction Payload Sample:", JSON.stringify(Object.values(imagesForPredRWIS || {}).slice(0,2)));
    sendPredictionsRWIS(imagesForPredRWIS, date, window);
  } else {
    console.log("[Start Query] No RWIS predictions needed.");
  }

  // Update with initial visualization
  console.log("[Start Query] Updating map visualization...");
  updateAll(imageQueryAVL, imageQueryRWIS);
  console.log("[Start Query] Query processing complete.");
}

async function sendPredictionsAVL(imagesForPredAVL, date, window) {
  enableLoadingScreen();
  try {
    console.log("POSTing to AVL Backend");

    console.time("Request Duration");
    const responseData = await postRequestToBackend(
      imagesForPredAVL,
      100,
      "/avl",
    );
    console.timeEnd("Request Duration");

    console.log("Response from AVL Backend: ", responseData);
  } catch (error) {
    console.error("Error:", error);
  }

  const [startTimestamp, endTimestamp] = calculateDataRange(date, window);
  const [imageQueryAVL, imageQueryRWIS] = await queryImagesByDateRange(
    startTimestamp,
    endTimestamp,
  );
  updateAll(imageQueryAVL, imageQueryRWIS);
  fadeOutLoadingScreen();
}

async function sendPredictionsRWIS(imagesForPredRWIS, date, window) {
  try {
    console.log("POSTing to RWIS Backend");

    console.time("Request Duration");
    const responseData = await postRequestToBackend(imagesForPredRWIS, 10, "");
    console.timeEnd("Request Duration");

    console.log("Response from RWIS Backend: ", responseData);
  } catch (error) {
    console.error("Error:", error);
  }

  const [startTimestamp, endTimestamp] = calculateDataRange(date, window);

  const [imageQueryAVL, imageQueryRWIS] = await queryImagesByDateRange(
    startTimestamp,
    endTimestamp,
  );

  updateAll(imageQueryAVL, imageQueryRWIS);
}

function chunkObject(obj, size) {
  // Subdivide full dict to list of subdicts with length "size"
  const chunks = [];
  let currentChunk = {};

  for (const [key, value] of Object.entries(obj)) {
    currentChunk[key] = value;

    if (Object.keys(currentChunk).length === size) {
      chunks.push(currentChunk);
      currentChunk = {};
    }
  }

  if (Object.keys(currentChunk).length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

const RWIS_URL = "https://index-xmctotgaqq-uc.a.run.app";
function postRequestToBackend(imagesForPred, chunkSize, endpoint) {
  // console.log("Inside postRequestToBackend");

  const URL = RWIS_URL + endpoint;
  const chunks = chunkObject(imagesForPred, chunkSize);
  // console.log("Chunked request data to be sent to backend:");
  // const jsonString = JSON.stringify(chunks, null, 2);
  // console.log(jsonString);

  const promises = chunks.map((chunk) => {
    // console.log(JSON.stringify(chunk, null, 2));
    return fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chunk),
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    });
  });

  console.log("\n# of requests to backend: " + Object.keys(promises).length);
  return Promise.all(promises);
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

async function triggerBackendStartup(i) {
  console.time("GET Request Duration " + i);
  try {
    const response = await fetch(RWIS_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Backend triggered successfully:", data);
  } catch (error) {
      console.error(`[triggerBackendStartup ${i}] Fetch failed:`, error);
      throw error;
  } finally {
       console.timeEnd("GET Request Duration " + i);
  }
}

const CONTAINERS = 5; // 5 fast requests spins up 2 containers
// Upon startup, spin up cloud run containers in advance
document.addEventListener("DOMContentLoaded", async (event) => {
  console.log(
    "Webpage has been opened, spinning up RWIS and AVL backend containers",
  );

  const promises = [];
  for (let i = 0; i < CONTAINERS; i++) {
    promises.push(triggerBackendStartup(i).catch(error => {
      console.error(`Backend trigger ${i} failed:`, error);
      return null;
    }));
  }

  await Promise.all(promises);
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

// Handle auto-population of NIK data (TODO: Remove this function once NIK is automated)
document.addEventListener("DOMContentLoaded", function () {
  const select = document.getElementById("nik-options");
  const jsonFilePath =
    "https://raw.githubusercontent.com/vstfl/mapbox-rsi/main/docs/assets/generatedNIKInterpolations/file-list.json";
  const baseFileUrl =
    "https://raw.githubusercontent.com/vstfl/mapbox-rsi/main/docs/assets/generatedNIKInterpolations/";

  function populateDropdown(files) {
    files.forEach((file) => {
      const option = document.createElement("option");
      option.value = baseFileUrl + file;
      option.textContent = file.split(".")[0].replaceAll("_", "-");
      select.appendChild(option);
    });
  }

  fetch(jsonFilePath)
    .then((response) => {
        // Check if response is ok before parsing JSON
        if (!response.ok) {
            throw new Error(`HTTP error loading file list! status: ${response.status}`);
        }
        return response.json();
    })
    .then((files) => {
      populateDropdown(files);
    })
    .catch((error) => {
        // Log the specific error from fetch or json parsing
        console.error("Error fetching or parsing NIK file list:", error);
        // Optionally display a message to the user in the UI
    });
});

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
    console.log("Selected NIK interpolation: ", selectedValue);

    // Change currentNIKGeoJSON according to selected value
    try {
      const response = await fetch(selectedValue);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      currentNIKGeoJSON = await response.json();
      console.log("Loaded GeoJSON file:", selectedValue);
      // console.log(currentNIKGeoJSON)
    } catch (error) {
      console.error("Error loading GeoJSON file:", error);
    }

    let date = NIKData(selectedValue);
    let window = 30;

    console.log("\n\nTEST DATE: " + date + "\nTEST WINDOW: " + window + "\n\n");
    await startQuery(date, window);
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

    currentInterpolatedGeoJSON = await interpolateGeoJSONLanes(currentGeoJSON);
    updateInterpolation(currentInterpolatedGeoJSON);
    interpolationState = true;
  });

// Logic to update website every minute in realtime mode
let isUpdating = false;
async function updateRealtimeData() {
  // Check the state directly instead of the local variable for robustness
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

  // Removed redundant check for realtimeState, now checking isRealtimeEnabled above
  // if (realtimeState) { ... } else { ... }
  
  console.log("\n\nPerforming realtime update...");
  let d = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Use a default window for realtime, or get from state if set elsewhere
  const window = getState('timeRange') || 30; // Default to 30 mins if not set
  let date = DateTime.now().setZone("America/Chicago");
  date = date.toISO();
  console.log("Realtime Date: " + date);
  console.log("Realtime Window: " + window);

  try { // Add try/catch around the core update logic
      await startQuery(date, window); 
      console.log(`Latest map update: ${d}`);
  } catch (error) {
      console.error("[updateRealtimeData] Error during realtime query:", error);
      // Optionally: show user feedback
  }

  isUpdating = false;
}
// setInterval(updateRealtimeData, 40000); // REMOVE unconditional interval setup

async function mesonetGETAVL(date, window) {
  console.log("Performing get request to mesonet...");
  const baseUrl = "https://mesonet.agron.iastate.edu/api/1/idot_dashcam.json";

  const dateTime = new Date(date);
  const validTimestamp = dateTime.toISOString();
  const url = `${baseUrl}?valid=${encodeURIComponent(validTimestamp)}&window=${window}`;

  console.log(url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }

    const data = await response.json();
    console.log("Response from mesonet API:", data);
    return data;
  } catch (error) {
    console.error("There was a problem fetching the AVL data:", error);
    throw error;
  }
}

async function mesonetScrapeRWISv2(startTimestamp, endTimestamp) {
  // Return a list of available image URLs from mesonet
  const ids = [
    "IDOT-000-03",
    "IDOT-001-00",
    "IDOT-008-00",
    "IDOT-010-01",
    "IDOT-025-01",
    "IDOT-025-04",
    "IDOT-030-01",
    "IDOT-036-00",
    "IDOT-036-03",
    "IDOT-040-00",
    "IDOT-047-00",
    "IDOT-047-01",
    "IDOT-047-02",
    "IDOT-047-05",
    "IDOT-047-06",
    "IDOT-051-01",
    "IDOT-051-02",
    "IDOT-053-00",
    "IDOT-053-02",
    "IDOT-056-00",
  ];

  let modifiedStart = new Date(endTimestamp);
  modifiedStart.setMinutes(modifiedStart.getMinutes() - 60);

  const availableImages = [];

  if (isDifferentDay(modifiedStart, new Date(endTimestamp))) {
    console.log("Query spans two UTC days");
    let midnight = new Date(modifiedStart);
    midnight.setHours(24, 0, 0, 0);

    for (const id of ids) {
      const stationImagesFirstDay = await findImages(
        id,
        modifiedStart,
        midnight,
      );
      availableImages.push(...stationImagesFirstDay);

      const stationImagesSecondDay = await findImages(
        id,
        midnight,
        endTimestamp,
      );
      availableImages.push(...stationImagesSecondDay);
    }
  } else {
    for (const id of ids) {
      const stationImages = await findImages(id, modifiedStart, endTimestamp);
      availableImages.push(...stationImages);
    }
  }

  // console.log("Actual Available Images: " + availableImages.length);
  console.log("Available RWIS images: " + availableImages.length);
  return availableImages;
}

async function findImages(rwisID, startTimestamp, endTimestamp) {
  // Use of .toISOString to enforce UTC timestamping
  const s = new DateTimeConstants(startTimestamp);
  const e = new DateTimeConstants(endTimestamp);
  const stationURL = `https://mesonet.agron.iastate.edu/archive/data/${s.year}/${s.month}/${s.day}/camera/${rwisID}`;
  const stationURLS = await parseStationURL(stationURL);
  const stationFilteredImages = filterURLS(stationURLS, s, e);
  return stationFilteredImages;
}

function filterURLS(stationURLS, s, e) {
  // Can assume that images passed to this function consist only of images within the same day
  // TODO: This creates unknown edgecases between days. Will probably have to re-write this for a full implementation

  let filteredImages = [];
  for (const url of stationURLS) {
    const urlStart = url.lastIndexOf("_") + 1;
    const urlEnd = url.lastIndexOf(".");
    const urlHHMM = url.substring(urlStart, urlEnd).slice(-4);

    if (isInRange(urlHHMM, s, e)) {
      filteredImages.push(url);
    }
  }
  return filteredImages;
}

async function parseStationURL(stationURL) {
  let stationURLS = [];
  try {
    const response = await fetch(stationURL);
    const htmlText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const links = doc.querySelectorAll("a");

    links.forEach((link) => {
      const href = link.getAttribute("href");
      // console.log(href);
      if (href.startsWith("IDOT") && href.endsWith(".jpg")) {
        stationURLS.push(stationURL + "/" + href);
      }
    });
  } catch (error) {
    console.error("Error fetching or parsing the URL:", error);
  }

  return stationURLS;
}

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
