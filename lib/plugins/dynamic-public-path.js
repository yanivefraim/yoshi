'use strict';

module.exports = class DynamicPublicPath {
  constructor() {
    this._script = `__webpack_require__.p = window && window.__STATICS_BASE_URL__ || '';`;
  }

  apply(compiler) {
    compiler.plugin('compilation', compilation => {
      compilation.mainTemplate.plugin('startup', source => `${this._script}\n${source}`);
    });
  }
};
