/**
 * Tests for toggleImageSrc functionality
 */

// Mock mapbox-gl to avoid TextDecoder errors
jest.mock('mapbox-gl', () => ({}));

// Mock mapInteractions module
jest.mock('../../../mapInteractions', () => ({}));

import { toggleImageSrc } from '../uiInteractions';
import stateManager from '../../stateManager';
import { getState, setState } from '../../stateManager';

// Mock the stateManager
jest.mock('../../../core/stateManager', () => ({
  getState: jest.fn(),
  setState: jest.fn()
}));

// Mock dependencies
jest.mock('../../stateManager');
jest.mock('../../logger');
jest.mock('../../../charts.js');

describe('toggleImageSrc', () => {
  let mockImageElement;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock document methods (needed for potential future tests, but not strictly by toggleImageSrc anymore)
    mockImageElement = { src: 'original-image.jpg', style: {} };
    document.getElementById = jest.fn(id => {
      if (id === 'pointImage') return mockImageElement;
      return null;
    });
    
    // Default mock clickedPointValues state (can be overridden per test)
    getState.mockReturnValue({
      image: 'https://example.com/IDOT-048-04_201901121508.jpg',
      type: 'RWIS',
      CAM: false
    });
  });
  
  test('should call setState to toggle CAM from false to true for RWIS points', () => {
    const initialPointData = {
      image: 'https://example.com/IDOT-048-04_201901121508.jpg',
      type: 'RWIS',
      CAM: false
    };
    getState.mockReturnValueOnce(initialPointData);

    toggleImageSrc();
    
    // Check that state was updated with CAM: true
    expect(setState).toHaveBeenCalledWith('clickedPointValues', {
      ...initialPointData,
      CAM: true
    });
    // Check image src is NOT modified directly (this is now handled by updatePointInfoPanel)
    expect(mockImageElement.src).toBe('original-image.jpg'); 
  });
  
  test('should call setState to toggle CAM from true to false for RWIS points', () => {
    const initialPointData = {
      image: 'https://example.com/IDOT-048-04_201901121508.jpg',
      type: 'RWIS',
      CAM: true
    };
    getState.mockReturnValueOnce(initialPointData);
    
    toggleImageSrc();
        
    // Check that state was updated with CAM: false
    expect(setState).toHaveBeenCalledWith('clickedPointValues', {
      ...initialPointData,
      CAM: false
    });
    // Check image src is NOT modified directly
    expect(mockImageElement.src).toBe('original-image.jpg');
  });
  
  test('should NOT call setState for non-RWIS points', () => {
    const initialPointData = {
      image: 'https://example.com/avl-image.jpg',
      type: 'AVL',
      CAM: false
    };
    getState.mockReturnValueOnce(initialPointData);
    
    toggleImageSrc();
        
    // State should NOT be updated
    expect(setState).not.toHaveBeenCalled();
    // Check image src is NOT modified
    expect(mockImageElement.src).toBe('original-image.jpg');
  });
  
  test('should still call setState even if image element is missing', () => {
    const initialPointData = {
        image: 'https://example.com/IDOT-048-04_201901121508.jpg',
        type: 'RWIS',
        CAM: false
      };
    getState.mockReturnValueOnce(initialPointData);
      
    // Mock document.getElementById to return null
    document.getElementById.mockReturnValue(null);
    
    // Should not throw
    expect(() => toggleImageSrc()).not.toThrow();
    
    // setState SHOULD still be called because the function no longer depends on the element
    expect(setState).toHaveBeenCalledWith('clickedPointValues', {
        ...initialPointData,
        CAM: true
      });
  });
  
  test('should handle missing clickedPointValues gracefully', () => {
    // Mock getState to return null
    getState.mockReturnValueOnce(null);
    
    // Should not throw
    expect(() => toggleImageSrc()).not.toThrow();
    
    // setState should NOT be called
    expect(setState).not.toHaveBeenCalled();
  });
}); 