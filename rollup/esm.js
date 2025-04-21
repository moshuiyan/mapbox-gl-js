import './build/mapboxgl/worker.js';

import map1 from './build/mapboxgl/index.js';
import * as apis from './build/mapboxgl/mapboxgl.esm.js'; 
const  obj = {
    ...map1,
    ...apis
}
export default obj;
