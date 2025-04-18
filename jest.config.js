module.exports = {
  testEnvironment: "jsdom",
  roots: [
    "<rootDir>/src",
  ],
  moduleNameMapper: {
    '^@mapbox/mapbox-gl-draw$': '<rootDir>/__mocks__/@mapbox/mapbox-gl-draw.js',
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    "/node_modules/"
  ],
  verbose: true,
};
