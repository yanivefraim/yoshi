'use strict';

const _ = require('lodash/fp');
const spawn = require('cross-spawn');
const gutil = require('gulp-util');
const {watchMode, noop} = require('../utils');

const watch = watchMode();
const typescriptSuccessRegex = /Compilation complete/;
const typescriptErrorRegex = /\(\d+,\d+\): error TS\d+:/;

function runTypescript(done = noop) {
  return function typescript() {
    const bin = require.resolve('typescript/bin/tsc');

    const args = toCliArgs({
      project: 'tsconfig.json',
      rootDir: '.',
      outDir: './dist/'
    });

    const child = spawn(bin, [...args, ...watch ? ['--watch'] : []]);

    return new Promise((resolve, reject) => {
      child.stdout.on('data', onStdout(_.compose(resolve, done), reject));

      if (!watch) {
        child.on('exit', code => code === 0 ? resolve() : reject());
      }
    });
  };
}

function onStdout(resolve, reject) {
  return buffer => {
    const lines = buffer.toString()
      .split('\n')
      .filter(a => a.length > 0);

    const error = lines.some(line => typescriptErrorRegex.test(line));

    print(lines);

    if (error) {
      return reject();
    }

    return resolve();
  };
}

function color(line) {
  if (typescriptErrorRegex.test(line)) {
    return gutil.colors.red(line);
  }

  if (typescriptSuccessRegex.test(line)) {
    return gutil.colors.green(line);
  }

  return gutil.colors.white(line);
}

function print(lines) {
  return lines.forEach(line => console.log(color(line)));
}

function toCliArgs(obj) {
  return _.toPairs(obj).reduce((list, [key, value]) => [...list, `--${key}`, value], []);
}

module.exports = runTypescript;
