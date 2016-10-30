'use strict';

const expect = require('chai').expect;
const tp = require('./helpers/test-phases');
const fx = require('./helpers/fixtures');
const outsideTeamCity = {TEAMCITY_VERSION: undefined, BUILD_NUMBER: undefined};
const insideTeamCity = {TEAMCITY_VERSION: 1};
const hooks = require('./helpers/hooks');

describe('Aggregator: Test', () => {
  let test;
  beforeEach(() => {
    test = tp.create(outsideTeamCity);
  });
  afterEach(() => test.teardown());

  describe('defaults', () => {
    it('should pass with exit code 0 with mocha as default', () => {
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
      expect(res.stdout).to.contain('Testing with Mocha');
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

    it('should fail with exit code 1', () => {
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

    it('should run typescript tests with runtime complilation for ts projects', () => {
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

      console.log(test.list('test'));
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
            'karma.conf.js': 'module.exports = {frameworks: ["jasmine"]}',
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .execute('test', ['--karma']);

        expect(res.code).to.equal(0);
        expect(res.stdout).to.contain('Testing with Karma');
        expect(res.stdout).to.contain('Executed 1 of 1 SUCCESS');
      });

      it('should fail with exit code 1', () => {
        const res = test
          .setup({
            'src/test.spec.js': 'it("fail", function () { expect(1).toBe(2); });',
            'karma.conf.js': 'module.exports = {frameworks: ["jasmine"]}',
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .execute('test', ['--karma']);

        expect(res.code).to.equal(1);
        expect(res.stdout).to.contain('Testing with Karma');
        expect(res.stdout).to.contain('1 FAILED');
      });

      it('should attach phantomjs-polyfill', () => {
        const res = test
          .setup({
            'node_modules/phantomjs-polyfill/bind-polyfill.js': 'var a = 1;',
            'karma.conf.js': 'module.exports = {frameworks: ["jasmine"]}',
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
          .setup({
            'src/test.spec.js': 'it.only("pass", function () {});',
            'karma.conf.js': 'module.exports = {}',
            'package.json': fx.packageJson()
          })
          .execute('test', ['--karma']);

        expect(res.code).to.equal(0);
        expect(res.stdout).to.contain('Testing with Karma');
        expect(res.stdout).to.contain('Executed 1 of 1 SUCCESS');
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
        expect(res.stdout).to.contain('Testing with Karma');
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
        expect(res.stdout).to.contain('Testing with Karma');
        expect(res.stdout).to.contain('Executed 1 of 1 (1 FAILED)');
      });
    });

    describe('Specs Bundle', () => {
      it('should generate a bundle', () => {
        const res = test
            .setup({
              'src/test.spec.js': 'it("pass", function () { expect(1).toBe(1); });',
              'src/test1.spec.js': 'it("pass", function () { expect(2).toBe(2); });',
              'karma.conf.js': 'module.exports = {frameworks: ["jasmine"]}',
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
              'karma.conf.js': 'module.exports = {frameworks: ["jasmine"]}',
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

      it.skip('should generate a bundle with css', () => {
        const res = test
            .setup({
              'src/client.js': `require('./style.css');const add1 = a => {return a + 1;};module.exports = add1;`,
              'src/app.spec.js': `const add1 = require('./client');const a = add1(2);`,
              'src/style.scss': `.a {.b {color: red;}}`,
              'package.json': fx.packageJson({separateCss: false})
            })
            .execute('build', ['--bundle']);

        expect(res.code).to.equal(0);
        expect(test.content('dist/specs.bundle.js')).to.contain('.a .b');
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
