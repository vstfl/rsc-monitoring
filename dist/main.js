/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/mapbox-gl/dist/mapbox-gl.js":
/*!**************************************************!*\
  !*** ./node_modules/mapbox-gl/dist/mapbox-gl.js ***!
  \**************************************************/
/***/ (function(module) {


/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _mapInitializer_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./mapInitializer.js */ \"./src/mapInitializer.js\");\n/* harmony import */ var _mapInitializer_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_mapInitializer_js__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _mapInteractions_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./mapInteractions.js */ \"./src/mapInteractions.js\");\n/* harmony import */ var _webInteractions_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./webInteractions.js */ \"./src/webInteractions.js\");\n/* harmony import */ var _webInteractions_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_webInteractions_js__WEBPACK_IMPORTED_MODULE_2__);\n\r\n\r\n\n\n//# sourceURL=webpack://mapbox-rsi/./src/index.js?");

/***/ }),

/***/ "./src/mapInitializer.js":
/*!*******************************!*\
  !*** ./src/mapInitializer.js ***!
  \*******************************/
/***/ (() => {

eval("\r\n// mapboxgl.accessToken = 'pk.eyJ1IjoidXJiaXp0b24iLCJhIjoiY2xsZTZvaXd0MGc4MjNzbmdseWNjM213eiJ9.z1YeFXYSbaMe93SMT6muVg';\r\n//             const map = new mapboxgl.Map({\r\n//                 container: 'map', \r\n//                 style: 'mapbox://styles/urbizton/clve9aeu900c501rd7qcn14q6', // Default Dark\r\n\r\n//                 center: [-93.53, 41.99],\r\n//                 zoom: 6.4,\r\n//                 maxZoom: 14,\r\n//             });\r\n//             map.addControl(new mapboxgl.NavigationControl({visualizePitch: true}),'bottom-right');\r\n//             map.addControl(new mapboxgl.ScaleControl({maxWidth: 300, unit: 'imperial'})); // see if i can modify positioning later\r\n\n\n//# sourceURL=webpack://mapbox-rsi/./src/mapInitializer.js?");

/***/ }),

