/**
 * UI Interactions Module
 * This module handles UI-related interactions and event listeners.
 */
import { getState, setState } from '../../core/stateManager';
import { updateMapData } from '../../mapInteractions';
// Import chart functions if they are needed for updates
import { addData, removeData } from '../../charts.js'; 

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
 * Toggles between original and gradcam images for RWIS points
 */
export function toggleImageSrc() {
  // Get the latest clickedPointValues from state
  const clickedPointValues = getState('clickedPointValues');
  if (!clickedPointValues) return;
  
  const imageElement = document.getElementById('pointImage');
  if (!imageElement) return;
  
  // Get the stored aspect ratio
  const aspectRatio = getState('imageAspectRatio');
  const aspectRatioStyle = aspectRatio && isFinite(aspectRatio) ? aspectRatio.toString() : '';
  
  let img1 = clickedPointValues.image;
  if (!clickedPointValues.CAM && clickedPointValues.type === 'RWIS') {
    // Convert to gradcam image URL
    let img2 = `https://storage.googleapis.com/rwis_cam_images/images/${img1.split('/').pop()}_gradcam.png`;
    
    // Update UI
    imageElement.src = img2;
    // Apply aspect ratio style
    imageElement.style.aspectRatio = aspectRatioStyle;
    
    // Update state
    setState('clickedPointValues', { ...clickedPointValues, CAM: true });
  } else {
    // Revert to original image
    imageElement.src = img1;
    // Apply aspect ratio style
    imageElement.style.aspectRatio = aspectRatioStyle;
    
    // Update state
    setState('clickedPointValues', { ...clickedPointValues, CAM: false });
  }
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
 * Sets up all event listeners for UI elements
 */
export function setupEventListeners() {
  // Handle study area toggle
  const studyAreaToggle = document.querySelector('#studyarea-toggle');
  if (studyAreaToggle) {
    studyAreaToggle.addEventListener('change', toggleStudyArea);
  }
  
  // Handle realtime toggle
  const realtimeToggle = document.querySelector('#realtime-toggle');
  if (realtimeToggle) {
    realtimeToggle.addEventListener('change', toggleRealtime);
  }
  
  // Handle console shift toggle button
  const shiftButton = document.getElementById('shift-button');
  if (shiftButton) {
    shiftButton.addEventListener('click', toggleConsole);
  }
  
  // Handle range slider value change visual
  const slider = document.getElementById('time-range');
  const sliderValue = document.getElementById('slider-value');
  if (slider && sliderValue) {
    slider.addEventListener('input', function() {
      sliderValue.textContent = this.value;
      setState('timeRange', parseInt(this.value, 10));
    });
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
  }
  if (leftButton) {
    leftButton.addEventListener('click', () => handleAngleChange('prev'));
  }
  if (rightButton) {
    rightButton.addEventListener('click', () => handleAngleChange('next'));
  }
} 