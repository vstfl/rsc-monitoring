/**
 * API Service Module
 * Handles interactions with external APIs (Mesonet, Backend Warmup, etc.)
 */

import Logger from './logger.js';
import { DateTime, DateTimeConstants, isInRange } from './utils/dateTimeUtils.js'; // Assuming dateTimeUtils provides these

const CONTEXT = 'ApiService';

// === Mesonet API Functions ===

/**
 * Fetches AVL data from Mesonet API for a given date and window.
 * @param {string} date - ISO date string
 * @param {number} window - Time window in minutes
 * @returns {Promise<Object>} The AVL data from the API.
 */
export async function mesonetGETAVL(date, window) {
  Logger.debug("Fetching Mesonet AVL data...", CONTEXT, { date, window });
  const baseUrl = "https://mesonet.agron.iastate.edu/api/1/idot_dashcam.json"; // TODO: Move to config/constants
  const dateTime = new Date(date);
  const validTimestamp = dateTime.toISOString();
  const url = `${baseUrl}?valid=${encodeURIComponent(validTimestamp)}&window=${window}`;
  Logger.debug(`Mesonet AVL URL: ${url}`, CONTEXT);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Mesonet AVL fetch failed! status: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    Logger.debug("Mesonet AVL response received", CONTEXT, { count: data?.data?.length || 0 });
    return data;
  } catch (error) {
    Logger.error(`Error fetching Mesonet AVL data: ${error.message}`, CONTEXT, error);
    throw error; // Re-throw to allow caller to handle
  }
}

/**
 * Fetches available RWIS image URLs from Mesonet archive by scraping HTML indexes.
 * @param {Date} startTimestamp - Start date object.
 * @param {Date} endTimestamp - End date object.
 * @returns {Promise<Array<string>>} A list of available image URLs.
 */
export async function mesonetScrapeRWISv2(startTimestamp, endTimestamp) {
  Logger.debug("Scraping Mesonet RWIS images...", CONTEXT, { startTimestamp, endTimestamp });
  // Return a list of available image URLs from mesonet
  const ids = [ // TODO: Move to config/constants
    "IDOT-000-03", "IDOT-001-00", "IDOT-008-00", "IDOT-010-01", "IDOT-025-01",
    "IDOT-025-04", "IDOT-030-01", "IDOT-036-00", "IDOT-036-03", "IDOT-040-00",
    "IDOT-047-00", "IDOT-047-01", "IDOT-047-02", "IDOT-047-05", "IDOT-047-06",
    "IDOT-051-01", "IDOT-051-02", "IDOT-053-00", "IDOT-053-02", "IDOT-056-00",
  ];

  // Original logic subtracts 60 mins - consider if this is correct or should be passed in.
  // Keeping original logic for now.
  let modifiedStart = new Date(endTimestamp);
  modifiedStart.setMinutes(modifiedStart.getMinutes() - 60);

  const availableImages = [];
  const isDifferentDay = (d1, d2) => d1.getUTCDate() !== d2.getUTCDate() || d1.getUTCMonth() !== d2.getUTCMonth() || d1.getUTCFullYear() !== d2.getUTCFullYear();

  if (isDifferentDay(modifiedStart, new Date(endTimestamp))) {
    Logger.debug("RWIS scrape query spans two UTC days", CONTEXT);
    let midnight = new Date(modifiedStart);
    midnight.setUTCHours(24, 0, 0, 0); // Use UTC midnight

    const promises = ids.flatMap(id => [
      findImages(id, modifiedStart, midnight), // Fetch for first day
      findImages(id, midnight, endTimestamp)   // Fetch for second day
    ]);
    const results = await Promise.all(promises);
    availableImages.push(...results.flat());

  } else {
    const promises = ids.map(id => findImages(id, modifiedStart, endTimestamp));
    const results = await Promise.all(promises);
    availableImages.push(...results.flat());
  }

  Logger.debug(`Found ${availableImages.length} available RWIS images.`, CONTEXT);
  return availableImages;
}

/**
 * Helper to find image URLs for a specific station within a date range for a single day.
 * @param {string} rwisID - The RWIS station ID.
 * @param {Date} startTimestamp - Start date object.
 * @param {Date} endTimestamp - End date object.
 * @returns {Promise<Array<string>>} List of filtered image URLs.
 */
