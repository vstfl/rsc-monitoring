/**
 * Data Transformation Utilities
 * This module provides utilities for transforming data between different formats.
 */

/**
 * Converts array lists of points to GeoJSON format
 * @param {Array} pointListAVL - Array of AVL points
 * @param {Array} pointListRWIS - Array of RWIS points
 * @returns {Object} GeoJSON FeatureCollection
 */
export function convertToGeoJSON(pointListAVL, pointListRWIS) {
  console.log("Converting to GeoJSON. AVL Input:", pointListAVL?.length, "RWIS Input:", pointListRWIS?.length);
  const features = [];
  
  // Process AVL points
  if (pointListAVL && Array.isArray(pointListAVL)) {
    pointListAVL.forEach(point => {
      // Check if point and necessary data exist
      if (point && point.data && point.data.Position && 
          typeof point.data.Position.latitude === 'number' && 
          typeof point.data.Position.longitude === 'number') {
          
        const base = point.data;
        const classification = highestNumberString(
          base.Undefined || 0,
          base.Bare || 0,
          base.Full || 0,
          base.Partly || 0
        );
        
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            // Use the correct path for coordinates
            coordinates: [base.Position.longitude, base.Position.latitude]
          },
          properties: {
            id: point.id,
            type: 'AVL', // Explicitly set type
            specificID: removeLettersAfterUnderscore(point.id),
            timestamp: base.Date?.seconds, // Use safe navigation
            classification: classification,
            image: base.IMAGE_URL,
            classes: { // Include class probabilities if needed
              Undefined: base.Undefined,
              Bare: base.Bare,
              Full: base.Full,
              Partly: base.Partly,
            }
            // Include other relevant properties from point.data if needed
          }
        });
      } else {
        console.warn("Skipping invalid AVL point:", point);
      }
    });
  }
  
  // Process RWIS points
  // Group RWIS points by station ID first
  const RWISMap = {};
  if (pointListRWIS && Array.isArray(pointListRWIS)) {
    pointListRWIS.forEach(point => {
      if (point && point.data && point.data.Coordinates && 
          typeof point.data.Coordinates.latitude === 'number' && 
          typeof point.data.Coordinates.longitude === 'number') {
          
        const base = point.data;
        const id = removeLettersAfterUnderscore(point.id).substring(0, 8);
        
        // Initialize station data if not already present
        if (!(id in RWISMap)) {
          RWISMap[id] = {
            id: id,
            type: 'RWIS', // Explicitly set type
            lat: base.Coordinates.latitude,
            lng: base.Coordinates.longitude,
            angles: {},
            mostRecentTimestamp: 0,
          };
        }
        
        // Process angle data
        const angle = removeLettersAfterUnderscore(point.id).split('-')[2];
        const timestamp = base.Date?.seconds;
        const classification = classByNumber(base['Predicted Class']);
        
        if (timestamp && angle) {
          const angleDict = {
            angle: angle,
            timestamp: timestamp,
            url: base.Image,
            class: { // Store class probabilities
              Undefined: base['Class 4'],
              Bare: base['Class 1'],
              Partly: base['Class 2'],
              Full: base['Class 3'],
            },
            classification: classification,
            gradcam: base.GradCam
          };
          
          // Update if this angle is newer or doesn't exist
          if (!RWISMap[id].angles[angle] || RWISMap[id].angles[angle].timestamp < timestamp) {
            RWISMap[id].angles[angle] = angleDict;
            // Update station's most recent timestamp if this angle is the newest overall
            if (timestamp > RWISMap[id].mostRecentTimestamp) {
              RWISMap[id].mostRecentTimestamp = timestamp;
            }
          }
        }
      } else {
        console.warn("Skipping invalid RWIS point:", point);
      }
    });
  }
  
  // Convert RWISMap to GeoJSON features
  for (const id in RWISMap) {
    const station = RWISMap[id];
    let mostRecentAngleData = null;
    
    // Find the data for the most recent angle overall for this station
    for (const angleKey in station.angles) {
      const angleData = station.angles[angleKey];
      if (angleData.timestamp === station.mostRecentTimestamp) {
        mostRecentAngleData = angleData;
        break; // Found the most recent
      }
    }

    // If we found the most recent angle data, create the feature
    if (mostRecentAngleData) {
        features.push({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [station.lng, station.lat]
            },
            properties: {
                id: station.id,
                type: station.type,
                specificID: station.id, // RWIS ID is the specific ID
                timestamp: station.mostRecentTimestamp,
                classification: mostRecentAngleData.classification,
                recentAngle: mostRecentAngleData.angle,
                image: mostRecentAngleData.url, // Image URL of the most recent angle
                angles: station.angles // Include all angle data
            }
        });
    } else {
        console.warn(`Could not determine most recent angle for RWIS station ${id}`);
    }
  }

  console.log("GeoJSON Conversion Complete. Features created:", features.length);
  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Removes anything after an underscore in a string
 * @param {string} str - The input string
 * @returns {string} String with content after underscore removed
 */
export function removeLettersAfterUnderscore(str) {
  return str.replace(/_.*/, '');
}

/**
 * Translates numeric road condition classifications to string values
 * @param {number} classNumber - The classification number
 * @returns {string} The classification string
 */
export function classByNumber(classNumber) {
  switch (classNumber) {
    case 1:
      return 'Bare';
    case 2:
      return 'Partly';
    case 3:
      return 'Full';
    case 4:
      return 'Undefined';
    default:
      return undefined;
  }
}

/**
 * Determines the highest classification value and returns its string representation
 * @param {number} unde - Value for 'Undefined' classification
 * @param {number} bare - Value for 'Bare' classification
 * @param {number} full - Value for 'Full' classification
 * @param {number} part - Value for 'Partly' classification
 * @returns {string} The classification with the highest value
 */
export function highestNumberString(unde, bare, full, part) {
  const highest = Math.max(unde, bare, full, part);
  
  if (highest === unde) {
    return 'Undefined';
  } else if (highest === bare) {
    return 'Bare';
  } else if (highest === full) {
    return 'Full';
  } else if (highest === part) {
    return 'Partly';
  }
  
  return 'Undefined'; // Default fallback
} 