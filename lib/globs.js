'use strict';

const dist = 'dist';
const src = 'src';
const test = 'test';
const statics = `statics`;
const base = `{app,${src},${test}}`;
const watchBase = '{app,src,test,petri-specs}';

module.exports = {
  base: () => base,
  babel: list => [`${list || base}/**/*.js{,x}`, 'index.js'],
  specs: () => `${base}/**/*.spec.+(js|ts){,x}`,
  e2e: () => `${test}/**/*.e2e.(js|ts)`,
  singleModule: {
    clientDist: () => `${dist}/${statics}`
  },
  multipleModules: {
    clientDist: () => dist
  },
  typescript: list => [`${list || base}/**/*.ts{,x}`, 'typings/index.d.ts'],
  tslint: () => [`${base}/**/*.ts{,x}`],
  eslint: () => ['*.js', `${base}/**/*.js`],
  sass: () => `${base}/**/*.scss`,
  watch: () => ['./*.{j,t}s{x,}', `${watchBase}/**/*.*`]
};
