'use strict';

module.exports = class DynamicPublicPath {
  constructor() {
    this._script = `__webpack_public_path__ = 'http://www.google.com';`;
  }

  apply(compiler) {
    compiler.plugin('compilation', compilation => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        chunks.forEach(chunk => {
          chunk.files.forEach(name => {
            console.log(compilation.assets[name].source());
          });
        });
        done();
      });

      // compilation.mainTemplate.plugin('startup', (source, mod, hash) => {
      //   return `${this._script}\n${source}`;
      // });
    });
  }
};
