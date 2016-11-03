'use strict';

const tp = require('./helpers/test-phases');
const fx = require('./helpers/fixtures');
const expect = require('chai').expect;
const hooks = require('./helpers/hooks');

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
    beforeEach(() => {
      test = test
        .setup({
          'package.json': fx.packageJson()
        });
    });

    afterEach(() => test.teardown());

    it('should have a default entry point ./client.js and output client.js', () => {
      test.setup({
        'src/client.js': 'const some = 1'
      })
      .execute('build');

      expect(test.content('dist/statics/app.bundle.js')).to.contain('const some');
    });

    it('should resolve paths imported from package.json', function () {
      this.timeout(30000);
      test.setup({
        '.babelrc': `{"presets": ["es2015"]}`,
        'src/components/modules/submodule/index.js': 'export const component = 123;',
        'src/client.js': `import {component} from 'submodule'`,
        'package.json': `{
            "name": "a",\n
            "version": "1.0.4",\n
            "dependencies": {\n
              "babel-preset-es2015": "latest"\n
            },
            "wix": {
              "pathAliases": {"submodule": "components/modules/submodule"}
            }
          }`,
        'pom.xml': fx.pom()
      }, [hooks.installDependencies])
      .execute('build');
      expect(test.content('dist/statics/app.bundle.js')).to.contain('123');
    });
  });
});
