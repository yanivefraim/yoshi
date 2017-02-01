const expect = require('chai').expect;
const tp = require('./helpers/test-phases');
const fx = require('./helpers/fixtures');
const hooks = require('./helpers/hooks');
const {outsideTeamCity, insideTeamCity} = require('./helpers/env-variables');
const {readFileSync} = require('fs');

describe('Aggregator: Build', () => {
  // const baseFolders = ['app', 'src', 'test'];
  const defaultOutput = 'statics';
  let test;

  beforeEach(() => test = tp.create());
  afterEach(() => test.teardown());

  describe('Sass', () => {
    it('should transpile to dist/, preserve folder structure, extensions and exit with code 0', () => {
      const compiledStyle = '.a .b {\n  color: red; }';
      const resp = test
        .setup({
          'src/server.js': '',
          'src/config.js': '',
          'src/client.js': '',
          'app/a/style.scss': fx.scss(),
          'src/b/style.scss': fx.scss(),
          'test/c/style.scss': fx.scss(),
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .execute('build');

      expect(resp.code).to.equal(0);
      expect(resp.stdout).to.contain('Compiling with Sass');
      expect(test.content('dist/app/a/style.scss')).to.contain(compiledStyle);
      expect(test.content('dist/src/b/style.scss')).to.contain(compiledStyle);
      expect(test.content('dist/test/c/style.scss')).to.contain(compiledStyle);
    });

    it('should fail with exit code 1', () => {
      const resp = test
        .setup({
          'src/server.js': '',
          'src/config.js': '',
          'src/client.js': '',
          'app/a/style.scss': fx.scssInvalid(),
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .execute('build');

      expect(resp.code).to.equal(1);
      expect(resp.stdout).to.contain('Compiling with Sass');
      expect(resp.stderr).to.contain('Invalid CSS after ".a {');
    });

    it('should consider node_modules for path', () => {
      const resp = test
        .setup({
          'src/server.js': '',
          'src/config.js': '',
          'src/client.js': '',
          'node_modules/some-module/style.scss': `
            .a {
              color: black;
            }
          `,
          'app/a/style.scss': `
            @import 'some-module/style.scss'
          `,
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .execute('build');

      expect(resp.code).to.equal(0);
      expect(resp.stdout).to.contain('Compiling with Sass');
      expect(test.content('dist/app/a/style.scss')).to.contain('.a {\n  color: black; }');
    });
  });

  describe('Babel', () => {
    it('should transpile to dist but only form app, src, test, testkit folders and index.js itself and exit with code 0', () => {
      const resp = test
        .setup({
          '.babelrc': '{}',
          'app/b.jsx': 'const b = 2;',
          'src/a/a.js': 'const a = 1;',
          'test/a/a.spec.js': 'const test = \'test\';',
          'testkit/a.js': 'const a = 1;',
          'index.js': 'const name = \'name\';',
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .execute('build')
      ;

      expect(resp.stdout).to.contain('Compiling with Babel');
      expect(resp.code).to.equal(0);
      expect(test.list('dist')).to.include.members(['src', 'app', 'test', 'testkit', 'index.js']);
    });

    it('should preserve folder structure, create source maps', function () {
      this.timeout(60000);

      const resp = test
        .setup({
          '.babelrc': `{"presets": ["es2015"]}`,
          'src/a/a.js': 'const a = 1;',
          'package.json': `{
              "name": "a",\n
              "version": "1.0.4",\n
              "dependencies": {\n
                "babel-preset-es2015": "latest"\n
              }
            }`,
          'pom.xml': fx.pom()
        }, [hooks.installDependencies])
        .execute('build')
      ;

      expect(resp.stdout).to.contain('Compiling with Babel');
      expect(resp.code).to.equal(0);
      expect(test.content('dist/src/a/a.js')).to.contain('var a = 1;');
      expect(test.content('dist/src/a/a.js')).to.contain('//# sourceMappingURL=a.js.map');
      expect(test.contains('dist/src/a/a.js.map')).to.be.true;
    });

    it('should transpile when there is babel config inside package.json', () => {
      const resp = test
        .setup({
          'package.json': `{
            "name": "a",\n
            "version": "1.0.4",\n
            "babel": {}
          }`,
          'src/a/a.js': 'const a = 1;',
          'pom.xml': fx.pom()
        })
        .execute('build')
      ;

      expect(resp.stdout).to.contain('Compiling with Babel');
      expect(resp.code).to.equal(0);
      expect(test.content('dist/src/a/a.js')).to.contain('const a = 1;');
      expect(test.content('dist/src/a/a.js')).to.contain('//# sourceMappingURL=a.js.map');
      expect(test.contains('dist/src/a/a.js.map')).to.be.true;
    });

    it('should fail with exit code 1', () => {
      const resp = test
        .setup({
          '.babelrc': '{}',
          'src/a.js': 'function ()',
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .execute('build')
      ;
      expect(resp.code).to.equal(1);
      expect(resp.stdout).to.contain('Unexpected token (1:9)');
      expect(resp.stdout).to.contain('1 | function ()');
    });

    it('should ignore dist/ and node_modules/ from being transpiled', () => {
      const resp = test
          .setup({
            'dist/a.js': 'function () {{}',
            'node_modules/a.js': 'function () {{}',
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .execute('build')
        ;
      expect(resp.code).to.equal(0);
      expect(test.contains('dist/node_modules')).to.be.false;
    });

    it('should build from specified directory', () => {
      const resp = test.setup({
        '.babelrc': '{}',
        'src/nope.js': 'const nope = "nope";',
        'custom/yep.js': 'const yep = "yep";',
        'package.json': fx.packageJson(),
        'pom.xml': fx.pom()
      }).execute('build --dirs=custom');

      expect(resp.code).to.equal(0);
      expect(test.content('dist/custom/yep.js')).to.contain('yep');
      expect(test.contains('dist/src')).to.be.false;
    });

    it('should build from multiple specified directories', () => {
      const resp = test.setup({
        '.babelrc': '{}',
        'src/nope.js': 'const nope = "nope";',
        'custom/yep.js': 'const yep = "yep";',
        'another/yep.js': 'const yep = "yep";',
        'package.json': fx.packageJson(),
        'pom.xml': fx.pom()
      }).execute('build --dirs=custom,another');

      expect(resp.code).to.equal(0);
      expect(test.content('dist/custom/yep.js')).to.contain('yep');
      expect(test.content('dist/another/yep.js')).to.contain('yep');
      expect(test.contains('dist/src')).to.be.false;
    });

    it('should store transpilation output into file system cache', () => {
      const resp = test
       .setup({
         '.babelrc': '{}',
         'src/foo.js': 'const foo = `bar`;',
         'package.json': fx.packageJson(),
         'pom.xml': fx.pom()
       })
       .execute('build');

      expect(resp.code).to.equal(0);
      expect(test.list('.', '-RA')).to.contain('target/.babel-cache');
    });
  });

  describe('TypeScript', () => {
    it('should transpile to dist and exit with code 0', () => {
      const resp = test
        .setup({
          'app/a.ts': 'const a = 1;',
          'app/b.tsx': 'const b = 2',
          'tsconfig.json': fx.tsconfig(),
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .execute('build');

      expect(resp.stdout).to.contain('Compiling TypeScript');
      expect(resp.code).to.equal(0);
      expect(test.content('dist/app/a.js')).to.contain('var a = 1');
      expect(test.content('dist/app/b.js')).to.contain('var b = 2');
    });

    it('should create source maps and definition files side by side', () => {
      test.setup({
        'app/a.ts': 'const b = 2;',
        'tsconfig.json': fx.tsconfig(),
        'package.json': fx.packageJson(),
        'pom.xml': fx.pom()
      })
      .execute('build');

      expect(test.content('dist/app/a.js')).to.contain('//# sourceMappingURL=a.js.map');
      expect(test.list('dist/app')).to.include('a.js.map', 'a.d.ts');
    });

    it('should fail with exit code 1', () => {
      const resp = test
        .setup({
          'src/a.ts': 'function ()',
          'tsconfig.json': fx.tsconfig(),
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .execute('build');

      expect(resp.code).to.equal(1);
      expect(resp.stdout).to.contain('error TS1003: Identifier expected');
    });

    // it('should transpile from the base folders with consider tsconfig include & exclude', () => {
    //   const filesInFolders = baseFolders
    //     .map(dir => `${dir}/a.ts`)
    //     .concat(['app/b.ts', 'outOfBase/a.ts'])
    //     .reduce((result, dir) =>
    //       Object.assign(result, {[dir]: 'function(){}'})
    //     , {});

    //   test.setup(Object.assign({
    //     'tsconfig.json': fx.tsconfig({
    //       rootDirs: ['app', 'test', 'src'],
    //       include: ['outOfBase/a.ts', ...baseFolders.map(dir => `${dir}/**/*.*`)],
    //       exclude: ['app/b.ts'],
    //     }),
    //     'package.json': fx.packageJson(),
    //     'pom.xml': fx.pom()
    //   }, filesInFolders))
    //     .execute('build');

    //   expect(test.list('dist/').length).to.equal(baseFolders.length + 1);
    //   expect(test.list('dist/')).to.include('outOfBase');
    //   expect(test.list('dist/')).not.to.include('b.js');
    // });

    // it('should build from specified directory', () => {
    //   const resp = test.setup({
    //     'src/nope.ts': 'const nope = "nope";',
    //     'custom/yep.ts': 'const yep = "yep";',
    //     'package.json': fx.packageJson(),
    //     'tsconfig.json': fx.tsconfig(),
    //     'pom.xml': fx.pom()
    //   }).execute('build --dirs=custom');

    //   expect(resp.code).to.equal(0);
    //   expect(test.content('dist/custom/yep.js')).to.contain('yep');
    //   expect(test.contains('dist/src')).to.be.false;
    // });

    // it('should build from multiple specified directories', () => {
    //   const resp = test.setup({
    //     'src/nope.ts': 'const nope = "nope";',
    //     'custom/yep.ts': 'const yep = "yep";',
    //     'another/yep.tsx': 'const yep2 = "yep2";',
    //     'package.json': fx.packageJson(),
    //     'tsconfig.json': fx.tsconfig(),
    //     'pom.xml': fx.pom()
    //   }).execute('build --dirs=custom,another');

    //   expect(resp.code).to.equal(0);
    //   expect(test.content('dist/custom/yep.js')).to.contain('yep');
    //   expect(test.content('dist/another/yep.js')).to.contain('yep2');
    //   expect(test.contains('dist/src')).to.be.false;
    // });

    it('should not transpile with babel if there is tsconfig', () => {
      const resp = test
        .setup({
          'src/a.js': 'const a = 1;',
          'src/b.ts': 'const b = 2;',
          'tsconfig.json': fx.tsconfig(),
          '.babelrc': `{"plugins": ["transform-es2015-block-scoping"]}`,
          'pom.xml': fx.pom(),
          'package.json': `{
              "name": "a",\n
              "version": "1.0.4",\n
              "dependencies": {\n
                "babel-plugin-transform-es2015-block-scoping": "latest"\n
              },
              "wix": {
                "entry": "./a.js"
              }}`

        }, [hooks.installDependencies])
        .execute('build');

      expect(resp.code).to.equal(0);
      expect(test.list('dist/src')).not.to.contain('a.js');
      expect(test.content('dist/src/b.js')).to.contain('var b = 2');
    });
  });

  describe('No individual transpilation', () => {
    it('should not transpile if no tsconfig/babelrc', () => {
      const resp = test
        .setup({
          'src/b.ts': 'const b = 2;',
          'src/a/a.js': 'const a = 1;',
          'package.json': fx.packageJson()
        })
        .execute('build');

      expect(resp.stdout).to.not.contain('Compiling with Babel');
      expect(resp.code).to.equal(0);
      expect(test.list('/')).not.to.include('dist');
    });

    it('should not transpile if runIndividualTranspiler = false', () => {
      const resp = test
        .setup({
          '.babelrc': '{}',
          'src/b.ts': 'const b = 2;',
          'src/a/a.js': 'const a = 1;',
          'package.json': fx.packageJson({runIndividualTranspiler: false})
        })
        .execute('build');

      expect(resp.stdout).to.not.contain('Compiling with Babel');
      expect(resp.code).to.equal(0);
      expect(test.list('/')).not.to.include('dist');
    });
  });

  describe('Bundle', () => {
    it('should generate a bundle', () => {
      const res = test
        .setup({
          'src/client.js': `const aFunction = require('./dep');const a = aFunction(1);`,
          'src/dep.js': `module.exports = function(a){return a + 1;};`,
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .execute('build');

      expect(res.code).to.equal(0);
      expect(test.list('dist/statics')).to.contain('app.bundle.js');
      expect(test.content('dist/statics/app.bundle.js')).to.contain('const a = aFunction(1);');
      expect(test.content('dist/statics/app.bundle.js')).to.contain('module.exports = function (a)');
    });

    it('should fail with exit code 1', () => {
      const res = test
          .setup({
            'src/client.js': `const aFunction = require('./dep');const a = aFunction(1);`,
            'src/dep.js': `module.exports = a => {`,
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .execute('build');

      expect(res.code).to.equal(1);
      expect(res.stdout).to.contain('Unexpected token (2:0)');
    });

    it('should generate a bundle using different entry', () => {
      const res = test
          .setup({
            'src/app-final.js': `const aFunction = require('./dep');const a = aFunction(1);`,
            'src/dep.js': `module.exports = function(a){return a + 1;};`,
            'package.json': fx.packageJson({
              entry: './app-final.js'
            }),
            'pom.xml': fx.pom()
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.list('dist/statics').indexOf('app.bundle.js')).to.be.at.least(0);
      expect(test.content('dist/statics/app.bundle.js')).to.contain('const a = aFunction(1);');
      expect(test.content('dist/statics/app.bundle.js')).to.contain('module.exports = function (a)');
    });

    it.skip('should generate a bundle using different entry and different context', () => {
      const res = test
          .setup({
            'app/app-final.js': `const aFunction = require('./dep');const a = aFunction(1);`,
            'src/dep.js': `module.exports = function(a){return a + 1;};`,
            'package.json': fx.packageJson({
              entry: './app-final.js'
            })
          })
          .execute('build', ['--context=app']);

      expect(res.code).to.equal(0);
      expect(test.list('dist/statics')).to.contain('app.bundle.js');
      expect(test.content('dist/statics/app.bundle.js')).to.contain('const a = aFunction(1);');
      expect(test.content('dist/statics/app.bundle.js')).to.contain('module.exports = function (a)');
    });

    it('should support single entry point in package.json', () => {
      const res = test
          .setup({
            'src/app1.js': `const thisIsWorks = true;`,
            'package.json': fx.packageJson({
              entry: './app1.js'
            }),
            'pom.xml': fx.pom()
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content('dist/statics/app.bundle.js')).to.contain('thisIsWorks');
    });

    it('should support multiple entry points in package.json', () => {
      const res = test
          .setup({
            'src/app1.js': `const thisIsWorks = true;`,
            'src/app2.js': `const hello = "world";`,
            'package.json': fx.packageJson({
              entry: {
                first: './app1.js',
                second: './app2.js'
              }
            }),
            'pom.xml': fx.pom()
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content('dist/statics/first.bundle.js')).to.contain('thisIsWorks');
      expect(test.content('dist/statics/second.bundle.js')).to.contain('const hello');
    });

    it.skip('should put all of the bundles in the specified directory when --output flag is set', () => {
      const res = test.setup({
        'src/app1.js': `const thisIsWorks = true;`,
        'package.json': fx.packageJson({
          entry: {
            app: './app1.js',
          }
        })
      }).execute('build', ['--output=statics1']);

      expect(res.code).to.equal(0);
      expect(test.list('dist/statics1').indexOf('app.bundle.js')).to.be.at.least(0);
    });

    it.skip('should set the context of webpack if a value provided when --context flag is set', () => {
      const res = test.setup({
        'app/app.js': `const thisIsWorks = true;`,
        'package.json': fx.packageJson({
          entry: {
            app: './app.js',
          }
        })
      }).execute('build', ['--context=app']);

      expect(res.code).to.equal(0);
      expect(test.list(`dist/${defaultOutput}`).indexOf('app.bundle.js')).to.be.at.least(0);
    });

    it('should create sourceMaps for both bundle and specs', () => {
      const res = test
          .setup({
            'src/app.js': `const thisIsWorks = true;`,
            'src/app.spec.js': `const thisIsWorksAgain = true;`,
            'package.json': fx.packageJson({
              entry: './app.js'
            }),
            'pom.xml': fx.pom()
          })
          .execute('build');

      expect(res.code).to.equal(0);

      expect(test.content('dist/statics/app.bundle.js')).to.contain('thisIsWorks');
      expect(test.list('dist/statics')).to.contain('app.bundle.js.map');
    });

    it('should bundle the app given importing json file', () => {
      test
          .setup({
            'src/app.js': `require('./some.json')`,
            'src/some.json': `{"json-content": 42}`,
            'package.json': fx.packageJson({
              entry: './app.js'
            }),
            'pom.xml': fx.pom()
          })
          .execute('build');

      expect(test.content('dist/statics/app.bundle.js')).to.contain(`"json-content": 42`);
    });

    it('should consider babel\'s sourceMaps for bundle', function () {
      this.timeout(120000); // 2min, may be even shorter

      const res = test
          .setup({
            'src/app.js': `const thisIsWorks = true;`,
            'src/app.spec.js': `const thisIsWorksAgain = true;`,
            '.babelrc': `{"plugins": ["transform-es2015-block-scoping"]}`,
            'pom.xml': fx.pom(),
            'package.json': `{\n
              "name": "a",\n
              "version": "1.0.4",\n
              "dependencies": {\n
                "babel-plugin-transform-es2015-block-scoping": "latest"\n
              },
              "wix": {
                "entry": "./app.js"
              }
            }`
          }, [hooks.installDependencies])
          .execute('build');

      expect(res.code).to.equal(0);

      expect(test.content('dist/statics/app.bundle.js')).to.contain('var thisIsWorks');
      expect(test.content('dist/statics/app.bundle.js.map')).to.contain('const thisIsWorks');
    });

    it('should generate bundle if entry is a typescript file', () => {
      const res = test
        .setup({
          'src/app.ts': 'console.log("hello");',
          'tsconfig.json': fx.tsconfig(),
          'package.json': fx.packageJson({
            entry: './app.ts'
          }),
          'pom.xml': fx.pom()
        })
        .execute('build');

      expect(res.code).to.equal(0);
      expect(test.list('dist/statics')).to.contain('app.bundle.js');
    });

    it('should generate bundle if entry extension is omitted by looking for existing .ts or .js files', () => {
      const res = test
        .setup({
          'src/app.ts': 'console.log("hello");',
          'tsconfig.json': fx.tsconfig(),
          'package.json': fx.packageJson({
            entry: './app'
          }),
          'pom.xml': fx.pom()
        })
        .execute('build');

      expect(res.code).to.equal(0);
      expect(test.list('dist/statics')).to.contain('app.bundle.js');
    });

    it('should allow generating a bundle by default with both .js and .ts extensions', () => {
      const res = test
        .setup({
          'src/client.ts': 'console.log("hello");',
          'tsconfig.json': fx.tsconfig(),
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .execute('build');

      expect(res.code).to.equal(0);
      expect(test.list('dist/statics')).to.contain('app.bundle.js');
    });

    it('should generate a minified bundle', () => {
      const res = test
        .setup({
          'src/client.js': `const aFunction = require('./dep');const a = aFunction(1);`,
          'src/dep.js': `module.exports = function(a){return a + 1;};`,
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .execute('build');

      expect(res.code).to.equal(0);

      expect(test.list('dist/statics')).to.contain('app.bundle.js');
      expect(test.list('dist/statics')).to.contain('app.bundle.min.js');

      expect(test.list('dist/statics')).to.contain('app.bundle.min.js.map');
      expect(test.list('dist/statics')).to.contain('app.bundle.min.js.map');
    });

    it('should exit with code 1 with a custom entry that does not exist', () => {
      const res = test
        .setup({
          'tsconfig.json': fx.tsconfig(),
          'package.json': fx.packageJson({
            entry: './hello'
          }),
          'pom.xml': fx.pom()
        })
        .execute('build');

      expect(res.code).to.equal(1);
      expect(test.list('dist/statics')).not.to.contain('app.bundle.js');
    });

    it('should exit with code 1 without a custom entry and default entry not existing', () => {
      const res = test
        .setup({
          'tsconfig.json': fx.tsconfig(),
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .execute('build');

      expect(res.code).to.equal(0);
      expect(test.list('dist/statics')).not.to.contain('app.bundle.js');
    });
  });

  describe('Bundle output with library support', () => {
    it('should generate a bundle with umd library support', () => {
      const res = test
          .setup({
            'src/client.js': '',
            'package.json': fx.packageJson({
              exports: 'MyLibraryEndpoint'
            })
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content('dist/statics/app.bundle.js')).to.contain('exports["MyLibraryEndpoint"]');
      expect(test.content('dist/statics/app.bundle.js')).to.contain('root["MyLibraryEndpoint"]');
    });
  });

  describe('Bundle - sass', () => {
    it('should generate a bundle with css', () => {
      const res = test
          .setup({
            'src/client.js': 'require(\'./style.scss\');',
            'src/style.scss': `.a {.b {color: red;}}`,
            'package.json': fx.packageJson({separateCss: false, cssModules: false})
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content('dist/statics/app.bundle.js')).to.contain('.a .b');
    });

    it.skip('should fail with exit code 1', () => {
      const res = test
          .setup({
            'src/client.js': 'require(\'./style1.scss\');',
            'src/style.scss': `.a {.b {color: red;}}`,
            'package.json': fx.packageJson()
          })
          .execute('build');

      expect(res.code).to.equal(1);
      expect(test.list('dist', '-R')).to.not.include('statics/app.bundle.js');
    });

    it('should separate Css from bundle', () => {
      const res = test
        .setup({
          'src/client.js': 'require(\'./style.scss\');',
          'src/style.scss': `.a {.b {color: red;}}`,
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content('dist/statics/app.bundle.js')).not.to.contain('{\n  color: red; }');
      expect(test.content('dist/statics/app.css')).to.contain('{\n  color: red; }');
    });

    it('should create a separate css file for each entry', () => {
      const res = test
          .setup({
            'src/client.js': 'require(\'./client-styles.scss\');',
            'src/settings.js': 'require(\'./settings-styles.scss\');',
            'src/client-styles.scss': `.a {.b {color: red;}}`,
            'src/settings-styles.scss': `.c {.d {color: purple;}}`,
            'package.json': fx.packageJson({entry: {app: './client.js', settings: './settings.js'}}),
            'pom.xml': fx.pom()
          })
          .execute('build');
      expect(res.code).to.equal(0);
      expect(test.list('./dist/statics')).to.contain.members(['app.css', 'settings.css']);
    });

    it.skip('should generate css modules on bundle', () => {
      const res = test
          .setup({
            'src/client.js': 'require(\'./styles/my-file.scss\');',
            'src/styles/my-file.scss': `.a {.b {color: red;}}`,
            'package.json': fx.packageJson()
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).to.contain('.styles-__my-file__a__');
      expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).to.contain('.styles-__my-file__b__');
    });

    it('should generate css modules on separate css file', () => {
      const regex = /\.styles-my-file__a__.{5}\s.styles-my-file__b__.{5}\s{/;
      const res = test
          .setup({
            'src/client.js': 'require(\'./styles/my-file.scss\');',
            'src/styles/my-file.scss': `.a {.b {color: red;}}`,
            'package.json': fx.packageJson({cssModules: true, separateCss: true}),
            'pom.xml': fx.pom()
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).not.to.match(regex);
      expect(test.content(`dist/${defaultOutput}/app.css`)).to.match(regex);
    });

    it('should generate css modules as default', () => {
      const regex = /\.styles-my-file__a__.{5}\s.styles-my-file__b__.{5}\s{/;
      const res = test
          .setup({
            'src/client.js': 'require(\'./styles/my-file.scss\');',
            'src/styles/my-file.scss': `.a {.b {color: red;}}`,
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).not.to.match(regex);
      expect(test.content(`dist/${defaultOutput}/app.css`)).to.match(regex);
    });

    it('should disable css modules', () => {
      const res = test
          .setup({
            'src/client.js': 'require(\'./styles/my-file.scss\');',
            'src/styles/my-file.scss': `.a {.b {color: red;}}`,
            'package.json': fx.packageJson({cssModules: false, separateCss: true}),
            'pom.xml': fx.pom()
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content(`dist/${defaultOutput}/app.css`)).to.contain('.a .b {');
    });

    it.skip('should generate a bundle with svg/images', () => {
      const res = test
          .setup({
            'src/client.js': 'require(\'./style.scss\');',
            'src/style.scss': `.button {
                                background: url("./icon.svg") no-repeat center center;
                                background: url("./image.png") no-repeat center center;
                                background: url("./image.jpg") no-repeat center center;
                                background: url("./image.gif") no-repeat center center;
                              }`,
            'src/icon.svg': '',
            'src/image.gif': '',
            'src/image.jpg': '',
            'src/image.png': '',
            'package.json': fx.packageJson({separateCss: false})
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).to.match(/icon.\w+.svg/g);
      expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).to.match(/image.\w+.png/g);
      expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).to.match(/image.\w+.jpg/g);
      expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).to.match(/image.\w+.gif/g);
    });

    it.skip('should generate a bundle with @font-face', () => {
      const res = test
        .setup({
          'src/client.js': 'require(\'./style.scss\');',
          'src/style.scss': `@font-face {
                              font-family: 'icomoon';
                              src:  url('assets/fonts/icomoon.eot?7yf4s0');
                              src:  url('assets/fonts/icomoon.eot?7yf4s0#iefix') format('embedded-opentype'),
                                url('assets/fonts/icomoon.ttf?7yf4s0') format('truetype'),
                                url('assets/fonts/icomoon.woff?7yf4s0') format('woff'),
                                url('assets/fonts/icomoon.svg?7yf4s0#icomoon') format('svg');
                              font-weight: normal;
                              font-style: normal;
                            }`,
          'src/assets/fonts/icomoon.eot': '',
          'src/assets/fonts/icomoon.ttf': '',
          'src/assets/fonts/icomoon.woff': '',
          'src/assets/fonts/icomoon.svg': '',
          'package.json': fx.packageJson({separateCss: false})
        })
        .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).to.match(/icomoon.\w+.eot/g);
      expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).to.match(/icomoon.\w+.ttf/g);
      expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).to.match(/icomoon.\w+.woff/g);
      expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).to.match(/icomoon.\w+.svg/g);
    });

    describe('autoprefixer', () => {
      it.skip('should generate css attributes prefixes', () => {
        const res = test
          .setup({
            'src/client.js': 'require(\'./style.scss\');',
            'src/style.scss': `.a {
                                display: flex;
                              }`,
            'package.json': fx.packageJson({separateCss: false})
          })
          .execute('build');

        expect(res.code).to.equal(0);
        expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).to.match(/display: -webkit-box;/g);
        expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).to.match(/display: -ms-flexbox;/g);
        expect(test.content(`dist/${defaultOutput}/app.bundle.js`)).to.match(/display: flex;/g);
      });

      it('should generate css attributes prefixes for on separate css file', () => {
        const res = test
          .setup({
            'src/client.js': 'require(\'./style.scss\');',
            'src/style.scss': `.a {
                                display: flex;
                              }`,
            'package.json': fx.packageJson({cssModules: true, separateCss: true}),
            'pom.xml': fx.pom()
          })
          .execute('build');

        expect(res.code).to.equal(0);
        expect(test.content(`dist/${defaultOutput}/app.css`)).to.match(/display: -webkit-box;/g);
        expect(test.content(`dist/${defaultOutput}/app.css`)).to.match(/display: -ms-flexbox;/g);
        expect(test.content(`dist/${defaultOutput}/app.css`)).to.match(/display: flex;/g);
      });

      it('should generate separated minified Css from bundle', () => {
        const res = test
          .setup({
            'src/client.js': 'require(\'./style.scss\');',
            'src/style.scss': `.a {.b {color: red;}}`,
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .execute('build');

        expect(res.code).to.equal(0);
        expect(test.content('dist/statics/app.bundle.js')).not.to.contain('{\n  color: red; }');
        expect(test.content('dist/statics/app.min.css')).to.contain('{color:red}');
      });
    });
  });

  describe.skip('Specs Bundle', () => {
    describe('when an entry point does not exist', () => {
      it('should not generate a bundle with that configuration', () => {
        const res = test
          .setup({
            'src/client.js': `module.exports = 'hello'`,
            'src/server.js': `module.exports = 'world'`,
            'package.json': fx.packageJson()
          })
          .execute('build');

        expect(res.code).to.equal(0);
        expect(test.content('dist/statics/app.bundle.js')).not.to.equal('');
        expect(test.content('dist/server.bundle.js')).to.equal('');
        expect(test.content('dist/config.bundle.js')).to.equal('');
      });
    });

    it('should generate a bundle', () => {
      const res = test
          .setup({
            'src/client.js': `const add1 = a => {return a + 1;};module.exports = add1;`,
            'src/app.spec.js': `const add1 = require('./client');const a = add1(1);`,
            'src/appTwo.spec.js': `const add1 = require('./client');const b = add1(2);`,
            'package.json': fx.packageJson()
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.list('dist')).to.contain('specs.bundle.js');
      expect(test.content('dist/specs.bundle.js')).to.contain('const a = add1(1);');
      expect(test.content('dist/specs.bundle.js')).to.contain('const b = add1(2);');
      expect(test.content('dist/specs.bundle.js')).to.contain('return a + 1;');
    });

    it('should consider custom specs.browser globs if configured', () => {
      const res = test
          .setup({
            'src/client.js': '',
            'some/other/app.js': `const add1 = a => { return a + 1; }; module.exports = add1;`,
            'some/other/app.glob.js': `const add1 = require("./app"); const a = add1(2);`,
            'package.json': fx.packageJson({
              specs: {
                browser: 'some/other/*.glob.js'
              }
            })
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content('dist/specs.bundle.js')).to.contain('const a = add1(2);');
      expect(test.content('dist/specs.bundle.js')).to.contain('return a + 1;');
    });

    it('should generate a bundle with css', () => {
      const res = test
          .setup({
            'src/client.js': `require('./style.css');const add1 = a => {return a + 1;};module.exports = add1;`,
            'src/app.spec.js': `const add1 = require('./client');const a = add1(2);`,
            'src/style.scss': `.a {.b {color: red;}}`,
            'package.json': fx.packageJson({separateCss: false})
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content('dist/specs.bundle.js')).to.contain('.a .b');
    });

    it('should separate css from bundle', () => {
      const res = test
          .setup({
            'src/client.js': `require('./style.css');const add1 = a => {return a + 1;};module.exports = add1;`,
            'src/app.spec.js': `const add1 = require('./client');const a = add1(2);`,
            'src/style.scss': `.a {.b {color: red;}}`,
            'package.json': fx.packageJson({separateCss: true})
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content('dist/statics/app.bundle.js')).not.to.contain('.a .b');
      expect(test.list('dist/statics')).to.contain('app.css');
      expect(test.content('dist/statics/app.css')).to.contain('.a .b');
    });

    it('should separate css from bundle by default', () => {
      const res = test
          .setup({
            'src/client.js': `require('./style.css');const add1 = a => {return a + 1;};module.exports = add1;`,
            'src/app.spec.js': `const add1 = require('./client');const a = add1(2);`,
            'src/style.scss': `.a {.b {color: red;}}`,
            'package.json': fx.packageJson()
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content('dist/statics/app.bundle.js')).not.to.contain('.a .b');
      expect(test.list('dist/statics')).to.contain('app.css');
      expect(test.content('dist/statics/app.css')).to.contain('.a .b');
    });

  });

  describe('Assets', () => {
    const dirs = ['app', 'src', 'test'];

    it('should copy files from assets folder', () => {
      const res = test
         .setup({
           'app/assets/some-file': 'a',
           'src/assets/some-file': 'a',
           'test/assets/some-file': 'a',
           'package.json': fx.packageJson(),
           'pom.xml': fx.pom()
         })
         .execute('build');

      expect(res.code).to.equal(0);

      dirs.forEach(dir =>
        expect(test.list(`dist/${dir}/assets`)).to.include('some-file')
      );
    });

    it('should copy given types', () => {
      const types = ['ejs', 'html', 'vm'];

      const paths = ['app', 'src', 'test']
         .reduce((result, dir) => {
           types.forEach(type => result.push([dir, type]));
           return result;
         }, [])
         .reduce((result, dirTypePair) =>
             Object.assign(result, {[`${dirTypePair[0]}/a.${dirTypePair[1]}`]: 'a'}), {});

      const res = test
         .setup(Object.assign({
           'package.json': fx.packageJson(),
           'pom.xml': fx.pom()
         }, paths))
         .execute('build');

      expect(res.code).to.equal(0);
      dirs.forEach(dir =>
       expect(test.list(`dist/${dir}`).sort()).to.eql(types.map(type => `a.${type}`).sort())
     );
    });

    it('should copy files from assets in specified directories when --dirs flag is raised', () => {
      const res = test.setup({
        'app/assets/appFile': 'a',
        'src/assets/srcFile': 'a',
        'anotherApp/assets/anotherAppFile': 'a',
        'anotherSrc/assets/anotherSrcFile': 'a',
        'package.json': fx.packageJson(),
        'pom.xml': fx.pom()
      }).execute('build', '--dirs=anotherApp,anotherSrc');

      expect(res.code).to.equal(0);

      expect(test.list(`dist/`)).to.not.include('app');
      expect(test.list(`dist/`)).to.not.include('src');
      expect(test.list(`dist/anotherApp/assets`)).to.include('anotherAppFile');
      expect(test.list(`dist/anotherSrc/assets`)).to.include('anotherSrcFile');
    });

    it('should copy files from assets folder into the output dir if specified', () => {
      const res = test.setup({
        'src/assets/some-file': 'a',
        'package.json': fx.packageJson(),
        'pom.xml': fx.pom()
      }).execute('build', ['--output=statics1']);

      expect(res.code).to.equal(0);
      expect(test.list(`dist/statics1/assets`)).to.include('some-file');
    });

    it('should copy files from assets folder directly to the output directory and only from the context directory when the --context flag is set', () => {
      const res = test.setup({
        'app/assets/some-file': 'a',
        'src/assets/should-not-be-here': 'a',
        'package.json': fx.packageJson(),
        'pom.xml': fx.pom()
      }).execute('build', ['--output=statics', '--context=app']);

      expect(res.code).to.equal(0);
      expect(test.list(`dist/statics/assets`)).to.include('some-file');
      expect(test.list(`dist/statics/assets`)).to.not.include('should-not-be-here');
      expect(test.list(`dist/statics/`)).to.not.include('src');
    });

    it('should copy html assets to dist and to statics', () => {
      const res = test.setup({
        'src/index.html': 'a',
        'src/index.vm': 'a',
        'src/index.ejs': 'a',
        'package.json': fx.packageJson(),
        'pom.xml': fx.pom()
      }).execute('build');

      expect(res.code).to.equal(0);
      expect(test.list(`dist/statics`)).to.include('index.html');
      expect(test.list(`dist/statics`)).to.include('index.vm');
      expect(test.list(`dist/statics`)).to.include('index.ejs');
      expect(test.list(`dist/src`)).to.include('index.html');
      expect(test.list(`dist/src`)).to.include('index.vm');
      expect(test.list(`dist/src`)).to.include('index.ejs');
    });

    it('should copy server assets to dist', () => {
      const res = test.setup({
        'src/style.css': fx.css(),
        'src/some.d.ts': '',
        'src/file.json': '{}',
        'package.json': fx.packageJson(),
        'pom.xml': fx.pom()
      }).execute('build');

      expect(res.code).to.equal(0);
      expect(test.list('dist/src')).to.include.members([
        'style.css',
        'file.json',
        'some.d.ts'
      ]);
    });
  });

  describe('Tar.gz.xml creation', () => {
    it('should create tar.gz.xml based on client project name', () => {
      const res = test
          .setup({
            'package.json': fx.packageJson({
              clientProjectName: 'some-client-proj'
            }),
            'pom.xml': fx.pom()
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content('maven/assembly/tar.gz.xml').replace(/\s/g, '')).to.contain(`
        <assembly xmlns="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.0 http://maven.apache.org/xsd/assembly-1.1.0.xsd">
            <id>wix-angular</id>
            <baseDirectory>/</baseDirectory>
            <formats>
                <format>tar.gz</format>
            </formats>
            <fileSets>
                <fileSet>
                    <directory>\${project.basedir}/node_modules/some-client-proj/dist</directory>
                    <outputDirectory>/</outputDirectory>
                    <includes>
                        <include>*</include>
                        <include>*/**</include>
                    </includes>
                </fileSet>
            </fileSets>
        </assembly>
      `.replace(/\s/g, ''));
    });

    it('should create tar.gz.xml for universal app, using default directory for statics', () => {
      const res = test
          .setup({
            'package.json': fx.packageJson({
              universalProject: true
            }),
            'pom.xml': fx.pom()
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content('maven/assembly/tar.gz.xml').replace(/\s/g, '')).to.contain(`
        <assembly xmlns="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.0 http://maven.apache.org/xsd/assembly-1.1.0.xsd">
            <id>wix-angular</id>
            <baseDirectory>/</baseDirectory>
            <formats>
                <format>tar.gz</format>
            </formats>
            <fileSets>
                <fileSet>
                <directory>\${project.basedir}/dist/statics</directory>
                    <outputDirectory>/</outputDirectory>
                    <includes>
                        <include>*</include>
                        <include>*/**</include>
                    </includes>
                </fileSet>
            </fileSets>
        </assembly>
      `.replace(/\s/g, ''));
    });

    it('should create tar.gz.xml for universal app, using different directory for statics', () => {
      const res = test
          .setup({
            'package.json': fx.packageJson({
              universalProject: true,
              servers: {
                cdn: {
                  dir: 'dist/bla'
                }
              }
            }),
            'pom.xml': fx.pom()
          })
          .execute('build');

      expect(res.code).to.equal(0);
      expect(test.content('maven/assembly/tar.gz.xml').replace(/\s/g, '')).to.contain(`
        <assembly xmlns="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.0 http://maven.apache.org/xsd/assembly-1.1.0.xsd">
            <id>wix-angular</id>
            <baseDirectory>/</baseDirectory>
            <formats>
                <format>tar.gz</format>
            </formats>
            <fileSets>
                <fileSet>
                <directory>\${project.basedir}/dist/bla</directory>
                    <outputDirectory>/</outputDirectory>
                    <includes>
                        <include>*</include>
                        <include>*/**</include>
                    </includes>
                </fileSet>
            </fileSets>
        </assembly>
      `.replace(/\s/g, ''));
    });

    it('should not fail if there is no "tarGZLocation"', () => {
      const res = test
          .setup({
            'package.json': fx.packageJson({
              universalProject: true,
              servers: {
                cdn: {
                  dir: 'dist/bla'
                }
              }
            }),
            'pom.xml': `
              <?xml version="1.0" encoding="UTF-8"?>
              <project>
              </project>
            `
          })
          .execute('build');

      expect(res.code).to.equal(0);
    });
  });

  describe('Clean', () => {
    ['dist', 'target'].forEach(folderName =>
      it(`should remove "${folderName}" folders before building`, () => {
        const res = test
          .setup({
            '.babelrc': '{}',
            [`${folderName}/old.js`]: `const hello = "world!";`,
            'src/new.js': 'const world = "hello!";',
            'package.json': fx.packageJson()
          })
          .execute('build');

        expect(res.code).to.be.equal(0);
        expect(res.stdout).to.include(`Cleaning up '${folderName}'...`);
        expect(test.list(folderName)).to.not.include('old.js');
        expect(test.list('dist/src')).to.include('new.js');
      })
    );
  });

  describe('Node', () => {
    it('should update .nvmrc to relevant version as shown in dockerfile', () => {
      const nodeVersion = readFileSync(require.resolve('../templates/.nvmrc'), {encoding: 'utf-8'});
      const res = test
        .setup({
          'package.json': fx.packageJson(),
          '.nvmrc': '0'
        })
        .execute('build', [], outsideTeamCity);

      expect(res.code).to.be.equal(0);
      expect(test.content('.nvmrc')).to.equal(nodeVersion);
    });

    it('should create .nvmrc if it does not exist', () => {
      const nodeVersion = readFileSync(require.resolve('../templates/.nvmrc'), {encoding: 'utf-8'});
      const res = test
        .setup({
          'package.json': fx.packageJson()
        })
        .execute('build', [], outsideTeamCity);

      expect(res.code).to.be.equal(0);
      expect(test.content('.nvmrc')).to.equal(nodeVersion);
    });

    it('should not update .nvmrc if project has a higher version set in .nvmrc', () => {
      const res = test
        .setup({
          '.nvmrc': '99.0.0',
          'package.json': fx.packageJson()
        })
        .execute('build', [], outsideTeamCity);

      expect(res.code).to.be.equal(0);
      expect(test.content('.nvmrc')).to.equal('99.0.0');
    });

    it('should not update .nvmrc inside TeamCity', () => {
      test
        .setup({
          'package.json': fx.packageJson()
        })
        .execute('build', [], insideTeamCity);

      expect(test.list('.nvmrc').length).to.equal(0);
    });
  });

  describe('petri specs', () => {
    it('should create petri-experiments.json file inside dist/statics folder', () => {
      test
        .setup({
          'petri-specs/specs.infra.Dummy.json': fx.petriSpec(),
          'package.json': fx.packageJson()
        })
        .execute('build');

      expect(test.list('dist', '-R')).to.contain('statics/petri-experiments.json');
    });

    it('should not run petri specs if there are no spec files', () => {
      test
        .setup({
          'petri-specs/dummy.txt': '',
          'package.json': fx.packageJson()
        })
        .execute('build');

      expect(test.stdout).not.to.contain('Building petri specs');
    });

    it.skip('should do nothing if there is no petri-specs installed', () => {
      // TODO: figure out how to simulate module doesn't exist in registry
    });
  });
});
