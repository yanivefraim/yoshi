module.exports = function (wallaby) {
  const wallabyCommon = require('./wallaby-common')(wallaby);
  wallabyCommon.testFramework = 'mocha';
  wallabyCommon.setup = () => {
    require('babel-polyfill');
    const mocha = wallaby.testFramework;
    mocha.timeout(30000);
    require('wix-node-build/lib/ignore-extensions');
    try {
      require('./test/mocha-setup');
    } catch (e) {
      console.log('warning - no mocha setup file found: test/mocha-setup');
    }
  };
  return wallabyCommon;
};
