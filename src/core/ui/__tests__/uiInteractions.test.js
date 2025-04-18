/**
 * Tests for UI interaction functions
 */

import { jest } from '@jest/globals';

// Mock mapbox-gl
jest.mock('mapbox-gl', () => ({}));

// Mock mapInteractions
jest.mock('../../../mapInteractions', () => ({
  updateMapData: jest.fn()
}));

// Mock dependencies
jest.mock('../../stateManager');
jest.mock('../../logger');
jest.mock('../../utils/dateTimeUtils');
jest.mock('../../../charts.js');

import { 
  toggleConsole, 
  toggleArrow,
  scrollToBottom,
  setupEventListeners,
  toggleStudyArea,
  toggleRealtime,
  toggleImageSrc
} from '../uiInteractions';
import { getState, setState, subscribe } from '../../stateManager';
import { updateMapData } from '../../../mapInteractions';
import Logger from '../../logger';
import {
  updatePointInfoPanel,
  updateHoverInfo
} from '../uiInteractions';

describe('UI Interactions', () => {
  // Mock DOM elements and JavaScript methods
  let mockConsole, mockShiftButton, mockArrowImg, mockConsoleDiv;
  let mockStudyAreaToggle, mockRealtimeToggle, mockImageElement;
  let mockMap;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock map object
    mockMap = {
      easeTo: jest.fn()
    };

    // Create mock DOM elements
    mockConsole = { classList: { toggle: jest.fn() }, clientWidth: 300 };
    mockShiftButton = { classList: { toggle: jest.fn() }, addEventListener: jest.fn() };
    mockArrowImg = { classList: { toggle: jest.fn().mockReturnValue(true) } };
    mockConsoleDiv = { scrollTop: 0, scrollHeight: 1000 };
    mockStudyAreaToggle = { checked: false, addEventListener: jest.fn() };
    mockRealtimeToggle = { checked: false, addEventListener: jest.fn() };
    mockImageElement = { src: 'original-image.jpg', style: {}, addEventListener: jest.fn() };
    
    // Mock document methods
    document.getElementById = jest.fn(id => {
      if (id === 'console') return mockConsole;
      if (id === 'shift-button') return mockShiftButton;
      if (id === 'arrow-img') return mockArrowImg;
      if (id === 'pointImage') return mockImageElement;
      if (id === 'console-inner') return mockConsoleDiv;
      if (id === 'pointClassification') return { textContent: '' };
      if (id === 'pointTimestamp') return { textContent: '' };
      if (id === 'pointId') return { textContent: '' };
      if (id === 'hoverInfo') return { style: { display: 'none' }, innerHTML: '' };
      return null;
    });
    
    document.querySelector = jest.fn(selector => {
      if (selector === '#studyarea-toggle') return mockStudyAreaToggle;
      if (selector === '#realtime-toggle') return mockRealtimeToggle;
      if (selector === '#console-inner') return mockConsoleDiv;
      return null;
    });
    
    document.querySelectorAll = jest.fn().mockReturnValue([
      { style: {} },
      { style: {} }
    ]);
    
    document.addEventListener = jest.fn();
    
    // Setup state manager mock implementations
    getState.mockImplementation(key => {
      if (key === 'map') return mockMap;
      if (key === 'currentGeoJSON') return { type: 'FeatureCollection', features: [] };
      if (key === 'clickedPointValues') return { 
        image: 'test-image.jpg',
        type: 'RWIS',
        CAM: false,
        classification: 'Some Classification',
        timestamp: '2023-01-01T12:00:00Z',
        id: 'RWIS-123'
      };
      if (key === 'hoveredPointValues') return null;
      return null;
    });

    setState.mockImplementation((key, value) => {
      // Optionally track state changes if needed for assertions
      // console.log(`Mock setState called: ${key}=${JSON.stringify(value)}`);
    });

    subscribe.mockImplementation((key, callback) => {
       // Optionally track subscriptions
       // console.log(`Mock subscribe called for: ${key}`);
       return jest.fn(); // Return unsubscribe function
    });
  });
  
  describe('toggleConsole', () => {
    test('should toggle console class and adjust map padding', () => {
      toggleConsole();
      
      // Check that the console element's class was toggled
      expect(mockConsole.classList.toggle).toHaveBeenCalledWith('shifted');
      
      // Check that the shift button's class was toggled
      expect(mockShiftButton.classList.toggle).toHaveBeenCalledWith('shifted');
      
      // Check that the map padding was adjusted (easeTo was called with padding)
      expect(mockMap.easeTo).toHaveBeenCalledWith({
        padding: { right: 0 },
        duration: 1000
      });
    });
    
    test('should handle map not being available', () => {
      // Mock getState to return null for map
      getState.mockReturnValueOnce(null);
      
      // Should not throw an error
      expect(() => toggleConsole()).not.toThrow();
      
      // The DOM elements should still be toggled
      expect(mockConsole.classList.toggle).toHaveBeenCalledWith('shifted');
    });
    
    test('should handle missing DOM elements', () => {
      // Mock getElementById to return null for console
      document.getElementById.mockReturnValue(null);
      
      // Should not throw
      expect(() => toggleConsole()).not.toThrow();
      
      // easeTo should not be called
      expect(mockMap.easeTo).not.toHaveBeenCalled();
    });
  });
  
  describe('toggleArrow', () => {
    test('should toggle arrow class', () => {
      toggleArrow();
      
      expect(mockArrowImg.classList.toggle).toHaveBeenCalledWith('flipped');
    });
    
    test('should return the toggle result', () => {
      const result = toggleArrow();
      
      expect(result).toBe(true);
    });
    
    test('should handle missing arrow element', () => {
      document.getElementById.mockReturnValue(null);
      
      const result = toggleArrow();
      
      expect(result).toBe(false);
    });
  });
  
  describe('scrollToBottom', () => {
    test('should attempt to scroll console div to bottom', () => {
      scrollToBottom();
      
      // Verify it tried to find the element using the correct selector
      expect(document.querySelector).toHaveBeenCalledWith('.console.resizable');
    });
    
    test('should handle console div not being found', () => {
      document.querySelector.mockReturnValue(null);
      
      // Should not throw
      expect(() => scrollToBottom()).not.toThrow();
    });
  });
  
  describe('toggleStudyArea', () => {
    test('should update state and refresh map with study area state', () => {
      const mockEvent = {
        target: { checked: true }
      };
      
      toggleStudyArea(mockEvent);
      
      // Verify state was updated
      expect(setState).toHaveBeenCalledWith('studyAreaState', true);
      
      // Verify map was updated
      expect(updateMapData).toHaveBeenCalled();
    });
    
    test('should handle null event', () => {
      // Should not throw an error with null event
      expect(() => toggleStudyArea(null)).not.toThrow();
      
      // setState should not be called
      expect(setState).not.toHaveBeenCalled();
    });
    
    test('should handle missing currentGeoJSON', () => {
      // Mock getState to return null for currentGeoJSON
      getState.mockImplementation(key => {
        if (key === 'currentGeoJSON') return null;
        if (key === 'map') return mockMap;
        return null;
      });
      
      const mockEvent = {
        target: { checked: true }
      };
      
      toggleStudyArea(mockEvent);
      
      // State should still be updated
      expect(setState).toHaveBeenCalledWith('studyAreaState', true);
      
      // Map should not be updated
      expect(updateMapData).not.toHaveBeenCalled();
    });
  });
  
  describe('toggleRealtime', () => {
    test('should update UI and state based on realtime toggle', () => {
      const mockEvent = {
        target: { checked: true }
      };
      
      toggleRealtime(mockEvent);
      
      // Verify display was updated for archived query elements
      const mockQueryElements = document.querySelectorAll();
      expect(document.querySelectorAll).toHaveBeenCalledWith('.archived-query');
      
      // Verify state was updated
      expect(setState).toHaveBeenCalledWith('realtimeState', true);
    });
    
    test('should handle null event', () => {
      // Should not throw an error with null event
      expect(() => toggleRealtime(null)).not.toThrow();
      
      // setState should not be called
      expect(setState).not.toHaveBeenCalled();
    });
    
    test('should handle missing query elements', () => {
      // Mock querySelectorAll to return null
      document.querySelectorAll.mockReturnValue(null);
      
      const mockEvent = {
        target: { checked: true }
      };
      
      // Should not throw
      expect(() => toggleRealtime(mockEvent)).not.toThrow();
      
      // State should still be updated
      expect(setState).toHaveBeenCalledWith('realtimeState', true);
    });
  });
  
  describe('toggleImageSrc', () => {
    test('should toggle to gradcam image for RWIS points', () => {
      // Setup specific mock return values for this test
      getState.mockReturnValueOnce({
        image: 'https://example.com/IDOT-048-04_201901121508.jpg',
        type: 'RWIS',
        CAM: false
      });
      
      toggleImageSrc();
      
      // Check image was updated
      expect(mockImageElement.src).toBe('https://storage.googleapis.com/rwis_cam_images/images/IDOT-048-04_201901121508.jpg_gradcam.png');
      
      // Check state was updated
      expect(setState).toHaveBeenCalledWith('clickedPointValues', {
        image: 'https://example.com/IDOT-048-04_201901121508.jpg',
        type: 'RWIS',
        CAM: true
      });
    });
    
    test('should toggle back to original image when CAM is true', () => {
      // Setup specific mock return values for this test
      getState.mockReturnValueOnce({
        image: 'https://example.com/IDOT-048-04_201901121508.jpg',
        type: 'RWIS',
        CAM: true
      });
      
      toggleImageSrc();
      
      // Check image was updated back to original
      expect(mockImageElement.src).toBe('https://example.com/IDOT-048-04_201901121508.jpg');
      
      // Check state was updated
      expect(setState).toHaveBeenCalledWith('clickedPointValues', {
        image: 'https://example.com/IDOT-048-04_201901121508.jpg',
        type: 'RWIS',
        CAM: false
      });
    });
  });
  
  describe('setupEventListeners', () => {
    test('should set up event listeners for existing elements', () => {
      setupEventListeners();
      
      // Verify event listeners were attached
      expect(mockStudyAreaToggle.addEventListener).toHaveBeenCalled();
      expect(mockRealtimeToggle.addEventListener).toHaveBeenCalled();
      expect(mockShiftButton.addEventListener).toHaveBeenCalled();
    });
    
    test('should handle missing elements', () => {
      document.querySelector.mockReturnValue(null);
      document.getElementById.mockReturnValue(null);
      
      // Should not throw
      expect(() => setupEventListeners()).not.toThrow();
    });
  });
}); 