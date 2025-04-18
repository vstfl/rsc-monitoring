/**
 * UI Interactions Module
 * This module handles UI-related interactions and event listeners.
 */
import { getState, setState } from '../../core/stateManager';
import { updateMapData } from '../../mapInteractions';

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
  
  let img1 = clickedPointValues.image;
  if (!clickedPointValues.CAM && clickedPointValues.type === 'RWIS') {
    // Convert to gradcam image URL
    let img2 = `https://storage.googleapis.com/rwis_cam_images/images/${img1.split('/').pop()}_gradcam.png`;
    
    // Update UI
    imageElement.src = img2;
    // Update state
    setState('clickedPointValues', { ...clickedPointValues, CAM: true });
  } else {
    // Revert to original image
    imageElement.src = img1;
    // Update state
    setState('clickedPointValues', { ...clickedPointValues, CAM: false });
  }
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
} 