/***/ "./src/mapInteractions.js":
/*!********************************!*\
  !*** ./src/mapInteractions.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var mapbox_gl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! mapbox-gl */ \"./node_modules/mapbox-gl/dist/mapbox-gl.js\");\n/* harmony import */ var mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(mapbox_gl__WEBPACK_IMPORTED_MODULE_0__);\n\r\n\r\n(mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default().accessToken) = 'pk.eyJ1IjoidXJiaXp0b24iLCJhIjoiY2xsZTZvaXd0MGc4MjNzbmdseWNjM213eiJ9.z1YeFXYSbaMe93SMT6muVg';\r\n            const map = new (mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default().Map)({\r\n                container: 'map', \r\n                style: 'mapbox://styles/urbizton/clve9aeu900c501rd7qcn14q6', // Default Dark\r\n\r\n                center: [-93.53, 41.99],\r\n                zoom: 6.4,\r\n                maxZoom: 14,\r\n            });\r\n            map.addControl(new (mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default().NavigationControl)({visualizePitch: true}),'bottom-right');\r\n            map.addControl(new (mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default().ScaleControl)({maxWidth: 300, unit: 'imperial'})); // see if i can modify positioning later\r\n\r\nfunction panToIowa() {\r\n    map.flyTo({\r\n        center: [-93.53, 41.99],\r\n        zoom: 6,\r\n        pitch: 0,\r\n        bearing: 0\r\n    })\r\n}\r\n\r\nmap.on('style.load', () => {\r\n    map.addSource('air-facilities', {\r\n        type: 'geojson',\r\n        data: './assets/Air_Facilities.geojson',\r\n        generateId: true // Ensure that each feature has a unique ID at the PROPERTY level\r\n    });\r\n\r\n    map.addLayer({\r\n        'id': 'airfacilities-layer',\r\n        'type': 'circle',\r\n        'source': 'air-facilities',\r\n        'paint': {\r\n            'circle-color': [\r\n                'case',\r\n                ['boolean', ['feature-state', 'hover'], false],\r\n                '#FF0000', // Red color when hover state is true\r\n                '#FFFFFF' // White color when hover state is false\r\n            ],\r\n            'circle-radius': [\r\n                'case',\r\n                ['boolean', ['feature-state', 'hover'], false],\r\n                7,\r\n                3\r\n            ],\r\n            'circle-stroke-width': 1,\r\n            'circle-stroke-color': 'white'\r\n        }\r\n    });\r\n});\r\n\r\n// Handle map style change\r\ndocument.addEventListener(\"DOMContentLoaded\", function() {\r\n    const radios = document.querySelectorAll('.map-styles input[type=\"radio\"]');\r\n    \r\n    radios.forEach(radio => {\r\n      radio.addEventListener(\"click\", function() {\r\n        if (this.checked) {\r\n          const mapStyle = this.value;\r\n          setMapStyle(mapStyle);\r\n        }\r\n      });\r\n    });\r\n  \r\n    function setMapStyle(style) {\r\n        map.setStyle('mapbox://styles/urbizton/' + style);\r\n      console.log(\"Map style set to:\", style);\r\n    }\r\n});\r\n\r\nconst idDisplay = document.getElementById('airid');\r\nconst labelDisplay = document.getElementById('maplabel');\r\n\r\nlet pointID = null;\r\nlet uniqueID = null;\r\nlet clickedPoint = false;\r\nlet clickedPointValues = [];\r\n\r\n// General point interactivity\r\n// Need to refactor to use mousemove instead (buggy with clusters of points)\r\nmap.on('mouseenter', 'airfacilities-layer', (event) => {\r\n    map.getCanvas().style.cursor = 'pointer'\r\n    const features = map.queryRenderedFeatures(event.point, { layers: ['airfacilities-layer']});\r\n    // console.log('Features:', features); // For debugging\r\n\r\n    if (uniqueID !==null) {\r\n        map.setFeatureState(\r\n            { source: 'air-facilities', id: uniqueID},\r\n            { hover: false }\r\n        );\r\n    }\r\n    pointID = event.features[0].properties.OBJECTID;\r\n    uniqueID = event.features[0]['id'];\r\n\r\n    map.setFeatureState(\r\n        { source: 'air-facilities', id: uniqueID },\r\n        { hover: true }\r\n    );\r\n    idDisplay.textContent = pointID;\r\n    labelDisplay.textContent = event.features[0].properties.MAPLABELNA;\r\n    \r\n})\r\n\r\nmap.on('mouseleave', 'airfacilities-layer', () => {\r\n    map.getCanvas().style.cursor ='default'\r\n\r\n    console.log(` ${clickedPointValues} hovered: ${uniqueID}`);\r\n    if (uniqueID !== null) {\r\n        map.setFeatureState(\r\n            { source: 'air-facilities', id: uniqueID },\r\n            { hover: false }\r\n        );\r\n    }\r\n\r\n    console.log(clickedPoint);\r\n    if (!clickedPoint) {\r\n        idDisplay.textContent = '';\r\n        labelDisplay.textContent = '';\r\n    } else if (clickedPoint) {\r\n        idDisplay.textContent = clickedPointValues[1];\r\n        labelDisplay.textContent = clickedPointValues[2];\r\n        map.setFeatureState(\r\n            { source: 'air-facilities', id: clickedPointValues[0] },\r\n            { hover: true }\r\n        );\r\n    }\r\n})\r\n\r\nmap.on('click', 'airfacilities-layer', (event) => {\r\n    const features = map.queryRenderedFeatures(event.point, { layers: ['airfacilities-layer']});\r\n    let coordinate = features[0].geometry.coordinates\r\n\r\n    if (clickedPoint) {\r\n        map.setFeatureState(\r\n            { source: 'air-facilities', id: clickedPointValues[0] },\r\n            { hover: false }\r\n        )\r\n    }\r\n\r\n    map.flyTo({\r\n        center: coordinate,\r\n        pitch: 0,\r\n        bearing: 0\r\n    })\r\n    clickedPoint = true;\r\n    clickedPointValues = [\r\n        event.features[0]['id'], \r\n        event.features[0].properties.OBJECTID, \r\n        event.features[0].properties.MAPLABELNA\r\n    ];\r\n    idDisplay.textContent = clickedPointValues[1];\r\n    labelDisplay.textContent = clickedPointValues[2];\r\n})\r\n\r\n// Remove this function if not working properly\r\nmap.on('mousemove', 'airfacilities-layer', (event) => {\r\n    map.getCanvas().style.cursor = 'pointer';\r\n\r\n    const features = map.queryRenderedFeatures(event.point, { layers: ['airfacilities-layer'] });\r\n\r\n    // Check if any features are hovered\r\n    if (features.length > 0) {\r\n        const hoveredFeature = features[0];\r\n        const hoveredFeatureId = hoveredFeature.id;\r\n\r\n        // If the hovered feature is different from the currently hovered feature\r\n        if (hoveredFeatureId !== uniqueID) {\r\n            // Clear feature state for the previously hovered feature\r\n            if (uniqueID !== null) {\r\n                map.setFeatureState(\r\n                    { source: 'air-facilities', id: uniqueID },\r\n                    { hover: false }\r\n                );\r\n            }\r\n\r\n            // Update feature state for the newly hovered feature\r\n            map.setFeatureState(\r\n                { source: 'air-facilities', id: hoveredFeatureId },\r\n                { hover: true }\r\n            );\r\n\r\n            // Update uniqueID to the newly hovered feature's id\r\n            uniqueID = hoveredFeatureId;\r\n\r\n            // Update UI with the hovered feature's information\r\n            idDisplay.textContent = hoveredFeature.properties.OBJECTID;\r\n            labelDisplay.textContent = hoveredFeature.properties.MAPLABELNA;\r\n        }\r\n    } else {\r\n        // If no features are hovered, reset cursor, clear UI, and clear feature state\r\n        map.getCanvas().style.cursor = 'default';\r\n        idDisplay.textContent = '';\r\n        labelDisplay.textContent = '';\r\n\r\n        if (uniqueID !== null) {\r\n            map.setFeatureState(\r\n                { source: 'air-facilities', id: uniqueID },\r\n                { hover: false }\r\n            );\r\n            uniqueID = null;\r\n        }\r\n    }\r\n});\r\n\r\n\r\n\n\n//# sourceURL=webpack://mapbox-rsi/./src/mapInteractions.js?");

