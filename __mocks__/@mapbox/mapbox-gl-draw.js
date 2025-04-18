// __mocks__/@mapbox/mapbox-gl-draw.js

// Basic mock for MapboxDraw
module.exports = class MockMapboxDraw {
  constructor(options) {
    // console.log('Mock MapboxDraw initialized with options:', options);
  }
  // Mock methods that might be called by the code under test
  onAdd(map) {
    // console.log('Mock MapboxDraw added to map');
    // Return a mock DOM element if necessary
    const div = document.createElement('div');
    return div;
  }
  onRemove(map) {
    // console.log('Mock MapboxDraw removed from map');
  }
  add(feature) {
    // console.log('Mock MapboxDraw add called', feature);
    return ['mock-feature-id'];
  }
  getAll() {
    // console.log('Mock MapboxDraw getAll called');
    return { features: [] };
  }
  deleteAll() {
    // console.log('Mock MapboxDraw deleteAll called');
    return this;
  }
  // Add other methods as needed based on test errors or usage
  set(data) {
    // console.log('Mock MapboxDraw set called', data);
    return ['mock-feature-id'];
  }
  getMode() {
    return 'simple_select';
  }
  changeMode(mode, options) {
    // console.log('Mock MapboxDraw changeMode called', mode, options);
  }
}; 