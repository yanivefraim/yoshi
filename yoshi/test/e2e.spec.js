'use strict';

const expect = require('chai').expect;
const tp = require('./helpers/test-phases');
const fx = require('./helpers/fixtures');
const hooks = require('./helpers/hooks');
const {outsideTeamCity, insideTeamCity} = require('./helpers/env-variables');

describe('Aggregator: e2e', () => {
  let test;
  beforeEach(() => {
    test = tp.create();
  });
  afterEach(() => test.teardown());

  describe('should run protractor with a cdn server', function () {
    this.timeout(60000);

    it('should support single module structure by default', () => {
      const res = test
        .setup(singleModuleWithJasmine(), [hooks.installProtractor])
        .execute('test', ['--protractor'], outsideTeamCity);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('Running E2E with Protractor');
      // note: we've setup a real integration, keep it in order
      // to see the full integration between server and client.
      expect(res.stdout).to.contain('1 spec, 0 failures');
    });

    it('should take a screenshot at the end of a failing test', () => {
      const res = test
        .setup(singleModuleWithFailingJasmine(), [hooks.installProtractor])
        .execute('test', ['--protractor'], outsideTeamCity, {silent: true}); // run in silent so that TC won't fail with the screenshot log

      expect(res.code).to.equal(1);
      expect(res.stdout).to.contain('Running E2E with Protractor');
      expect(res.stdout).to.contain('1 spec, 1 failure');
      expect(res.stdout).to.contain('Screenshot link:');
    });

    it(`should support multiple modules structure and consider clientProjectName configuration`, () => {
      const res = test
        .setup(multipleModuleWithJasmine(), [hooks.installProtractor])
        .execute('test', ['--protractor'], outsideTeamCity);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('Running E2E with Protractor');
      expect(res.stdout).to.contain('1 spec, 0 failures');
    });

    it('should run protractor with mocha', () => {
      const res = test
        .setup(singleModuleWithMocha(), [hooks.installProtractor])
        .execute('test', ['--protractor'], outsideTeamCity);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('Running E2E with Protractor');
      expect(res.stdout).to.contain('1 passing (');
    });

    it('should run protractor with mocha and use TeamCity reporter', () => {
      const res = test
        .setup(singleModuleWithMocha(), [hooks.installProtractor])
        .execute('test', ['--protractor'], insideTeamCity);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('Running E2E with Protractor');
      expect(res.stdout).to.contain('##teamcity[testStarted name=\'should write some text to body\' captureStandardOutput=\'true\']');
    });

    it('should use babel-register', function () {
      this.timeout(60000);

      const res = test
        .setup(singleModuleWithJasmineAndES6Imports(), [hooks.installDependencies, hooks.installProtractor])
        .execute('test', ['--protractor'], outsideTeamCity);

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('Running E2E with Protractor');
      expect(res.stdout).to.contain('1 spec, 0 failures');
      // a dummy import in order to use es6 feature that is not supported by node env ootb
      expect(fx.e2eTestJasmineES6Imports()).to.contain(`import path from 'path'`);
    });
  });

  it('should not run protractor if protractor.conf is not present', () => {
    const res = test
      .setup({
        'package.json': fx.packageJson()
      })
      .execute('test', ['--protractor']);

    expect(res.code).to.equal(0);
    expect(res.stdout).to.contains('Protractor configurations file was not found, not running e2e.');
  });

  function cdnConfigurations() {
    return {
      servers: {
        cdn: {
          port: 6452
        }
      }
    };
  }

  function singleModuleWithJasmineAndES6Imports() {
    return Object.assign(singleModuleWithJasmine(), {
      'dist/test/subFolder/some.e2e.js': fx.e2eTestJasmineES6Imports(),
      'package.json': `{
          "name": "a",\n
          "version": "1.0.4",\n
          "yoshi": ${JSON.stringify(cdnConfigurations())},
          "dependencies": {
            "babel-plugin-transform-es2015-modules-commonjs": "latest"
          },
          "babel": { "plugins": ["transform-es2015-modules-commonjs"] }
        }`
    });
  }

  function singleModuleWithJasmine() {
    return {
      'protractor.conf.js': fx.protractorConf(),
      'dist/test/subFolder/some.e2e.js': fx.e2eTestJasmine(),
      'dist/statics/app.bundle.js': fx.e2eClient(),
      'package.json': fx.packageJson(cdnConfigurations())
    };
  }

  function singleModuleWithFailingJasmine() {
    return {
      'protractor.conf.js': fx.protractorConf(),
      'dist/test/subFolder/some.e2e.js': fx.e2eTestJasmineFailing(),
      'dist/statics/app.bundle.js': fx.e2eClient(),
      'package.json': fx.packageJson(cdnConfigurations())
    };
  }

  function multipleModuleWithJasmine() {
    return {
      'protractor.conf.js': fx.protractorConf(),
      'dist/test/some.e2e.js': fx.e2eTestJasmine(),
      'node_modules/client/dist/app.bundle.js': fx.e2eClient(),
      'package.json': fx.packageJson(
        Object.assign(cdnConfigurations(), {clientProjectName: 'client'})
      )
    };
  }

  function singleModuleWithMocha() {
    return {
      'protractor.conf.js': fx.protractorConf('mocha'),
      'dist/test/some.e2e.js': fx.e2eTestMocha(),
      'dist/statics/app.bundle.js': fx.e2eClient(),
      'package.json': fx.packageJson(
        Object.assign(cdnConfigurations())
      )
    };
  }
});