async function findImages(rwisID, startTimestamp, endTimestamp) {
  // Use of .toISOString to enforce UTC timestamping
  const s = new DateTimeConstants(startTimestamp); // Assumes DateTimeConstants handles Date objects
  const e = new DateTimeConstants(endTimestamp);   // Assumes DateTimeConstants handles Date objects
  const stationURL = `https://mesonet.agron.iastate.edu/archive/data/${s.year}/${s.month}/${s.day}/camera/${rwisID}`; // TODO: Move base URL to constants
  const stationURLS = await parseStationURL(stationURL);
  const stationFilteredImages = filterURLS(stationURLS, s, e);
  return stationFilteredImages;
}

/**
 * Filters a list of station image URLs based on time range.
 * @param {Array<string>} stationURLS - List of full image URLs for a station/day.
 * @param {DateTimeConstants} s - Start time constants.
 * @param {DateTimeConstants} e - End time constants.
 * @returns {Array<string>} Filtered list of URLs.
 */
function filterURLS(stationURLS, s, e) {
  let filteredImages = [];
  for (const url of stationURLS) {
    const urlStart = url.lastIndexOf("_") + 1;
    const urlEnd = url.lastIndexOf(".");
    const urlHHMM = url.substring(urlStart, urlEnd).slice(-4);

    // Assumes isInRange handles HHMM format comparison correctly
    if (isInRange(urlHHMM, s, e)) { 
      filteredImages.push(url);
    }
  }
  return filteredImages;
}

/**
 * Parses an HTML station archive page to extract image URLs.
 * @param {string} stationURL - The URL of the station archive page.
 * @returns {Promise<Array<string>>} A list of full image URLs.
 */
async function parseStationURL(stationURL) {
  Logger.debug(`Parsing station URL: ${stationURL}`, CONTEXT);
  let stationURLS = [];
  try {
    const response = await fetch(stationURL);
    if (!response.ok) {
        Logger.warn(`Failed to fetch station index ${stationURL}: ${response.status} ${response.statusText}`, CONTEXT);
        return [];
    }
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const links = doc.querySelectorAll("a");

    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("IDOT") && href.endsWith(".jpg")) { 
        stationURLS.push(stationURL + "/" + href);
      }
    });
  } catch (error) {
    Logger.error(`Error fetching or parsing station URL ${stationURL}: ${error.message}`, CONTEXT, error);
    return []; 
  }
  Logger.debug(`Found ${stationURLS.length} image URLs for ${stationURL}`, CONTEXT);
  return stationURLS;
}


// === Backend Interaction Functions ===

const RWIS_PREDICT_URL = "https://rwis-prediction-backend-k7gllt54oa-uc.a.run.app/predict"; // TODO: Move to constants
const AVL_PREDICT_URL = "https://avl-prediction-backend-k7gllt54oa-uc.a.run.app/predict"; // TODO: Move to constants
const INDEX_URL = "https://index-xmctotgaqq-uc.a.run.app"; // TODO: Move to constants

/**
 * Sends a GET request to warm up a backend service.
 * @param {number} i - An identifier for logging purposes.
 * @returns {Promise<Object>} The response from the backend.
 */
export async function triggerBackendStartup(i) {
  // Assuming the warmup target is the RWIS predict URL, adjust if needed
  const WARMUP_URL = RWIS_PREDICT_URL; 
  return Logger.time(`triggerBackendStartup ${i}`, async () => {
      try {
          Logger.debug(`Sending warmup request ${i} to ${WARMUP_URL}`, CONTEXT);
          const response = await fetch(WARMUP_URL, {
              method: "GET",
              headers: {
                  "Content-Type": "application/json",
              },
          });
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          Logger.debug(`Backend trigger ${i} successful:`, CONTEXT, data);
          return data;
      } catch (error) {
          Logger.error(`Backend trigger ${i} failed: ${error.message}`, CONTEXT, error);
          throw error; // Re-throw for potential Promise.all handling
      }
  }, CONTEXT);
}

