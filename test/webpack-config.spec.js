'use strict';

const tp = require('./helpers/test-phases');
const fx = require('./helpers/fixtures');
const expect = require('chai').expect;

describe('Webpack basic configs', () => {
  let res, test;

  beforeEach(() => {
    test = tp.create()
      .setup({
        'src/config.js': '',
        'src/client.js': `const aClientFunction = require('./dep');`,
        'src/dep.js': 'module.exports = function(a){ return 1; }',
        'package.json': fx.packageJson(),
        'pom.xml': fx.pom()
      });
  });

  afterEach(() => test.teardown());

  describe('Common configurations', () => {
    describe('Basic flow', () => {
      beforeEach(() => {
        res = test.execute('build');
      });

      it('should exit with exit code 0 on success', () =>
        expect(res.code).to.equal(0)
      );

      it('should have a context ./src and output to ./dist', () =>
        // client.js
        expect(test.content('dist/statics/app.bundle.js')).to.contain('const aClientFunction')
      );

      it('should resolve modules relatively to current context', () =>
        // in webpack config: resolve.root to be the same as context
        // in project itself: require('dep')

        // dep.js
        expect(test.content('dist/statics/app.bundle.js')).to.contain('function (a) {\n\t  return 1;\n\t}')
      );

      // it('should display webpack stats with colors', () => {
      //   expect(require('chalk').stripColor(res.stdout)).not.equal(res.stdout);
      // });

      it('should generate source maps', () => {
        expect(test.content('dist/statics/app.bundle.js')).to.contain('//# sourceMappingURL=app.bundle.js.map');
        expect(test.list('dist/statics/')).to.contain('app.bundle.js.map');
      });
    });

    describe('Custom configurations per project', () => {
      it('should ignore externals from being bundled when externals config emerges', () => {
        res = test
          .setup({
            'src/client.js': `const aClientFunction = require('react');`,
            'package.json': fx.packageJson({
              externals: {
                react: 'React'
              }
            })
          })
          .execute('build');

        expect(test.content('dist/statics/app.bundle.js')).to.contain('module.exports = React;');
      });
    });
  });

  describe('Client configurations', () => {
    it('should have a default entry point ./client.js and output client.js', () => {
      test.setup({
        'src/client.js': 'const some = 1'
      })
      .execute('build');

      expect(test.content('dist/statics/app.bundle.js')).to.contain('const some');
    });

    it('should prepend dynamic public path (AKA __webpack_public_path__)', () => {
      test.setup({
        'src/image.jpg': '(^_^)'.repeat(2500),
        'src/client.js': `const img = require('./image.jpg');`
      })
      .execute('build');

      const content = test.content('dist/statics/app.bundle.js');
      const value = `typeof window !== 'undefined' && window.__STATICS_BASE_URL__ || __webpack_require__.p;`;

      // Make sure it was the last override of __webpack_require__.p
      expect(content.split('__webpack_require__.p = ').pop().indexOf(value)).to.equal(0);
      expect(content).to.contain('module.exports = __webpack_require__.p + "image.jpg?');
    });
  });
});
