/**
 * UI Interactions Module
 * This module handles UI-related interactions and event listeners.
 */
import { getState, setState, subscribe } from '../../core/stateManager';
import { updateMapData } from '../../mapInteractions';
// Import chart functions if they are needed for updates
import { addData, removeData } from '../../charts.js'; 
import Logger from '../logger.js';

const CONTEXT = 'UIInteractions';

/**
 * Toggles the console visibility and adjusts map padding
 */
export function toggleConsole() {
  const consoleElement = document.getElementById('console');
  const shiftButton = document.getElementById('shift-button');
  
  // Toggle UI elements if they exist
  if (consoleElement) {
    consoleElement.classList.toggle('shifted');
  }
  
  if (shiftButton) {
    shiftButton.classList.toggle('shifted');
  }
  
  const flipped = toggleArrow();
  
  // Adjust map padding based on console visibility
  const map = getState('map');
  if (map && consoleElement) {
    const padding = {};
    const currentWidth = consoleElement.clientWidth || consoleElement.offsetWidth;
    padding.right = flipped ? 0 : currentWidth;
    
    map.easeTo({
      padding: padding,
      duration: 1000
    });
  }
}

/**
 * Toggles the arrow image's flip state
 * @returns {boolean} The new state of the arrow or false if element not found
 */
export function toggleArrow() {
  const arrowImg = document.getElementById('arrow-img');
  if (!arrowImg) return false;
  
  return arrowImg.classList.toggle('flipped');
}

/**
 * Scrolls the console to the bottom
 */
export function scrollToBottom() {
  const consoleDiv = document.querySelector('.console.resizable');
  if (consoleDiv) {
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
  }
}

/**
 * Toggles the study area state and updates the map if needed
 * @param {Event} e - The change event
 */
export function toggleStudyArea(e) {
  if (!e || !e.target) return;
  
  const isEnabled = e.target.checked;
  setState('studyAreaState', isEnabled);
  
  // Refresh the map data if we have current GeoJSON
  const currentGeoJSON = getState('currentGeoJSON');
  if (currentGeoJSON) {
    updateMapData(currentGeoJSON);
  }
}

/**
 * Toggles the realtime state and updates UI elements
 * @param {Event} e - The change event
 */
export function toggleRealtime(e) {
  if (!e || !e.target) return;
  
  const isEnabled = e.target.checked;
  
  // Update UI elements based on realtime state
  const archivedQuery = document.querySelectorAll('.archived-query');
  if (archivedQuery) {
    archivedQuery.forEach(query => {
      if (query && query.style) {
        query.style.display = isEnabled ? 'none' : 'flex';
      }
    });
  }
  
  // Set the realtime state
  setState('realtimeState', isEnabled);
}

/**
 * Toggles the CAM state flag for RWIS points.
 * When an RWIS point's image is clicked, this function flips the `CAM` boolean flag
 * within the `clickedPointValues` state object.
 * The actual image display logic (showing original vs. GradCAM and handling aspect ratio)
 * is managed by the `updatePointInfoPanel` function, which subscribes to state changes.
 */
export function toggleImageSrc() {
  Logger.debug("toggleImageSrc called.", CONTEXT);
  const clickedPointValues = getState('clickedPointValues');
  
  if (!clickedPointValues) {
      Logger.warn("toggleImageSrc: clickedPointValues is null, exiting.", CONTEXT);
      return;
  }

  if (clickedPointValues.type !== 'RWIS') {
      Logger.warn("toggleImageSrc: Point type is not RWIS, toggle ignored.", CONTEXT);
      return; // Only toggle for RWIS
  }

  const currentCamState = clickedPointValues.CAM;
  const targetCamState = !currentCamState;

  // Only update the CAM flag in the state
  const newState = { ...clickedPointValues, CAM: targetCamState };
  Logger.debug("Calling setState to toggle CAM flag:", CONTEXT, { targetCamState });
  setState('clickedPointValues', newState);
}

/**
 * Populates the angle selector dropdown for RWIS points.
 * @param {object} anglesObject - The object containing angle data { angleKey: { url, class, classification } }.
 * @param {string} selectedAngle - The angle key that should be initially selected.
 */
