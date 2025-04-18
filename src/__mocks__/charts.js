// src/__mocks__/charts.js

// Mock implementation for chart functions used in tests

const mockChartInstance = {
  data: {
    labels: [],
    datasets: [],
  },
  options: {},
  update: jest.fn(),
  destroy: jest.fn(),
};

export const initializeChart = jest.fn(() => mockChartInstance);
export const updateChartData = jest.fn();
export const updateChartOptions = jest.fn();
export const destroyChart = jest.fn();

// Export the mock instance if it's directly accessed
export const pointHistoryChart = mockChartInstance;

// Export the config object if it's accessed
export const config = {
  type: 'line',
  data: {
    labels: [],
    datasets: []
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    // ... other default options needed ...
  }
}; 