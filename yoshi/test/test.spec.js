'use strict';

const expect = require('chai').expect;
const tp = require('./helpers/test-phases');
const fx = require('./helpers/fixtures');
const {outsideTeamCity, insideTeamCity} = require('./helpers/env-variables');
const hooks = require('./helpers/hooks');

describe('Aggregator: Test', () => {
  let test;
  beforeEach(() => {
    test = tp.create(outsideTeamCity);
  });
  afterEach(() => test.teardown());

  describe('defaults', () => {
    it('should pass with exit code 0 with mocha as default', function () {
      this.timeout(40000);
      const res = test
        .setup({
          'test/component.spec.js': 'it.only("pass", () => 1);',
          'protractor.conf.js': `
            const http = require("http");

            exports.config = {
              framework: "jasmine",
              specs: ["dist/test/**/*.e2e.js"],
              onPrepare: () => {
                const server = http.createServer((req, res) => {
                  const response = "<html><body><script src=http://localhost:3200/app.bundle.js></script></body></html>";
                  res.end(response);
                });

                return server.listen(1337);
              }
            };
          `,
          'dist/test/some.e2e.js': `
            it("should write to body", () => {
              browser.ignoreSynchronization = true;
              browser.get("http://localhost:1337");
              expect(element(by.css("body")).getText()).toEqual("");
            });
          `,
          'package.json': fx.packageJson()
        }, [tmp => hooks.installDependency(tmp)('babel-register')])
        .execute('test');

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain(`Finished 'mocha'`);
      expect(res.stdout).to.contain('1 passing');
    });

  });

  describe('--protractor', () => {
    it(`should run protractor with express that serves static files from client dep
        if protractor.conf is present, according to dist/test/**/*.e2e.js glob`, () => {
      const res = test
        .setup({
          'protractor.conf.js': `
            const http = require("http");

            exports.config = {
              framework: "jasmine",
              specs: ["dist/test/**/*.e2e.js"],
              onPrepare: () => {
                const server = http.createServer((req, res) => {
                  const response = "<html><body><script src=http://localhost:3200/app.bundle.js></script></body></html>";
                  res.end(response);
                });

                return server.listen(1337);
              }
            };
          `,
          'dist/test/some.e2e.js': `
            it("should write to body", () => {
              browser.ignoreSynchronization = true;
              browser.get("http://localhost:1337");
              expect(element(by.css("body")).getText()).toEqual("roy");
            });
          `,
          'node_modules/client/dist/app.bundle.js': `document.body.innerHTML = "roy";`,
          'package.json': fx.packageJson({clientProjectName: 'client'})
        })
        .execute('test', ['--protractor']);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contains('Running E2E with Protractor');
      // note: we've setup a real integration, keep it in order
      // to see the full integration between server and client.
      expect(res.stdout).to.contain('1 spec, 0 failures');
    });

    it('should not run protractor if protractor.conf is not present', () => {
      const res = test
        .setup({
          'package.json': fx.packageJson()
        })
        .execute('test', ['--protractor']);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.not.contains('Running E2E with Protractor');
    });
  });

  describe('--jest', () => {
    it('should pass with exit code 0', () => {
      const res = test
        .setup({
          '__tests__/foo.js': `
            describe('Foo', () => {
              jest.mock('../foo');
              const foo = require('../foo');
              it('should return value', () => {
                // foo is a mock function
                foo.mockImplementation(() => 42);
                expect(foo()).toBe(42);
              });
            });
          `,
          'foo.js': `module.exports = function() {
              // some implementation;
            };`,
          'package.json': fx.packageJson()
        })
        .execute('test', ['--jest']);
      console.log(res);
      expect(res.code).to.equal(0);
      expect(res.stderr).to.contain('1 passed');
    });

    it('should fail with exit code 1', () => {
      const res = test
        .setup({
          '__tests__/foo.js': `
            describe('Foo', () => {
              jest.mock('../foo');
              const foo = require('../foo');
              it('should return value', () => {
                // foo is a mock function
                foo.mockImplementation(() => 42);
                expect(foo()).toBe(41);
              });
            });
          `,
          'foo.js': `module.exports = function() {
              // some implementation;
            };`,
          'package.json': fx.packageJson()
        })
        .execute('test', ['--jest']);
      console.log(res);
      expect(res.code).to.equal(1);
      expect(res.stderr).to.contain('1 failed');
    });

    it('should use the right reporter when running inside TeamCity', () => {
      const res = test
        .setup({
          '__tests__/foo.js': `
            describe('Foo', () => {
              jest.mock('../foo');
              const foo = require('../foo');
              it('should return value', () => {
                // foo is a mock function
                foo.mockImplementation(() => 42);
                expect(foo()).toBe(42);
              });
            });
          `,
          'foo.js': `module.exports = function() {
              // some implementation;
            };`,
          'package.json': `{
            "name": "a",\n
            "dependencies": {\n
              "jest-teamcity-reporter": "latest"\n
            }
          }`
        }, [hooks.installDependencies])
        .execute('test', ['--jest'], insideTeamCity);
      console.log(res);
      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('##teamcity[');
    });

    it('should work load jest configuration and work with css', () => {
      const res = test
        .setup({
          '__tests__/foo.js': `
            describe('Foo', () => {
              jest.mock('../foo');
              const foo = require('../foo');
              it('should return value', () => {
                // foo is a mock function
                foo.mockImplementation(() => 42);
                expect(foo()).toBe(42);
              });
            });
          `,
          'foo.js': `
            const s = require('./foo.scss');
            module.exports = function() {
              const a = s.a;
            };`,
          'foo.scss': `.a {.b {color: red;}}`,
          'package.json': `{
            "name": "a",\n
            "jest": {
              "moduleNameMapper": {
                ".scss$": "identity-obj-proxy"
              }
            },
            "devDependencies": {
              "identity-obj-proxy": "^3.0.0"
            }
          }`
        }, [hooks.installDependencies])
        .execute('test', ['--jest']);
      console.log(res);
      expect(res.code).to.equal(0);
      expect(res.stderr).to.contain('1 passed');
    });
  });

  describe('--mocha', () => {
    it('should pass with exit code 0', () => {
      // the way we detect that Mocha runs is by using it.only,
      // jasmine does not expose such a property.
      const res = test
        .setup({
          'test/some.spec.js': `it.only("pass", () => 1);`,
          'package.json': fx.packageJson()
        }, [tmp => hooks.installDependency(tmp)('babel-register')])
        .execute('test', ['--mocha']);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('1 passing');
    });

    it('should mock scss/css files to always return a string as the prop name', function () {
      this.timeout(30000);

      const res = test
        .setup({
          'src/some.scss': '',
          'src/some.spec.js': `
            const assert = require('assert');
            const css = require('./some.scss');
            const cssWithDefault = require('./some.scss').default;

            it("pass", () => assert.equal(css.hello, 'hello'));
            it("pass with default", () => assert.equal(cssWithDefault.hello, 'hello'));
          `,
          'package.json': fx.packageJson()
        }, [tmp => hooks.installDependency(tmp)('babel-register')])
        .execute('test', ['--mocha']);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('2 passing');
    });

    it('should load graphql files', function () {
      this.timeout(30000);

      const res = test
        .setup({
          'src/getData1.graphql': 'query GetData1 { id, name }',
          'src/getData2.gql': 'query GetData2 { id, name }',
          'src/some.spec.js': `
            const assert = require('assert');
            const getData1 = require('./getData1.graphql');
            const getData2 = require('./getData2.gql');

            it("pass", () => assert.equal(getData1.kind, 'Document'));
            it("pass", () => assert.equal(getData2.kind, 'Document'));
          `,
          'package.json': fx.packageJson()
        })
        .execute('test', ['--mocha']);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('2 passing');
    });

    it('should fail with exit code 1', function () {
      this.timeout(60000);

      const res = test
        .setup({
          'test/some.spec.js': `it("fail", () => { throw new Error() });`,
          'package.json': fx.packageJson()
        }, [tmp => hooks.installDependency(tmp)('babel-register')])
        .execute('test', ['--mocha']);

      expect(res.code).to.be.above(0);
      expect(res.stdout).to.contain('1 failing');
    });

    it('should consider custom globs if configured', () => {
      const res = test
        .setup({
          'some/other.glob.js': `it("pass", () => 1);`,
          'package.json': fx.packageJson({
            specs: {
              node: 'some/*.glob.js'
            }
          })
        }, [tmp => hooks.installDependency(tmp)('babel-register')])
        .execute('test', ['--mocha']);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('1 passing');
    });

    it('should run specs from test/app/src by default', () => {
      const res = test
        .setup({
          'test/bla/comp.spec.js': `it("pass", () => 1);`,
          'app/bla/comp.spec.js': `it("pass", () => 1);`,
          'src/bla/comp.spec.js': `it("pass", () => 1);`,
          'package.json': fx.packageJson()
        }, [tmp => hooks.installDependency(tmp)('babel-register')])
        .execute('test', ['--mocha']);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('3 passing');
    });

    it('should pass while requiring css', () => {
      const res = test
        .setup({
          'dist/components/some.css': `.my-class {color: red}`,
          'dist/components/some.js': `require('./some.css');`,
          'dist/components/some.spec.js': `require('./some.js');it.only("pass", () => 1);`,
          'package.json': fx.packageJson({
            specs: {
              node: 'dist/**/*.spec.js'
            }
          })
        }, [tmp => hooks.installDependency(tmp)('babel-register')])
        .execute('test', ['--mocha']);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('1 passing');
    });

    it('should use the right reporter when running inside TeamCity', () => {
      const res = test
        .setup({
          'test/some.spec.js': `it.only("pass", () => 1);`,
          'package.json': fx.packageJson()
        }, [tmp => hooks.installDependency(tmp)('babel-register')])
        .execute('test', ['--mocha'], insideTeamCity);

      console.log(res.stdout);
      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('##teamcity[');
    });

    describe('with babel-register', () => {
      it('should transpile both sources and specified 3rd party modules in runtime', function () {
        const res = test
          .setup({
            '.babelrc': `{"plugins": ["babel-plugin-transform-es2015-modules-commonjs"]}`,
            'node_modules/wix-style-react/src/index.js': 'export default 1',
            'test/some.js': `import x from 'wix-style-react/src'; export default x => x`,
            'test/some.spec.js': `import identity from './some'; it.only("pass", () => 1);`,
            'package.json': `{
              "name": "a",\n
              "dependencies": {\n
                "babel-plugin-transform-es2015-modules-commonjs": "latest"\n
              }
            }`
          }, [hooks.installDependencies])
          .execute('test', ['--mocha']);

        expect(res.code).to.equal(0);
        expect(res.stdout).to.contain('1 passing');
      });

      it('should transpile explicitly configured externalUnprocessedModules', function () {
        const res = test
          .setup({
            '.babelrc': `{"plugins": ["babel-plugin-transform-es2015-modules-commonjs"]}`,
            'node_modules/my-unprocessed-module/index.js': 'export default 1',
            'test/some.js': `import x from 'my-unprocessed-module'; export default x => x`,
            'test/some.spec.js': `import identity from './some'; it.only("pass", () => 1);`,
            'package.json': `{
              "name": "a",\n
              "dependencies": {\n
                "babel-plugin-transform-es2015-modules-commonjs": "latest"\n
              },
              "yoshi": {
                "externalUnprocessedModules": ["my-unprocessed-module"]
              }
            }`
          }, [hooks.installDependencies])
          .execute('test', ['--mocha']);

        expect(res.code).to.equal(0);
        expect(res.stdout).to.contain('1 passing');
      });
    });

    it('should run typescript tests with runtime compilation for ts projects', () => {
      const res = test
        .setup({
          'tsconfig.json': fx.tsconfig(),
          'test/some.spec.ts': `declare var it: any; it.only("pass", () => 1);`,
          'package.json': fx.packageJson()
        }, [tmp => hooks.installDependency(tmp)('ts-node')])
        .execute('test', ['--mocha']);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('1 passing');
    });

    it('should not transpile tests if no tsconfig/.babelrc/babel configuration', () => {

      const res = test
        .setup({
          'test/some.js': 'export default x => x',
          'test/some.spec.js': `import identity from './some'; it.only("pass", () => 1);`,
          'package.json': `{
              "name": "a",\n
              "version": "1.0.4"
            }`
        })
        .execute('test', ['--mocha']);

      expect(res.code).to.equal(1);
      expect(res.stderr).to.contain('Unexpected token import');
    });

    it('should require "test/mocha-setup.js" configuration file', () => {
      const res = test
        .setup({
          'test/mocha-setup.js': 'global.foo = 123',
          'test/some.spec.js': `
            const assert = require('assert');
            it("pass", () => assert.equal(global.foo, 123))`,
          'package.json': fx.packageJson()
        })
        .execute('test', ['--mocha']);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('1 passing');
    });

    it('should require "test/mocha-setup.ts" configuration file', () => {
      const res = test
        .setup({
          'test/mocha-setup.ts': 'global["foo"] = 123;',
          'tsconfig.json': fx.tsconfig(),
          'test/some.spec.ts': `
            const assert = require('assert');
            it("pass", () => assert.equal(global["foo"], 123));`,
          'package.json': fx.packageJson()
        }, [tmp => hooks.installDependency(tmp)('ts-node'), tmp => hooks.installDependency(tmp)('@types/node'), tmp => hooks.installDependency(tmp)('@types/mocha')])
        .execute('test', ['--mocha']);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('1 passing');
    });
  });

  describe('--jasmine', () => {
    it('should pass with exit code 0', () => {
      // the way we detect that Jasmine runs is by using expect() at the spec,
      // mocha does not expose such a method.
      const res = test
        .setup(passingJasmineTest())
        .execute('test', ['--jasmine']);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('1 spec, 0 failures');
    });

    it('should pass with exit code 1', () => {
      const res = test
        .setup(failingJasmineTest())
        .execute('test', ['--jasmine']);

      expect(res.code).to.equal(1);
      expect(res.stdout).to.contain('1 spec, 1 failure');
    });

    it('should consider custom globs if configured', () => {
      const res = test
        .setup({
          'some/other.glob.js': `it("should pass", () => 1);`,
          'package.json': fx.packageJson({
            specs: {
              node: 'some/*.glob.js'
            }
          })
        })
        .execute('test', ['--jasmine']);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('1 spec, 0 failures');
    });

    it('should use the right reporter when running inside TeamCity', () => {
      const res = test
        .setup(passingJasmineTest())
        .execute('test', ['--jasmine'], insideTeamCity);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('##teamcity[progressStart \'Running Jasmine Tests\']');
    });
  });

  describe('--karma', function () {
    this.timeout(60000);

    describe('with jasmine configuration', () => {
      it('should pass with exit code 0', () => {
        const res = test
          .setup({
            'src/test.spec.js': 'it("pass", function () { expect(1).toBe(1); });',
            'karma.conf.js': fx.karmaWithJasmine(),
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .execute('test', ['--karma']);

        expect(res.code).to.equal(0);
        expect(res.stdout).to.contain(`Finished 'karma'`);
        expect(res.stdout).to.contain('Executed 1 of 1 SUCCESS');
      });

      it('should exit with code 1 in case webpack fails', () => {
        const res = test
          .setup({
            'src/client.spec.js': `require('./ballsack');`,
            'karma.conf.js': fx.karmaWithJasmine(),
            'package.json': fx.packageJson()
          })
          .execute('test', ['--karma']);

        expect(res.code).to.equal(1);
        expect(res.stdout).to.contain(`Module not found: Error: Cannot resolve 'file' or 'directory' ./ballsack`);
        expect(res.stdout).not.to.contain(`Finished 'karma'`);
      });

      it('should fail with exit code 1', () => {
        const res = test
          .setup({
            'src/test.spec.js': 'it("fail", function () { expect(1).toBe(2); });',
            'karma.conf.js': fx.karmaWithJasmine(),
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .execute('test', ['--karma']);

        expect(res.code).to.equal(1);
        expect(res.stdout).to.contain(`Failed 'karma'`);
        expect(res.stdout).to.contain('1 FAILED');
      });

      it('should attach phantomjs-polyfill', () => {
        const res = test
          .setup({
            'node_modules/phantomjs-polyfill/bind-polyfill.js': 'var a = 1;',
            'karma.conf.js': fx.karmaWithJasmine(),
            'src/test.spec.js': 'it("pass", function () { expect(a).toBe(1); });',
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .execute('test', ['--karma']);

        expect(res.stdout).to.contain('Executed 1 of 1 SUCCESS');
      });

      it('should load local karma config', () => {
        const res = test
          .setup({
            'karma.conf.js': 'module.exports = {frameworks: ["jasmine"], files: ["a.js", "a1.js"], exclude: ["a1.js"]}',
            'a.js': '"use strict";var a = {first: 1}',
            'a1.js': 'a.second = 1',
            'src/test.spec.js': 'it("pass", function () { expect(a.first).toBe(1);expect(a.second).not.toBeDefined(); });',
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .execute('test', ['--karma']);

        expect(res.stdout).to.contain('Executed 1 of 1 SUCCESS');
      });

      it('should load local config files first and then base config files', function () {
        const res = test
          .setup({
            'node_modules/phantomjs-polyfill/bind-polyfill.js': 'a = 1;', //This is a base config file (cannot mock it)
            'karma.conf.js': 'module.exports = {frameworks: ["jasmine"], files: ["a.js"]}',
            'a.js': '"use strict";var a = 2; var b = 3;',
            'src/test.spec.js': 'it("pass", function () { expect(a).toBe(1);expect(b).toBe(3); });',
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .execute('test', ['--karma']);

        expect(res.stdout).to.contain('Executed 1 of 1 SUCCESS');
      });
    });

    describe('with default (mocha) configuration', () => {
      it('should pass with exit code 0', () => {
        const res = test
          .setup(passingMochaTest())
          .execute('test', ['--karma']);

        expect(res.code).to.equal(0);
        expect(res.stdout)
          .to.contain(`Finished 'karma'`)
          .and.contain('Executed 1 of 1 SUCCESS');
      });

      it('should use appropriate reporter for TeamCity', () => {
        const res = test
          .setup(passingMochaTest())
          .execute('test', ['--karma'], insideTeamCity);

        expect(res.code).to.equal(0);
        expect(res.stdout)
          .to.contain(`Finished 'karma'`)
          .and.contain('##teamcity[testStarted name=\'should just pass\']');
      });
    });

    describe('with mocha configuration', () => {
      it('should pass with exit code 0', () => {
        const res = test
          .setup({
            'src/test.spec.js': 'it.only("pass", function () {});',
            'karma.conf.js': 'module.exports = {frameworks: ["mocha"]}',
            'package.json': fx.packageJson()
          })
          .execute('test', ['--karma']);

        expect(res.code).to.equal(0);
        expect(res.stdout).to.contain(`Finished 'karma'`);
        expect(res.stdout).to.contain('Executed 1 of 1 SUCCESS');
      });

      it.skip('should fail with exit code 1', () => {
        const res = test
          .setup({
            'src/test.spec.js': 'it("fail", function () { throw new Error(); });',
            'karma.conf.js': 'module.exports = {frameworks: ["mocha"]}',
            'package.json': fx.packageJson()
          })
          .execute('test', ['--karma']);

        expect(res.code).to.equal(1);
        expect(res.stdout).to.contain(`Finished 'karma'`);
        expect(res.stdout).to.contain('Executed 1 of 1 (1 FAILED)');
      });
    });

    describe('Specs Bundle', () => {
      it('should generate a bundle', () => {
        const res = test
            .setup({
              'src/test.spec.js': 'it("pass", function () { expect(1).toBe(1); });',
              'src/test1.spec.js': 'it("pass", function () { expect(2).toBe(2); });',
              'karma.conf.js': fx.karmaWithJasmine(),
              'package.json': fx.packageJson()
            })
            .execute('test', ['--karma']);

        expect(res.code).to.equal(0);
        expect(test.content('dist/specs.bundle.js')).to.contain('expect(1).toBe(1);');
        expect(test.content('dist/specs.bundle.js')).to.contain('expect(2).toBe(2);');
      });

      it('should consider custom specs.browser globs if configured', () => {
        const res = test
            .setup({
              'some/other/app.glob.js': 'it("pass", function () { expect(1).toBe(1); });',
              'some/other/app2.glob.js': 'it("pass", function () { expect(2).toBe(2); });',
              'karma.conf.js': fx.karmaWithJasmine(),
              'pom.xml': fx.pom(),
              'package.json': fx.packageJson({
                specs: {
                  browser: 'some/other/*.glob.js'
                }
              })
            })
            .execute('test', ['--karma']);

        expect(res.code).to.equal(0);
        expect(test.content('dist/specs.bundle.js')).to.contain('expect(1).toBe(1);');
        expect(test.content('dist/specs.bundle.js')).to.contain('expect(2).toBe(2);');
      });

      it('should not include css into a specs bundle', () => {
        const res = test
          .setup({
            'src/style.scss': `.a {.b {color: red;}}`,
            'src/client.js': `require('./style.scss'); module.exports = function (a) {return a + 1;};`,
            'src/client.spec.js': `const add1 = require('./client'); it('pass', function () {expect(add1(1)).toBe(2);});`,
            'karma.conf.js': fx.karmaWithJasmine(),
            'package.json': fx.packageJson({separateCss: false})
          })
          .execute('test', ['--karma']);
        expect(res.code).to.equal(0);
        expect(test.content('dist/specs.bundle.js')).not.to.contain('.a .b');
      });

      it('should contain css modules inside specs bundle', () => {
        const res = test
          .setup({
            'src/style.scss': `.module {color: red;}`,
            'src/client.js': `var style = require('./style.scss'); module.exports = function () {return style.module;};`,
            'src/client.spec.js': `const getModule = require('./client'); it('pass', function () {expect(getModule()).toContain('style__module__');});`,
            'karma.conf.js': fx.karmaWithJasmine(),
            'package.json': fx.packageJson({cssModules: true})
          })
          .execute('test', ['--karma']);
        expect(res.code).to.equal(0);
      });

      it('should allow import sass from node_modules', () => {
        const res = test
          .setup({
            'src/client.spec.js': `require('./foo.css'); it('pass', function () {expect(1).toBe(1);});`,
            'src/foo.css': '@import "bar/bar";',
            'node_modules/bar/bar.scss': '.bar{color:red}',
            'karma.conf.js': fx.karmaWithJasmine(),
            'package.json': fx.packageJson(),
          })
          .execute('test', ['--karma']);

        expect(res.code).to.equal(0);
      });

      it('should support TPA style params', () => {
        const res = test
          .setup({
            'src/client.spec.js': `require('./foo.css'); it('pass', function () {expect(1).toBe(1);});`,
            'src/foo.css': '.foo{color: unquote("{{color-1}}");font: unquote("; {{body-m}}");font-size: 16px;}',
            'karma.conf.js': fx.karmaWithJasmine(),
            'package.json': fx.packageJson({
              tpaStyle: true
            }),
          })
          .execute('test', ['--karma']);
        expect(res.code).to.equal(0);
      });
    });
  });
});

function passingJasmineTest() {
  return {
    'test/some.spec.js': 'it("should pass", function () { expect(1).toBe(1); });',
    'package.json': fx.packageJson()
  };
}

function failingJasmineTest() {
  return {
    'test/some.spec.js': 'it("should fail", () => expect(1).toBe(2));',
    'package.json': fx.packageJson()
  };
}

function passingMochaTest() {
  return {
    'src/test.spec.js': `it('should just pass', function () {});`,
    'package.json': fx.packageJson()
  };
}
