'use strict';

const tp = require('./helpers/test-phases');
const fx = require('./helpers/fixtures');
const expect = require('chai').expect;
const hooks = require('./helpers/hooks');
const _ = require('lodash');

describe('Loaders', () => {
  let test;

  beforeEach(() => {
    test = tp.create()
      .setup({
        'src/client.js': '',
        'src/config.js': '',
        'package.json': fx.packageJson(),
        'pom.xml': fx.pom()
      });
  });

  describe('Babel', () => {
    afterEach(() => test.teardown());

    it('should transpile according .babelrc file', () => {
      test
        .setup({
          'src/client.js': `let aServerFunction = 1;`,
          '.babelrc': `{"plugins": ["transform-es2015-block-scoping"]}`,
          'package.json': `{\n
            "name": "a",\n
            "dependencies": {\n
              "babel-plugin-transform-es2015-block-scoping": "latest"\n
            }
          }`
        }, [hooks.installDependencies])
        .execute('build');

      expect(test.content('dist/statics/app.bundle.js')).to.contain('var aServerFunction = 1;');
    });

    it('should apply ng-annotate loader on angular project', () => {
      test
        .setup({
          'src/client.js': `angular.module('fakeModule', []).config(function($javascript){});`,
          'package.json': `{\n
            "name": "a",\n
            "dependencies": {\n
              "angular": "^1.5.0"\n
            }
          }`
        })
        .execute('build');

      expect(test.content('dist/statics/app.bundle.js')).to
        .contain(`.config(["$javascript", function ($javascript)`);
    });

    it('should run over specified 3rd party modules', () => {
      const res = test
        .setup({
          'src/client.js': `require('wix-style-react/src')`,
          'node_modules/wix-style-react/src/index.js': 'let a = 1',
          '.babelrc': `{"plugins": ["transform-es2015-block-scoping"]}`,
          'package.json': `{\n
            "name": "a",\n
            "dependencies": {\n
              "babel-plugin-transform-es2015-block-scoping": "latest"\n
            }
          }`
        }, [hooks.installDependencies])
        .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content('dist/statics/app.bundle.js')).to.contain('var a = 1');
    });
  });

  describe('Typescript', () => {

    afterEach(() => test.teardown());

    it('should transpile', () => {
      test
        .setup({
          'src/app.ts': 'let aServerFunction = 1;',
          'tsconfig.json': fx.tsconfig(),
          'package.json': fx.packageJson({
            entry: './app.ts'
          })
        })
        .execute('build');
      expect(test.content('dist/statics/app.bundle.js')).to.contain('var aServerFunction = 1;');
    });

    it('should apply ng-annotate loader on angular project', () => {
      test
        .setup({
          'src/app.ts': `declare var angular: any; angular.module('fakeModule', []).config(function($typescript){});`,
          'tsconfig.json': fx.tsconfig(),
          'package.json': fx.packageJson({
            entry: './app.ts'
          }, {
            angular: '1.5.0'
          })
        })
        .execute('build');

      expect(test.content('dist/statics/app.bundle.js')).to
        .contain(`.config(["$typescript", function ($typescript)`);
    });

    it('should fail with error code 1', () => {

      const resp = test
        .setup({
          'src/app.ts': 'function ()',
          'tsconfig.json': fx.tsconfig(),
          'package.json': fx.packageJson({
            entry: './app.ts'
          })
        })
        .execute('build');

      expect(resp.code).to.equal(1);
      expect(resp.stdout).to.contain('error TS1003: Identifier expected');
    });
  });

  describe('Sass', () => {
    afterEach(() => test.teardown());

    describe('client', () => {
      beforeEach(() => setupAndBuild());

      it('should run sass and css loaders over imported .scss files', () => {
        expect(test.content('dist/statics/app.bundle.js')).to.match(/"some-rule":"some-css__some-rule__\w{5}",([\s\S]*?)"child":"some-css__child__\w{5}"/);
      });

      it('should also expose css classes as camelcase', () => {
        expect(test.content('dist/statics/app.bundle.js')).to.match(/"someRule":"some-css__some-rule__\w{5}"/);
      });

      it('should apply auto-prefixer', () => {
        expect(test.content('dist/statics/app.css')).to.contain('-webkit-appearance');
      });

      it('should allow import sass from node_modules', () => {
        test
          .setup({
            'src/client.js': `require('./foo.css');`,
            'src/foo.css': '@import "bar/bar";',
            'node_modules/bar/bar.scss': '.bar{color:red}',
            'package.json': fx.packageJson({}),
          })
          .execute('build');

        expect(test.content('dist/statics/app.css')).to.contain('color: red');
      });

      it('should support compass', () => {
        test
          .setup({
            'src/client.js': `require('./foo.scss');`,
            'src/foo.scss': '@import "compass"; .bar{color:red}',
            'node_modules/compass-mixins/lib/_compass.scss': '',
            'package.json': fx.packageJson({}),
          })
          .execute('build');

        expect(test.content('dist/statics/app.css')).to.contain('color: red');
      });

      it('should support TPA style params', () => {
        test
          .setup({
            'src/client.js': `require('./foo.css');`,
            'src/foo.css': '.foo{color: unquote("{{color-1}}");font: unquote("; {{body-m}}");font-size: 16px;}',
            'package.json': fx.packageJson({
              tpaStyle: true
            }),
          })
          .execute('build');

        expect(test.content('dist/statics/app.css')).to.contain('font-size: 16px');
        expect(test.content('dist/statics/app.css')).not.to.contain('color-1');
        expect(test.content('dist/statics/app.css')).not.to.contain('body-m');
      });

      describe('composes keyword', () => {
        const commonConfig = {
          'src/client.js': `require('./some-css.scss');`,
          'src/server.js': `require('./some-css.scss');`,
          'src/some-css.scss': ` .some-rule { composes: foo from './base.scss';}`,
          'src/base.scss': `.foo{background: blue;} // comments are only possible in sass`
        };

        it('should support nested sass imports when using "compose"', () => {
          test.setup(Object.assign({'package.json': fx.packageJson({})}, commonConfig))
            .execute('build');
          expect(test.content('dist/statics/app.css')).to.contain('background: blue');
          expect(test.content('dist/statics/app.bundle.js'))
            .to.match(/"some-rule":"some-css__some-rule\w+ base__foo\w+"/);
        });

        it('should support nested sass imports when using "compose", when using wix-tpa-style-loader', () => {
          test.setup(Object.assign({'package.json': fx.packageJson({tpaStyle: true})}, commonConfig))
            .execute('build');
          expect(test.content('dist/statics/app.css')).to.contain('background: blue');
          expect(test.content('dist/statics/app.bundle.js'))
            .to.match(/"some-rule":"some-css__some-rule\w+ base__foo\w+"/);
        });
      });
    });

    describe('detach css', () => {
      it('should create an external app.css file with a source map', () => {
        setupAndBuild();
        expect(test.content('dist/statics/app.css')).to.match(/.\w+/);
        expect(test.content('dist/statics/app.css')).to.contain('color: red');
        expect(test.content('dist/statics/app.css')).to.contain('color: blue');
      });

      it('should keep styles inside the bundle when separateCss equals to false', () => {
        setupAndBuild({separateCss: false});
        expect(test.list('dist/statics')).not.to.contain('app.css');
        expect(test.list('dist/statics')).not.to.contain('app.css.map');
        expect(test.content('dist/statics/app.bundle.js')).to.contain('color: red');
        expect(test.content('dist/statics/app.bundle.js')).to.contain('color: blue');
      });
    });

    function setupAndBuild(config) {
      test
        .setup({
          'src/client.js': `require('./some-css.scss');require('./foo.css');`,
          'src/server.js': `require('./some-css.scss');require('./foo.css');`,
          'src/some-css.scss': `// comment
                                  @import "./imported";
                                  .some-rule { .child { color: red; } }`,
          'src/imported.scss': '.foo{appearance: none;}',
          'src/foo.css': '.foo-rule { color: blue }',
          'package.json': fx.packageJson(config || {}),
        })
        .execute('build');
    }
  });

  describe('Less', () => {
    afterEach(() => test.teardown());

    describe('client', () => {
      beforeEach(() => setupAndBuild());

      it('should run less and css loaders over imported .less files', () => {
        expect(test.content('dist/statics/app.bundle.js')).to.match(/"some-rule":"some-css__some-rule__\w{5}",([\s\S]*?)"child":"some-css__child__\w{5}"/);
      });

      it('should allow import less from node_modules', () => {
        test
          .setup({
            'src/client.js': `require('./foo.less');`,
            'src/foo.less': '@import "~bar/baz.less";',
            'node_modules/bar/baz.less': '.bar{color:red}',
            'package.json': fx.packageJson({}),
          })
          .execute('build');

        expect(test.content('dist/statics/app.css')).to.contain('color: red');
      });

      it('should support TPA style params', () => {
        test
          .setup({
            'src/client.js': `require('./foo.less');`,
            'src/foo.less': '.foo{color: unquote("{{color-1}}");font: unquote("; {{body-m}}");font-size: 16px;}',
            'package.json': fx.packageJson({
              tpaStyle: true
            }),
          })
          .execute('build');

        expect(test.content('dist/statics/app.css')).to.contain('font-size: 16px');
        expect(test.content('dist/statics/app.css')).not.to.contain('color-1');
        expect(test.content('dist/statics/app.css')).not.to.contain('body-m');
      });
    });

    function setupAndBuild(config) {
      test
        .setup({
          'src/client.js': `require('./some-css.less');require('./foo.css');`,
          'src/server.js': `require('./some-css.less');require('./foo.css');`,
          'src/some-css.less': `// comment
                                  @import "./imported";
                                  .some-rule { .child { color: red; } }`,
          'src/imported.less': '.foo{appearance: none;}',
          'src/foo.css': '.foo-rule { color: blue }',
          'package.json': fx.packageJson(config || {}),
        })
        .execute('build');
    }
  });

  describe('Images', () => {
    afterEach(() => test.teardown());

    it('should embed image below 10kb as base64', () => {
      test
        .setup({
          'src/client.js': `require('./tiny-image.png');`,
          'src/tiny-image.png': 'some-content'
        })
        .execute('build');

      expect(test.content('dist/statics/app.bundle.js')).to.contain('data:image/png;base64,c29tZS1jb250ZW50Cg==');
    });

    it('should write a separate image above 10kb', () => {
      test
        .setup({
          'src/client.js': `require('./large-image.png');`,
          'src/large-image.png': _.repeat('a', 10001)})
        .execute('build');

      expect(test.content('dist/statics/app.bundle.js')).to.match(/"large-image.png\?\w+"/);
    });

    it('should load fonts', () => {
      test
        .setup({
          'src/client.js': `require('./font.ttf');
            require('./font.woff');
            require('./font.woff2');
            require('./font.eot');`,
          'src/font.ttf': _.repeat('a', 10001),
          'src/font.woff': _.repeat('a', 10001),
          'src/font.woff2': _.repeat('a', 10001),
          'src/font.eot': _.repeat('a', 10001),
        })
        .execute('build');

      const content = test.content('dist/statics/app.bundle.js');

      expect(content).to.match(/"font.ttf\?\w+"/);
      expect(content).to.match(/"font.woff\?\w+"/);
      expect(content).to.match(/"font.woff2\?\w+"/);
      expect(content).to.match(/"font.eot\?\w+"/);
    });

    it('should load files that have a path with query string ', () => {
      test
        .setup({
          'src/client.js': `require('./font.ttf?version=1.0.0');
            require('./image.svg?version=1.0.2&some-other-param=value');`,
          'src/font.ttf': _.repeat('a', 10001),
          'src/image.svg': _.repeat('a', 10001)
        })
        .execute('build');

      const content = test.content('dist/statics/app.bundle.js');

      expect(content).to.contain('font.ttf?version=1.0.0');
      expect(content).to.contain('./image.svg?version=1.0.2&some-other-param=value');
    });

  });

  describe('Json', () => {
    beforeEach(() =>
      test
        .setup({
          'src/client.js': `require('./some.json')`,
          'src/some.json': '{"json-content": 42}'
        })
        .execute('build')
    );

    it('should embed json file into bundle', () =>
      expect(test.content('dist/statics/app.bundle.js')).to.contain('"json-content": 42')
    );
  });

  describe('HTML', () => {
    beforeEach(() =>
      test
        .setup({
          'src/client.js': `require('./some.html')`,
          'src/some.html': '<div>This is a HTML file</div>'
        })
        .execute('build')
    );

    it('should embed html file into bundle', () =>
      expect(test.content('dist/statics/app.bundle.js')).to.contain('<div>This is a HTML file</div>')
    );
  });

  describe('raw', () => {
    beforeEach(() =>
      test
        .setup({
          'src/client.js': `require('./some.md')`,
          'src/some.md': '### title'
        })
        .execute('build')
    );

    it('should embed html file into bundle', () =>
      expect(test.content('dist/statics/app.bundle.js')).to.contain('### title')
    );
  });

  describe('GraphQL', () => {
    beforeEach(() =>
      test
        .setup({
          'src/getData1.graphql': 'query GetData1 { id, name }',
          'src/getData2.gql': 'query GetData2 { id, name }',
          'src/client.js': `require('./getData1.graphql'); require('./getData2.gql')`
        })
        .execute('build')
    );

    it('should embed parsed graphql query into bundle', () => {
      const content = test.content('dist/statics/app.bundle.js');

      expect(content).to.contain('{"kind":"Name","value":"GetData1"}');
      expect(content).to.contain('{"kind":"Name","value":"GetData2"}');
    });
  });
});