export function populateAngleSelector(anglesObject, selectedAngle) {
  const selectElement = document.getElementById('angle-select');
  if (!selectElement) return;

  // Clear existing options (except the placeholder)
  selectElement.innerHTML = '<option value="" disabled>Angle</option>'; 

  if (!anglesObject || Object.keys(anglesObject).length === 0) {
    selectElement.disabled = true;
    return;
  }

  selectElement.disabled = false;
  const angleKeys = Object.keys(anglesObject).sort(); // Sort keys numerically/alphabetically

  angleKeys.forEach(angleKey => {
    const option = document.createElement('option');
    option.value = angleKey;
    option.textContent = angleKey; // Display the angle number/key
    if (angleKey === selectedAngle) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
}

/**
 * Updates the displayed image, chart, and state based on the selected angle.
 * @param {string} newAngleKey - The new angle key to display.
 */
export function updateDisplayedAngle(newAngleKey) {
  const clickedPointValues = getState('clickedPointValues');
  const imageElement = document.getElementById('pointImage');
  // Assuming you have access to the chart instance here or pass it in
  const chart = getState('chart'); // Or get it however it's managed

  if (!clickedPointValues || !clickedPointValues.angles || !imageElement || !chart) {
    console.error("[updateDisplayedAngle] Missing state, element, or chart.");
    return;
  }

  const angleData = clickedPointValues.angles[newAngleKey];
  if (!angleData) {
    console.error(`[updateDisplayedAngle] No data found for angle: ${newAngleKey}`);
    return;
  }

  console.log(`[updateDisplayedAngle] Updating to angle: ${newAngleKey}`, angleData);

  // Update Image
  if (angleData.url) {
    imageElement.src = angleData.url;
    imageElement.parentNode.style.display = "block";
  } else {
    imageElement.src = "";
    imageElement.parentNode.style.display = "none";
  }

  // Update Chart
  removeData(chart);
  if (angleData.class) {
    addData(chart, angleData.class);
  } else {
     console.warn(`[updateDisplayedAngle] No class data for angle ${newAngleKey}`);
  }

  // Update State
  setState('clickedPointValues', {
    ...clickedPointValues,
    currentAngle: newAngleKey,
    image: angleData.url,
    classification: angleData.classification,
    classes: angleData.class,
    CAM: false // Reset CAM state when angle changes
  });
  
  // Update dropdown selection (might be redundant if triggered by dropdown change)
  const selectElement = document.getElementById('angle-select');
  if (selectElement) {
      selectElement.value = newAngleKey;
  }
}

/**
 * Handles clicks on the angle navigation arrows.
 * @param {'next' | 'prev'} direction - The direction to navigate.
 */
export function handleAngleChange(direction) {
  const clickedPointValues = getState('clickedPointValues');
  if (!clickedPointValues || !clickedPointValues.angles || !clickedPointValues.currentAngle) {
    return; // No angles to change
  }

  const angleKeys = Object.keys(clickedPointValues.angles).sort();
  const currentIndex = angleKeys.indexOf(clickedPointValues.currentAngle);

  if (currentIndex === -1) return; // Current angle not found

  let nextIndex;
  if (direction === 'next') {
    nextIndex = (currentIndex + 1) % angleKeys.length;
  } else { // prev
    nextIndex = (currentIndex - 1 + angleKeys.length) % angleKeys.length;
  }

  const newAngleKey = angleKeys[nextIndex];
  updateDisplayedAngle(newAngleKey);
}

/**
 * Updates the point information panel based on the clicked point data.
 * This function subscribes to stateManager's 'clickedPointValues' and updates the UI elements
 * in the side panel (ID, timestamp, image, angle controls, chart) accordingly.
 * 
 * Image Handling for RWIS points:
 * - Determines whether to display the original image or the GradCAM image based on the `CAM` flag in `pointData`.
 * - Adds a click listener to RWIS images to trigger `toggleImageSrc`.
 * - Aspect Ratio Handling: 
 *   - On the first load of an original RWIS image, it calculates the image's natural aspect ratio 
 *     (width/height) and stores it in the `imageAspectRatio` state.
 *   - For subsequent loads of the same point's images (including the GradCAM toggle), it retrieves
 *     the stored aspect ratio from the state and applies it via CSS (`aspect-ratio`) to ensure
 *     both original and GradCAM images are displayed with the same dimensions.
 *   - The stored aspect ratio is cleared if the panel is cleared, an image fails to load, or a non-RWIS point is shown.
 *
 * @param {object | null} pointData - The data object for the clicked point (from `clickedPointValues` state), or null to clear the panel.
 */
export function updatePointInfoPanel(pointData) {
    Logger.info("updatePointInfoPanel called with data:", CONTEXT, pointData);
    Logger.debug("Updating point info panel", CONTEXT, pointData);

    // Get references to DOM elements
    const idDisplay = document.getElementById("pointID");
    const timeDisplay = document.getElementById("pointTimestamp");
    const imageDisplay = document.getElementById("pointImage");
    const imgControls = document.getElementById("img-buttons");
    const angleSelect = document.getElementById("angle-select");
    const chart = getState('chart'); // Get chart instance from state

    // Ensure elements exist before manipulating
    if (!idDisplay || !timeDisplay || !imageDisplay || !imgControls || !angleSelect || !chart) {
        Logger.error("One or more point info panel elements not found.", CONTEXT);
        return;
    }

    if (pointData) {
        // Update Text Content
        idDisplay.textContent = pointData.avlID || '';
        timeDisplay.textContent = pointData.timestamp || '';

        // Determine the correct image URL based on state
        let imageUrlToShow = "./assets/no_image.png"; // Default
        const baseImageUrl = pointData.image;
        const isRwis = pointData.type === 'RWIS';
        const showCam = pointData.CAM === true;

        if (isRwis && baseImageUrl) {
            if (showCam) {
                imageUrlToShow = `https://storage.googleapis.com/rwis_cam_images/images/${baseImageUrl.split('/').pop()}_gradcam.png`;
                Logger.debug("Showing GradCAM image", CONTEXT, { url: imageUrlToShow });
            } else {
                imageUrlToShow = baseImageUrl;
                Logger.debug("Showing Original image", CONTEXT, { url: imageUrlToShow });
            }
        } else if (baseImageUrl) {
            imageUrlToShow = baseImageUrl; // For non-RWIS
            Logger.debug("Showing non-RWIS image", CONTEXT, { url: imageUrlToShow });
        } else {
             Logger.warn("No base image URL provided.", CONTEXT);
        }

        // Update Image Element Source and Click Listener
        imageDisplay.src = imageUrlToShow;
        imageDisplay.parentNode.style.display = "block";
        imageDisplay.removeEventListener('click', toggleImageSrc); // Remove previous listener

        if (isRwis) {
            imageDisplay.addEventListener('click', toggleImageSrc);
            imageDisplay.onload = () => {
                 // --- REVISED ASPECT RATIO LOGIC START ---
                 let currentAspectRatio = getState('imageAspectRatio');
                 
                 if (currentAspectRatio && isFinite(currentAspectRatio)) {
                     // Aspect ratio already calculated and stored (likely from original image load)
                     // Apply the stored aspect ratio.
                     Logger.debug("Applying stored aspect ratio:", CONTEXT, { currentAspectRatio });
                     imageDisplay.style.aspectRatio = currentAspectRatio.toString();
                 } else if (imageDisplay.naturalWidth > 0 && imageDisplay.naturalHeight > 0) {
                     // Aspect ratio not stored yet, and image has valid dimensions.
                     // Calculate it from this loaded image (should be the original).
                     const calculatedAspectRatio = imageDisplay.naturalWidth / imageDisplay.naturalHeight;
                     if (isFinite(calculatedAspectRatio)) {
                         Logger.debug("Calculating and storing new aspect ratio:", CONTEXT, { calculatedAspectRatio });
                         setState('imageAspectRatio', calculatedAspectRatio);
                         imageDisplay.style.aspectRatio = calculatedAspectRatio.toString();
                     } else {
                         Logger.warn("Calculated aspect ratio is invalid.", CONTEXT);
                         imageDisplay.style.aspectRatio = ''; // Clear if calculation failed
                     }
                 } else {
                     // Image dimensions not available or invalid, clear style
                     Logger.warn("Cannot determine aspect ratio, naturalWidth/Height invalid.", CONTEXT);
                     imageDisplay.style.aspectRatio = '';
                     setState('imageAspectRatio', null); // Clear stored value if invalid
                 }
                 // --- REVISED ASPECT RATIO LOGIC END ---
                 imageDisplay.onload = null; // Prevent potential loops
             }
             imageDisplay.onerror = () => {
                Logger.error("Error loading image:", CONTEXT, imageDisplay.src);
                imageDisplay.style.aspectRatio = ''; // Clear on error
                setState('imageAspectRatio', null); // Clear stored aspect ratio on error
                imageDisplay.onerror = null;
                imageDisplay.onload = null;
             }
        } else {
             // Clear aspect ratio for non-RWIS images
             imageDisplay.style.aspectRatio = '';
             setState('imageAspectRatio', null); // Also clear stored value
        }

        // Update Angle Controls (for RWIS)
        if (isRwis && pointData.angles) {
            imgControls.style.display = "flex";
            populateAngleSelector(pointData.angles, pointData.currentAngle);
        } else {
            imgControls.style.display = "none";
            angleSelect.innerHTML = '<option value="" disabled>Angle</option>';
            angleSelect.disabled = true;
        }

        // Update Chart Data
        removeData(chart);
        if (pointData.classes) {
            Logger.debug("Updating chart with data", CONTEXT, pointData.classes);
            addData(chart, pointData.classes);
        } else {
            Logger.warn("No class data available for chart update.", CONTEXT);
        }

    } else {
        // Clear the panel if pointData is null
        idDisplay.textContent = '';
        timeDisplay.textContent = '';
        imageDisplay.src = "./assets/no_image.png";
        imageDisplay.parentNode.style.display = "block";
        imageDisplay.removeEventListener('click', toggleImageSrc);
        imgControls.style.display = "none";
        angleSelect.innerHTML = '<option value="" disabled>Angle</option>';
        angleSelect.disabled = true;
        removeData(chart);
        imageDisplay.style.aspectRatio = '';
        setState('imageAspectRatio', null); // <<< ENSURE STATE IS CLEARED HERE TOO
    }
}

/**
 * Sets up all event listeners for UI elements
 */
export function setupEventListeners() {
  Logger.debug("Setting up standard DOM event listeners", CONTEXT);
  
  // Handle study area toggle
  const studyAreaToggle = document.querySelector('#studyarea-toggle');
  if (studyAreaToggle) {
    studyAreaToggle.addEventListener('change', toggleStudyArea);
  } else {
    Logger.warn("Study area toggle not found, listener not attached.", CONTEXT);
  }
  
  // Handle realtime toggle
  const realtimeToggle = document.querySelector('#realtime-toggle');
  if (realtimeToggle) {
    realtimeToggle.addEventListener('change', toggleRealtime);
  } else {
    Logger.warn("Realtime toggle not found, listener not attached.", CONTEXT);
  }
  
  // Handle console shift toggle button
  const shiftButton = document.getElementById('shift-button');
  if (shiftButton) {
    // Add the listener previously in webInteractions.js
    shiftButton.addEventListener('click', toggleConsole);
  } else {
    Logger.warn("Shift button not found, listener not attached.", CONTEXT);
  }
  
  // Handle range slider value change visual
  const slider = document.getElementById('time-range');
  const sliderValue = document.getElementById('slider-value');
  if (slider && sliderValue) {
    slider.addEventListener('input', function() {
      sliderValue.textContent = this.value;
      // State update is now handled directly in webInteractions.js listener
      // setState('timeRange', parseInt(this.value, 10)); 
    });
     // Initialization of display/state is handled in webInteractions.js
  } else {
     Logger.warn("Time range slider or value display element not found, listener not attached.", CONTEXT);
  }

  // Add listeners for angle controls
  const angleSelect = document.getElementById('angle-select');
  const leftButton = document.getElementById('img-button-left');
  const rightButton = document.getElementById('img-button-right');

  if (angleSelect) {
    angleSelect.addEventListener('change', (event) => {
        if (event.target.value) {
            updateDisplayedAngle(event.target.value);
        }
    });
  } else {
    Logger.warn("Angle select element not found, listener not attached.", CONTEXT);
  }
  if (leftButton) {
    leftButton.addEventListener('click', () => handleAngleChange('prev'));
  } else {
    Logger.warn("Angle left button not found, listener not attached.", CONTEXT);
  }
  if (rightButton) {
    rightButton.addEventListener('click', () => handleAngleChange('next'));
  } else {
    Logger.warn("Angle right button not found, listener not attached.", CONTEXT);
  }
}

/**
 * Sets up all UI event listeners and state subscriptions.
 * Should be called once on DOMContentLoaded.
 */
export function initializeUI() {
    Logger.info("INITIALIZING UI...", CONTEXT);
    setupEventListeners(); // Setup standard DOM listeners

    // Subscribe UI updates to state changes
    Logger.debug("Subscribing updatePointInfoPanel to clickedPointValues changes", CONTEXT);
    subscribe('clickedPointValues', updatePointInfoPanel);
    // TODO: Add subscription for hover info panel update to 'hoveredPointValues'
    // subscribe('hoveredPointValues', updateHoverInfo);

    Logger.info("UI Initialized.", CONTEXT);
} 