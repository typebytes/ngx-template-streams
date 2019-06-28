import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';

const libraryName = 'ngx-template-streams';
const libRoot = `projects/${libraryName}`;
const libSrc = `${libRoot}/src/internal`;
const dist = `dist/${libraryName}/internal`;

const treeshake = {
  moduleSideEffects: false,
  propertyReadSideEffects: false,
  tryCatchDeoptimization: false
};

const DEFAULT_CONFIG = {
  external: [],
  watch: {
    include: `${libSrc}/**`
  },
  treeshake,
  plugins: [
    json(),
    typescript({
      tsconfig: `${libRoot}/tsconfig.internal.json`
    }),
    commonjs(),
    resolve(),
    sourceMaps()
  ]
};

export default [createConfig('index'), createConfig('loader'), createConfig('plugin')];

function createConfig(input, overrides = {}) {
  const umdBundleName = `${input}.umd.js`;

  return {
    ...DEFAULT_CONFIG,
    input: `${libSrc}/${input}.ts`,
    output: [
      { file: `${dist}/${umdBundleName}`, name: umdBundleName, format: 'umd', sourcemap: true },
      { file: `${dist}/${input}.es5.js`, format: 'es', sourcemap: true }
    ],
    ...overrides
  };
}
