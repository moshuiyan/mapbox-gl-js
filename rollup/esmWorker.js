import shared from './build/mapboxgl/shared.js';
import worker from './build/mapboxgl/worker.js';

const workerBundleString = `
self.onerror = function() { 
    console.error('An error occurred while parsing the WebWorker bundle. This is most likely due to improper transpilation by Babel; please see https://docs.mapbox.com/mapbox-gl-js/guides/install/#transpiling'); 
}; 
var sharedChunk = {}; 
(${shared})(sharedChunk); 
(${worker})(sharedChunk); 
self.onerror = null;
`;

const sharedChunk = {};
shared(sharedChunk);
const mapboxgl = (chunk) => chunk(sharedChunk);

if (typeof window !== 'undefined' && window && window.URL && window.URL.createObjectURL) {
    mapboxgl.workerUrl = window.URL.createObjectURL(new Blob([workerBundleString], { type: 'text/javascript' }));
}

export default mapboxgl;