/***/ }),

/***/ "./src/webInteractions.js":
/*!********************************!*\
  !*** ./src/webInteractions.js ***!
  \********************************/
/***/ (() => {

eval("// Handle realtime toggle\r\nconst consoleContainer = document.getElementById('inner-console');\r\nconst consoleBreak = document.getElementById('console-break');\r\nconst realtimeToggle = document.querySelector(\"#realtime-toggle\");\r\nconst archivedQuery = document.querySelectorAll(\".archived-query\");\r\nlet realtimeState = false;\r\n\r\nrealtimeToggle.addEventListener('change', e => {\r\n    if (e.target.checked) {\r\n        realtimeState = true;\r\n        archivedQuery.forEach(query => {\r\n            query.style.display = 'none';\r\n        });\r\n    } else {\r\n        realtimeState = false;\r\n        archivedQuery.forEach(query => {\r\n            query.style.display = \"block\";\r\n        });\r\n    }\r\n    console.log(`Realtime: ${realtimeState}`);\r\n});\r\n\r\n// Handle console shift toggle button\r\ndocument.getElementById('shift-button').addEventListener('click', function() {\r\n    document.getElementById('console').classList.toggle('shifted');\r\n    document.getElementById('shift-button').classList.toggle('shifted');\r\n    var arrowImg = document.getElementById('arrow-img');\r\n    arrowImg.classList.toggle('flipped');\r\n}); \r\n\r\n\r\n// Handle range slider value change visual\r\nconst slider = document.getElementById('time-range');\r\nconst sliderValue = document.getElementById('slider-value')\r\nlet currentRange = 0;\r\nslider.addEventListener('input', function() {\r\n    sliderValue.textContent = this.value;\r\n    currentRange = this.value;\r\n    console.log(currentRange);\r\n})\r\n\r\n//Example query\r\n// firebase.database().ref('your/path').orderByChild('value').equalTo(currentValue).once('value').then(function(snapshot) {\r\n// })\r\n\r\n// Handle form submission for querying\r\ndocument.getElementById('query-form').addEventListener('submit', function(event) {\r\n    event.preventDefault(); // Prevent form submission\r\n    \r\n    if (!realtimeState) {\r\n        const formData = new FormData(this);\r\n        const date = formData.get('calendar');\r\n        const window = formData.get('window');\r\n        \r\n        // Store form data in variables or pass it to a function for Firebase query\r\n        // Example:\r\n        // firebaseQuery(date, window);\r\n        \r\n        console.log('Date:', date);\r\n        console.log('Window:', window);\r\n    }\r\n});\r\n\r\n// Logic to update website every minute if in realtime mode\r\nfunction updateRealtimeData() {\r\n    if (realtimeState){\r\n        let d = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});\r\n        console.log('Window:', currentRange);\r\n        console.log(`Latest map update: ${d}`)\r\n    } else {\r\n        console.log('Not in realtime state, not updating map');\r\n    }\r\n}\r\nsetInterval(updateRealtimeData, 60000);\r\n\n\n//# sourceURL=webpack://mapbox-rsi/./src/webInteractions.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ })()
;