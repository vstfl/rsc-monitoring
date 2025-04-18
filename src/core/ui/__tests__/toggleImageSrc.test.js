/**
 * Tests for toggleImageSrc functionality
 */

// Mock mapbox-gl to avoid TextDecoder errors
jest.mock('mapbox-gl', () => ({}));

// Mock mapInteractions module
jest.mock('../../../mapInteractions', () => ({}));

import { toggleImageSrc } from '../uiInteractions';
import { getState, setState } from '../../../core/stateManager';

// Mock the stateManager
jest.mock('../../../core/stateManager', () => ({
  getState: jest.fn(),
  setState: jest.fn()
}));

describe('toggleImageSrc', () => {
  let mockImageElement;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock image element
    mockImageElement = { src: 'original-image.jpg' };
    
    // Mock document methods
    document.getElementById = jest.fn(id => {
      if (id === 'pointImage') return mockImageElement;
      return null;
    });
    
    // Mock clickedPointValues state
    getState.mockReturnValue({
      image: 'https://example.com/IDOT-048-04_201901121508.jpg',
      type: 'RWIS',
      CAM: false
    });
  });
  
  test('should toggle from original to gradcam image for RWIS points', () => {
    toggleImageSrc();
    
    // Check that the image source was updated to the gradcam version
    expect(mockImageElement.src).toBe('https://storage.googleapis.com/rwis_cam_images/images/IDOT-048-04_201901121508.jpg_gradcam.png');
    
    // Check that state was updated
    expect(setState).toHaveBeenCalledWith('clickedPointValues', {
      image: 'https://example.com/IDOT-048-04_201901121508.jpg',
      type: 'RWIS',
      CAM: true
    });
  });
  
  test('should toggle from gradcam back to original image', () => {
    // Mock clickedPointValues with CAM=true
    getState.mockReturnValueOnce({
      image: 'https://example.com/IDOT-048-04_201901121508.jpg',
      type: 'RWIS',
      CAM: true
    });
    
    toggleImageSrc();
    
    // Check that the image source was updated back to the original
    expect(mockImageElement.src).toBe('https://example.com/IDOT-048-04_201901121508.jpg');
    
    // Check that state was updated
    expect(setState).toHaveBeenCalledWith('clickedPointValues', {
      image: 'https://example.com/IDOT-048-04_201901121508.jpg',
      type: 'RWIS',
      CAM: false
    });
  });
  
  test('should not toggle for non-RWIS points', () => {
    // Mock clickedPointValues for AVL type
    getState.mockReturnValueOnce({
      image: 'https://example.com/avl-image.jpg',
      type: 'AVL',
      CAM: false
    });
    
    toggleImageSrc();
    
    // Image source should be set to original image
    expect(mockImageElement.src).toBe('https://example.com/avl-image.jpg');
    
    // State should be updated but CAM should still be false
    expect(setState).toHaveBeenCalledWith('clickedPointValues', {
      image: 'https://example.com/avl-image.jpg',
      type: 'AVL',
      CAM: false
    });
  });
  
  test('should handle missing image element', () => {
    // Mock document.getElementById to return null
    document.getElementById.mockReturnValue(null);
    
    // Should not throw
    expect(() => toggleImageSrc()).not.toThrow();
    
    // setState should not be called
    expect(setState).not.toHaveBeenCalled();
  });
  
  test('should handle missing clickedPointValues', () => {
    // Mock getState to return null
    getState.mockReturnValueOnce(null);
    
    // Should not throw
    expect(() => toggleImageSrc()).not.toThrow();
    
    // setState should not be called
    expect(setState).not.toHaveBeenCalled();
  });
}); 