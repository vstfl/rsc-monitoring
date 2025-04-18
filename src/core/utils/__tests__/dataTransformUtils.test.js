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
      // Test data
      const pointListAVL = [
        {
          id: 'AVL-123',
          type: 'AVL',
          location: {
            latitude: 41.5,
            longitude: -93.6
          },
          classification: 'Bare',
          image: 'https://example.com/avl.jpg',
          timestamp: '2023-01-01T12:00:00Z'
        }
      ];
      
      const pointListRWIS = [
        {
          id: 'RWIS-456',
          type: 'RWIS',
          location: {
            latitude: 41.6,
            longitude: -93.7
          },
          classification: 'Full',
          image: 'https://example.com/rwis.jpg',
          timestamp: '2023-01-01T12:30:00Z'
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
      const avlFeature = result.features.find(f => f.properties.id === 'AVL-123');
      expect(avlFeature).toBeDefined();
      expect(avlFeature.geometry.type).toBe('Point');
      expect(avlFeature.geometry.coordinates).toEqual([-93.6, 41.5]);
      expect(avlFeature.properties.classification).toBe('Bare');
      
      // Check the RWIS feature
      const rwisFeature = result.features.find(f => f.properties.id === 'RWIS-456');
      expect(rwisFeature).toBeDefined();
      expect(rwisFeature.geometry.type).toBe('Point');
      expect(rwisFeature.geometry.coordinates).toEqual([-93.7, 41.6]);
      expect(rwisFeature.properties.classification).toBe('Full');
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