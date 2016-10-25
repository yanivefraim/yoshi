'use strict';

const sh = require('shelljs');

module.exports = {
  installProtractor: tmp => {
    sh.exec('npm install protractor@3.3.0', {cwd: tmp});
  },
  installChromedriver: tmp => {
    sh.exec('npm install chromedriver@latest', {cwd: tmp});
  },
  installDependencies: tmp => {
    sh.exec('npm install', {cwd: tmp});
  },
  linkWixNodeBuild: tmp => {
    sh.exec(`npm link '${process.cwd()}'`, {cwd: tmp});
  },
  installDependency: tmp => dep => sh.exec(`npm install ${dep}`, {cwd: tmp})
};
