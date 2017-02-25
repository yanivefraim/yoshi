module.exports = function (wallaby) {
  const wallabyCommon = require('./wallaby-common')(wallaby);
  wallabyCommon.testFramework = 'jest';
  wallabyCommon.setup = () => {
    wallaby.testFramework.configure(require('./package.json').jest);
    require('yoshi/lib/setup/mocha-setup');
  };
  return wallabyCommon;
};
