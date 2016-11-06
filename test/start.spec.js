'use strict';

const _ = require('lodash/fp');
const expect = require('chai').expect;
const psTree = require('ps-tree');
const tp = require('./helpers/test-phases');
const fx = require('./helpers/fixtures');
const fetch = require('node-fetch');
const retryPromise = require('retry-promise').default;
const hooks = require('./helpers/hooks');
const {outsideTeamCity} = require('./helpers/env-variables');
const {readFileSync} = require('fs');

describe('Aggregator: start', () => {
  let test, child;

  beforeEach(() => {
    test = tp.create();
    child = null;
  });

  afterEach(done => {
    test.teardown();
    killSpawnProcessAndHidChildren(done);
  });

  describe('tests', function () {
    it('should run tests initially', () => {
      child = test
        .setup({
          'src/test.spec.js': '',
          'src/client.js': '',
          'entry.js': '',
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .spawn('start');

      return checkServerLogCreated().then(() =>
        expect(test.stdout).to.contains('Testing with Mocha')
      );
    });
  });

  describe('--entry-point', () => {
    it('should run the entry point provided', () => {
      child = test
        .setup({
          'src/client.js': '',
          'entry.js': `console.log('hello world!')`,
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .spawn('start', '--entry-point=entry');

      return checkServerLogCreated().then(() =>
        expect(test.content('target/server.log')).to.contains('hello world!')
      );
    });

    it('should run index.js by default', () => {
      child = test
        .setup({
          'src/client.js': '',
          'index.js': `console.log('hello world!')`,
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()
        })
        .spawn('start');

      return checkServerLogCreated().then(() =>
        expect(test.content('target/server.log')).to.contains('hello world!')
      );
    });
  });

  describe('--no-server', () => {
    it('should not start a server if --no-server is passed', () => {
      child = test
        .setup({
          'src/assets/image.png': '',
          'index.js': `console.log('should not run');`,
          'package.json': fx.packageJson({servers: {cdn: {port: 3005}}})
        })
        .spawn('start', ['--no-server']);

      return cdnIsServing('assets/image.png')
        .then(() => expect(test.stdout).not.to.contain('should not run'));
    });
  });

  describe('--hot', () => {
    it('should create bundle with enabled hot module replacement', () => {
      child = test
        .setup({
          'src/client.js': `console.log('client-content');`,
          'index.js': `console.log('should run');`,
          'package.json': fx.packageJson({servers: {cdn: {port: 3005}}})
        })
        .spawn('start', ['--hot']);

      return cdnIsServing('app.bundle.js')
        .then(file => {
          file = file.replace(/\s+/g, ' ');
          expect(file)
            .to.include(`if (false) { throw new Error("[HMR] Hot Module Replacement is disabled."); }`)
            .and.include(`console.log('client-content');`)
            .and.not.include('Cannot find module');
        });
    });
  });

  describe('CDN server', () => {
    it('should run cdn server with default dir', () => {
      child = test
        .setup({
          'src/assets/test.json': '{a: 1}',
          'src/index.js': 'var a = 1;',
          'package.json': fx.packageJson({servers: {cdn: {port: 3005}}})
        })
        .spawn('start');

      return cdnIsServing('assets/test.json');
    });

    it('should run cdn server with configured dir', () => {
      child = test
        .setup({
          'src/assets/test.json': '{a: 1}',
          'src/index.js': 'var a = 1;',
          'package.json': fx.packageJson({servers: {cdn: {port: 3005, dir: 'dist/statics'}}})
        })
        .spawn('start');

      return cdnIsServing('assets/test.json');
    });

    it('should run cdn server from node_modules, on n-build project, using default dir', () => {
      child = test
        .setup({
          'node_modules/my-client-project/dist/test.json': '{a: 1}',
          'src/index.js': 'var a = 1;',
          'package.json': fx.packageJson({clientProjectName: 'my-client-project', servers: {cdn: {port: 3005}}})
        })
        .spawn('start');

      return cdnIsServing('test.json');
    });

    it('should run cdn server from node_modules, on n-build project, using configured dir', () => {
      child = test
        .setup({
          'node_modules/my-client-project/dist/statics/test.json': '{a: 1}',
          'src/index.js': 'var a = 1;',
          'package.json': fx.packageJson({clientProjectName: 'my-client-project', servers: {cdn: {port: 3005, dir: 'dist/statics'}}})
        })
        .spawn('start');

      return cdnIsServing('test.json');
    });

    it('should support cross origin requests headers', () => {
      child = test
        .setup({
          'package.json': fx.packageJson()
        })
        .spawn('start');


      return fetchCDN().then(res => {
        expect(res.headers.get('Access-Control-Allow-Methods')).to.equal('GET, OPTIONS');
        expect(res.headers.get('Access-Control-Allow-Origin')).to.equal('*');
      });
    });
  });

  describe('Watch', function () {
    this.timeout(30000);

    describe('when using typescript', () => {
      it(`should rebuild and restart server after a file has been changed with typescript files`, () => {
        child = test
          .setup({
            'target/server.log': '', // TODO: understand why test fails with Error: ENOENT: no such file or directory, open 'target/server.log'
            'tsconfig.json': fx.tsconfig(),
            'src/server.ts': `declare var require: any; ${fx.httpServer('hello')}`,
            'src/config.ts': '',
            'src/client.ts': '',
            'index.js': `require('./dist/src/server')`,
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .spawn('start');

        return checkServerIsUp({max: 100})
          .then(() => checkServerIsRespondingWith('hello'))
          .then(() => test.modify('src/server.ts', `declare var require: any; ${fx.httpServer('world')}`))
          .then(() => checkServerIsRespondingWith('world'));
      });
    });

    describe('when using es6', () => {
      it(`should rebuild and restart server after a file has been changed`, () => {
        child = test
          .setup({
            'src/server.js': fx.httpServer('hello'),
            'src/config.js': '',
            'src/client.js': '',
            'index.js': `require('./src/server')`,
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .spawn('start');

        return checkServerIsUp()
          .then(() => checkServerIsRespondingWith('hello'))
          .then(() => test.modify('src/server.js', fx.httpServer('world')))
          .then(() => checkServerIsRespondingWith('world'));
      });
    });

    it.skip('should make a new bundle after the file has beend changed', () => {
      test.setup({
        'index.js': fx.httpServer(),
        'src/client.js': 'require(\'./menu\').create();',
        'src/client.spec.js': 'require(\'./menu\').create();',
        'src/menu.js': 'module.exports.create = function () {console.log(\'Initializing the menu!\')}',
        'package.json': fx.pkgJsonWithBuild()
      }, [hooks.linkWixNodeBuild]).execute('build', '--bundle');
      child = test.spawn('start', '-w');

      return checkServerIsUp()
        .then(() => test.modify('src/client.js', content => 'const menu = ' + content))
        .then(() => checkServerRestarted())
        .then(() => {
          expect(test.content('dist/statics/main.bundle.js')).to.contain('const menu =');
          expect(test.list('dist')).to.contain('specs.bundle.js');
        });
    });
  });

  it('should update .nvmrc to relevant version as shown in dockerfile', () => {
    const nodeVersion = readFileSync(require.resolve('../templates/.nvmrc'), {encoding: 'utf-8'});
    child = test
      .setup({
        'src/test.spec.js': '',
        'src/client.js': '',
        'entry.js': '',
        'package.json': fx.packageJson(),
        'pom.xml': fx.pom()
      })
      .spawn('start', [], outsideTeamCity);

    return checkServerLogCreated().then(() =>
      expect(test.content('.nvmrc')).to.equal(nodeVersion)
    );
  });

  describe('Clean', () => {
    ['dist', 'target'].forEach(folderName =>
      it(`should remove "${folderName}" folder before building`, () => {
        child = test
          .setup({
            [`${folderName}/src/old.js`]: `const hello = "world!";`,
            'src/new.js': 'const world = "hello!";',
            'package.json': fx.packageJson()
          })
          .spawn('start');

        return checkServerLogCreated().then(() => {
          expect(test.stdout).to.contains(`Cleaning up '${folderName}'...`);
          expect(test.list(folderName)).to.not.include('old.js');
          expect(test.list('dist/src')).to.include('new.js');
        });
      })
    );
  });

  describe('when there are runtime errors', () => {
    it('should display a warning message on the terminal', () => {
      child = test
        .setup({
          'index.js': `throw new Error('wix:error')`,
          'package.json': fx.packageJson(),
          'pom.xml': fx.pom()

        })
        .spawn('start');

      return checkServerLogCreated()
        .then(wait(1000))
        .then(() => expect(test.stdout).to.contains(`There are errors! Please check ./target/server.log`));
    });
  });

  function killSpawnProcessAndHidChildren(done) {
    if (!child) {
      return done();
    }

    const pid = child.pid;

    psTree(pid, (err /*eslint handle-callback-err: 0*/, children) => {
      [pid].concat(children.map(p => p.PID)).forEach(tpid => {
        try {
          process.kill(tpid, 'SIGKILL');
        } catch (e) {}
      });

      child = null;
      done();
    });
  }

  function checkServerLogCreated() {
    return retryPromise({backoff: 100}, () =>
      test.contains('target/server.log') ?
        Promise.resolve() :
        Promise.reject()
    );
  }

  function fetchCDN(port) {
    port = port || 3200;
    return retryPromise({backoff: 100}, () => fetch(`http://localhost:${port}/`));
  }

  function cdnIsServing(name) {
    return retryPromise({backoff: 100}, () =>
      fetch(`http://localhost:3005/${name}`)
        .then(res => {
          expect(res.status).to.equal(200);
          return res.text();
        })
    );
  }

  function checkServerIsRespondingWith(expected) {
    return retryPromise({backoff: 1000}, () =>
      fetch(`http://localhost:6666/`)
        .then(res => res.text())
        .then(body => body === expected ? Promise.resolve() : Promise.reject())
    );
  }

  function checkServerIsUp(opts) {
    return retryPromise(_.merge({backoff: 100}, opts), () =>
      fetch(`http://localhost:6666/`)
    );
  }

  function checkServerIsDown() {
    return retryPromise({backoff: 10}, () =>
      new Promise((resolve, reject) => {
        fetch('http://localhost:6666/').then(reject, resolve);
      }));
  }

  function checkServerRestarted() {
    return checkServerIsDown().then(() => checkServerIsUp());
  }

  function wait(time) {
    return () => new Promise(resolve => setTimeout(resolve, time));
  }
});
