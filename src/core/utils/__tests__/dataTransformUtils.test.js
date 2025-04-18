/**
 * Tests for data transformation utilities
 */

import { 
  convertToGeoJSON,
  removeLettersAfterUnderscore,
  classByNumber,
  highestNumberString 
} from '../dataTransformUtils';

describe('Data Transformation Utilities', () => {
  describe('convertToGeoJSON', () => {
    test('should convert point lists to GeoJSON format', () => {
      // Test data - Adjusted to match function expectations
      const pointListAVL = [
        {
          id: 'AVL-123',
          // Wrap original data under a 'data' property
          data: {
            Position: { // Use 'Position' for AVL
              latitude: 41.5,
              longitude: -93.6
            },
            // Mock probability fields expected by highestNumberString
            Undefined: 0.1,
            Bare: 0.8, // Highest probability
            Full: 0.05,
            Partly: 0.05,
            IMAGE_URL: 'https://example.com/avl.jpg', // Use expected property name
            Date: { seconds: Math.floor(new Date('2023-01-01T12:00:00Z').getTime() / 1000) } // Use expected property name
          }
        }
      ];
      
      const pointListRWIS = [
        {
          // RWIS ID structure like IDOT-XXX-YY_ZZZ 
          // where XXX is station, YY is angle, ZZZ is timestamp part
          id: 'IDOT-456-01_timestamp',
          // Wrap original data under a 'data' property
          data: {
            Coordinates: { // Use 'Coordinates' for RWIS
              latitude: 41.6,
              longitude: -93.7
            },
            // Mock classification field expected by classByNumber
            'Predicted Class': 3, // Corresponds to 'Full'
            Image: 'https://example.com/rwis.jpg', // Use expected property name
            Date: { seconds: Math.floor(new Date('2023-01-01T12:30:00Z').getTime() / 1000) }, // Use expected property name
            // Mock probability fields for the angle
            'Class 1': 0.1, // Bare
            'Class 2': 0.1, // Partly
            'Class 3': 0.7, // Full
            'Class 4': 0.1, // Undefined
            GradCam: 'some_gradcam_data' // Add GradCam if expected
          }
        }
      ];
      
      const result = convertToGeoJSON(pointListAVL, pointListRWIS);
      
      // Check the result is valid GeoJSON
      expect(result).toHaveProperty('type', 'FeatureCollection');
      expect(result).toHaveProperty('features');
      expect(Array.isArray(result.features)).toBe(true);
      
      // Check the features were properly converted
      expect(result.features.length).toBe(2);
      
      // Check the AVL feature
      const avlFeature = result.features.find(f => f.properties.specificID === 'AVL-123');
      expect(avlFeature).toBeDefined();
      expect(avlFeature.geometry.type).toBe('Point');
      expect(avlFeature.geometry.coordinates).toEqual([-93.6, 41.5]);
      expect(avlFeature.properties.classification).toBe('Bare');
      expect(avlFeature.properties.image).toBe('https://example.com/avl.jpg');
      expect(avlFeature.properties.timestamp).toBe(Math.floor(new Date('2023-01-01T12:00:00Z').getTime() / 1000));

      // Check the RWIS feature
      const rwisFeature = result.features.find(f => f.properties.specificID === 'IDOT-456');
      expect(rwisFeature).toBeDefined();
      expect(rwisFeature.geometry.type).toBe('Point');
      expect(rwisFeature.geometry.coordinates).toEqual([-93.7, 41.6]);
      expect(rwisFeature.properties.classification).toBe('Full');
      expect(rwisFeature.properties.image).toBe('https://example.com/rwis.jpg');
      expect(rwisFeature.properties.timestamp).toBe(Math.floor(new Date('2023-01-01T12:30:00Z').getTime() / 1000));
      expect(rwisFeature.properties.recentAngle).toBe('01');
      expect(rwisFeature.properties.angles['01']).toBeDefined();
      expect(rwisFeature.properties.angles['01'].classification).toBe('Full');
    });
    
    test('should handle empty input arrays', () => {
      const result = convertToGeoJSON([], []);
      
      expect(result).toHaveProperty('type', 'FeatureCollection');
      expect(result.features).toEqual([]);
    });
    
    test('should handle null input', () => {
      const result = convertToGeoJSON(null, null);
      
      expect(result).toHaveProperty('type', 'FeatureCollection');
      expect(result.features).toEqual([]);
    });
  });
  
  describe('removeLettersAfterUnderscore', () => {
    test('should remove letters after underscore', () => {
      expect(removeLettersAfterUnderscore('test_abc')).toBe('test');
      expect(removeLettersAfterUnderscore('hello_world')).toBe('hello');
    });
    
    test('should return the original string if no underscore is present', () => {
      expect(removeLettersAfterUnderscore('teststring')).toBe('teststring');
    });
    
    test('should handle empty string', () => {
      expect(removeLettersAfterUnderscore('')).toBe('');
    });
  });
  
  describe('classByNumber', () => {
    test('should return correct classification for each number', () => {
      expect(classByNumber(1)).toBe('Bare');
      expect(classByNumber(2)).toBe('Partly');
      expect(classByNumber(3)).toBe('Full');
      expect(classByNumber(4)).toBe('Undefined');
    });
    
    test('should return undefined for invalid numbers', () => {
      expect(classByNumber(0)).toBeUndefined();
      expect(classByNumber(5)).toBeUndefined();
      expect(classByNumber(null)).toBeUndefined();
    });
  });
  
  describe('highestNumberString', () => {
    test('should return classification with the highest value', () => {
      expect(highestNumberString(4, 1, 2, 3)).toBe('Undefined');
      expect(highestNumberString(0, 5, 3, 2)).toBe('Bare');
      expect(highestNumberString(0, 1, 5, 2)).toBe('Full');
      expect(highestNumberString(0, 1, 2, 5)).toBe('Partly');
    });
    
    test('should handle ties by prioritizing in order: Undefined, Bare, Full, Partly', () => {
      expect(highestNumberString(5, 5, 3, 2)).toBe('Undefined');
      expect(highestNumberString(0, 5, 5, 4)).toBe('Bare');
      expect(highestNumberString(0, 3, 5, 5)).toBe('Full');
    });
  });
}); 