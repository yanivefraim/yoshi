module.exports = function (wallaby) {
  const wallabyCommon = require('./wallaby-common')(wallaby);
  wallabyCommon.testFramework = 'mocha';
  wallabyCommon.setup = () => {
    require('babel-polyfill');
    const mocha = wallaby.testFramework;
    mocha.timeout(30000);
    require('yoshi/lib/setup/mocha-setup');
  };
  return wallabyCommon;
};
