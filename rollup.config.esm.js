import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {readFile} from 'node:fs/promises';

import {plugins} from './build/rollup_plugins.js';
import banner from './build/banner.js';

const {BUILD, MINIFY} = process.env;
const minified = false;
const bench = false;
const production = false;

function buildType(build, minified) {
    switch (build) {
    case 'production':
        if (minified) return 'dist/mapbox-gl.js';
        return 'dist/mapbox-gl-unminified.js';
    case 'bench':
        return 'dist/mapbox-gl-bench.js';
    case 'dev':
        return 'dist/mapbox-gl-dev.js';
    default:
        return 'dist/mapbox-gl-dev.js';
    }
}

const outputFile = buildType(BUILD, MINIFY);

export default ({watch}) => {
    return [{
        // First, use code splitting to bundle GL JS into three "chunks":
        // - rollup/build/index.js: the main module, plus all its dependencies not shared by the worker module
        // - rollup/build/worker.js: the worker module, plus all dependencies not shared by the main module
        // - rollup/build/shared.js: the set of modules that are dependencies of both the main module and the worker module
        //
        // This is also where we do all of our source transformations:
        // transpiling ES6 features, inlining shader sources as strings, etc.
        input: ['src/index.ts', 'src/source/worker.ts'],
        output: {
            dir: 'rollup/build/mapboxgl',
            format: 'amd',
            sourcemap: false,
            indent: false,
            chunkFileNames: 'shared.js',
            minifyInternalExports: production
        },
        onwarn: production ? onwarn : false,
        treeshake: production ? {
            moduleSideEffects: (id, external) => {
                return !id.endsWith("tracked_parameters.ts");
            },
            preset: "recommended"
        } : false,
        plugins: plugins({minified, production, bench, test: false, keepClassNames: false, mode: BUILD})
    }, {
        // Next, bundle together the three "chunks" produced in the previous pass
        // into a single, final bundle. See rollup/bundle_prelude.js and
        // rollup/mapboxgl.js for details.
        input: 'rollup/mapboxgl.js',
        output: {
            name: 'mapboxgl',
            file: 'dist/mapbox-gl-esm.js',
            format: 'esm',
            sourcemap: false,
            indent: false,
            intro: fs.readFileSync(fileURLToPath(new URL('./rollup/bundle_prelude.js', import.meta.url)), 'utf8'),
            banner
        },
        treeshake: false,
        plugins: [
        ]
    }];
};


function onwarn(warning) {
    const styleSpecPath = path.resolve('src', 'style-spec');
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
        // Ignore circular dependencies in style-spec and throw on all others
        if (!warning.ids[0].startsWith(styleSpecPath)) throw new Error(warning.message);
    } else {
        console.error(`(!) ${warning.message}`);
    }
}
