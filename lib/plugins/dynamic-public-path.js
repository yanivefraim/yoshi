'use strict';

module.exports = class DynamicPublicPath {
  constructor() {
    this._script = `__webpack_require__.p = typeof window !== 'undefined' && window.__STATICS_BASE_URL__ || __webpack_require__.p;`;
  }

  apply(compiler) {
    compiler.plugin('compilation', compilation => {
      compilation.mainTemplate.plugin('startup', source => `${this._script}\n${source}`);
    });
  }
};
