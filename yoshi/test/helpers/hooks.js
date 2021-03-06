'use strict';

const sh = require('shelljs');

module.exports = {
  installProtractor: tmp => {
    sh.exec('npm install protractor@^4.0.0', {cwd: tmp});
  },
  installDependencies: tmp => {
    sh.exec('npm install', {cwd: tmp});
  },
  linkWixNodeBuild: tmp => {
    sh.exec(`npm link '${process.cwd()}'`, {cwd: tmp});
  },
  installDependency: tmp => dep => sh.exec(`npm install ${dep}`, {cwd: tmp})
};
