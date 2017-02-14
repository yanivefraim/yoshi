'use strict';

const shelljs = require('shelljs');
const path = require('path');

module.exports = class Runner {
  constructor(inDir, command, args) {
    this._inDir = inDir;
    this._args = [command].concat(args);
    console.assert(inDir, 'inDir is mandatory when constructing Runner');
  }

  _cloneDir() {
    this._clonedDir = path.resolve(shelljs.tempdir(), Math.ceil(Math.random() * 100000).toString());
    shelljs.cp('-r', `${this._inDir}${path.sep}`, this._clonedDir);
  }

  fileContent(path) {
    return shelljs.cat(`${this._clonedDir}/${path}`).stdout;
  }

  ls(path) {
    return shelljs.ls(`${this._clonedDir}/${path}`);
  }

  run() {
    this._cloneDir();
    shelljs.pushd(this._clonedDir);

    try {
      const scriptToRun = path.join(__dirname, '../../yoshi.js');
      return shelljs.exec(`node '${scriptToRun}' ${this._args.join(' ')}`);
    } finally {
      shelljs.popd();
    }
  }
};
