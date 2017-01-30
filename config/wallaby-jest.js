module.exports = function (wallaby) {
  const wallabyCommon = require('./wallaby-common')(wallaby);
  wallabyCommon.testFramework = 'jest';
  wallabyCommon.setup = () => {
    wallaby.testFramework.configure(require('./package.json').jest);
    require('wix-node-build/lib/ignore-extensions');
    try {
      require('./test/mocha-setup');
    } catch (e) {
      console.log('warning - no mocha setup file found: test/mocha-setup');
    }
  };
  return wallabyCommon;
};