/**
 * Posts prediction requests to the backend in chunks.
 * @param {Object} imagesForPred - Object with image keys and URLs/data.
 * @param {number} chunkSize - Number of images per request chunk.
 * @param {string} endpoint - The backend prediction endpoint path (e.g., '/predict_rwis').
 * @returns {Promise<Array>} Array of responses from the backend chunks.
 */
export function postRequestToBackend(imagesForPred, chunkSize, endpoint) {
  const BASE_URL = INDEX_URL; // Use the appropriate base URL
  const URL = BASE_URL + endpoint;
  Logger.debug(`Posting ${Object.keys(imagesForPred).length} predictions to ${URL} in chunks of ${chunkSize}`, CONTEXT);
  
  const chunks = chunkObject(imagesForPred, chunkSize);

  const promises = chunks.map((chunk, index) => {
    return Logger.timeAsync(`Prediction chunk ${index+1}/${chunks.length}`, async () => {
        try {
            const response = await fetch(URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(chunk),
            });
            if (!response.ok) {
                // Attempt to get error details from response body
                let errorBody = '';
                try { errorBody = await response.text(); } catch (e) { /* ignore */ }
                Logger.error(`Backend prediction chunk failed`, CONTEXT, {
                    status: response.status,
                    statusText: response.statusText,
                    endpoint: endpoint,
                    chunkIndex: index + 1,
                    errorBody: errorBody
                });
                throw new Error(`Network response was not ok ${response.status} - ${response.statusText}`);
            }
            return await response.json();
        } catch(error) {
             Logger.error(`Error posting prediction chunk ${index+1} to ${endpoint}`, CONTEXT, error);
             throw error; // Re-throw
        }
    }, CONTEXT);
  });

  Logger.debug(`# of chunked requests sent to backend: ${promises.length}`, CONTEXT);
  return Promise.all(promises);
}

/**
 * Helper function to subdivide an object into smaller chunks.
 * @param {Object} obj - The object to chunk.
 * @param {number} size - The maximum size of each chunk.
 * @returns {Array<Object>} An array of chunk objects.
 */
function chunkObject(obj, size) {
  const chunks = [];
  let currentChunk = {};
  let currentSize = 0;

  for (const [key, value] of Object.entries(obj)) {
    currentChunk[key] = value;
    currentSize++;

    if (currentSize === size) {
      chunks.push(currentChunk);
      currentChunk = {};
      currentSize = 0;
    }
  }

  if (currentSize > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Add NIK fetch function if it's purely API related
/**
 * Fetches the list of available NIK interpolation files.
 * @returns {Promise<Array<string>>} A list of NIK filenames.
 */
export async function fetchNikFileList() {
    const jsonFilePath = "https://raw.githubusercontent.com/vstfl/mapbox-rsi/main/docs/assets/generatedNIKInterpolations/file-list.json"; // TODO: Move to constants
    Logger.debug(`Fetching NIK file list from ${jsonFilePath}`, CONTEXT);
    try {
        const response = await fetch(jsonFilePath);
        if (!response.ok) {
            throw new Error(`HTTP error loading NIK file list! status: ${response.status}`);
        }
        const files = await response.json();
        Logger.debug(`Successfully fetched ${files.length} NIK filenames.`, CONTEXT);
        return files;
    } catch (error) {
        Logger.error(`Error fetching NIK file list: ${error.message}`, CONTEXT, error);
        throw error; // Re-throw
    }
}

/**
 * Fetches a specific NIK GeoJSON file.
 * @param {string} fileUrl - The full URL to the NIK GeoJSON file.
 * @returns {Promise<Object>} The parsed GeoJSON object.
 */
export async function fetchNikGeoJson(fileUrl) {
    Logger.debug(`Fetching NIK GeoJSON from ${fileUrl}`, CONTEXT);
    try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`HTTP error loading NIK GeoJSON! status: ${response.status}`);
        }
        const geoJson = await response.json();
        Logger.debug(`Successfully fetched NIK GeoJSON: ${fileUrl}`, CONTEXT);
        return geoJson;
    } catch (error) {
        Logger.error(`Error loading NIK GeoJSON file ${fileUrl}: ${error.message}`, CONTEXT, error);
        throw error; // Re-throw
    }
} 