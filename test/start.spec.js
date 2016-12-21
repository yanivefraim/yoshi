'use strict';

const _ = require('lodash/fp');
const express = require('express');
const {expect} = require('chai');
const psTree = require('ps-tree');
const tp = require('./helpers/test-phases');
const fx = require('./helpers/fixtures');
const fetch = require('node-fetch');
const retryPromise = require('retry-promise').default;
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

      return checkStdout('Testing with Mocha');
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
          'package.json': fx.packageJson(),
          '.babelrc': '{}'
        })
        .spawn('start', ['--no-server']);

      return cdnIsServing('assets/image.png')
        .then(() => expect(test.stdout).not.to.contain('should not run'));
    });
  });

  describe('HMR', () => {
    it('should create bundle with enabled hot module replacement', () => {
      child = test
        .setup({
          'src/client.js': `module.exports.wat = 'hmr';\n`,
          'package.json': fx.packageJson()
        })
        .spawn('start');

      return checkServerIsServing({port: 3200, file: 'app.bundle.js'})
        .then(content =>
          expect(content).and.contain(`if (false) {\n\t  throw new Error("[HMR] Hot Module Replacement is disabled.");`));
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

  describe('when the default port is taken', () => {
    let server;

    beforeEach(() => server = takePort(3000));
    afterEach(() => server.close());

    it('it should use the next available port', () => {
      child = test
        .setup({
          'index.js': `console.log('port', process.env.PORT)`,
          'package.json': fx.packageJson()
        })
        .spawn('start');

      return checkServerLogCreated()
        .then(() => expect(test.content('target/server.log')).to.contains('port 3001'));
    });
  });

  describe('Watch', function () {
    this.timeout(30000);

    describe('when using typescript', () => {
      it(`should rebuild and restart server after a file has been changed with typescript files`, () => {
        child = test
          .setup({
            'tsconfig.json': fx.tsconfig(),
            'src/server.ts': `declare var require: any; ${fx.httpServer('hello')}`,
            'src/config.ts': '',
            'src/client.ts': '',
            'index.js': `require('./dist/src/server')`,
            'package.json': fx.packageJson(),
            'pom.xml': fx.pom()
          })
          .spawn('start');

        return checkServerIsServing({max: 100})
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
            'pom.xml': fx.pom(),
            '.babelrc': '{}'
          })
          .spawn('start');

        return checkServerIsServing()
          .then(() => checkServerIsRespondingWith('hello'))
          .then(() => test.modify('src/server.js', fx.httpServer('world')))
          .then(() => checkServerIsRespondingWith('world'));
      });
    });

    describe('when using no transpile', () => {
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

        return checkServerIsServing()
          .then(() => checkServerIsRespondingWith('hello'))
          .then(() => test.modify('src/server.js', fx.httpServer('world')))
          .then(() => checkServerIsRespondingWith('world'));
      });
    });

    describe('client side code', () => {
      it('should recreate and serve a bundle after file changes', () => {
        const file = {port: 3200, file: 'app.bundle.js'};
        const newSource = `module.exports = 'wat';\n`;

        child = test
          .setup({
            'src/client.js': `module.exports = function () {};\n`,
            'package.json': fx.packageJson()
          })
          .spawn('start');

        return checkServerIsServing(file)
          .then(() => test.modify('src/client.js', newSource))
          .then(() => checkServerReturnsDifferentContent(file))
          .then(content => expect(content).to.contain(newSource));
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
            'package.json': fx.packageJson(),
            '.babelrc': '{}'
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

  function checkStdout(str) {
    return retryPromise({backoff: 100}, () =>
      test.stdout.indexOf(str) > -1 ?
        Promise.resolve() :
        Promise.reject()
    );
  }

  function takePort(port) {
    return express().listen(port);
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
      fetch(`http://localhost:${fx.defaultServerPort()}/`)
        .then(res => res.text())
        .then(body => body === expected ? Promise.resolve() : Promise.reject())
    );
  }

  function wait(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

  function checkServerIsServing({backoff = 100, max = 10, port = fx.defaultServerPort(), file = ''} = {}) {
    return retryPromise({backoff, max}, () => fetch(`http://localhost:${port}/${file}`).then(res => res.text()));
  }

  function checkServerReturnsDifferentContent({backoff = 100, max = 10, port = fx.defaultServerPort(), file = ''} = {}) {
    const url = `http://localhost:${port}/${file}`;
    let response;
    return retryPromise({backoff, max}, () => new Promise((resolve, reject) =>
      fetch(url)
        .then(res => res.text())
        .then(content => {
          if (response && response !== content) {
            resolve(content);
          } else {
            reject(`response of ${url} did not change`);
          }
          response = content;
        })
        .catch(reject)
    ));
  }
});
