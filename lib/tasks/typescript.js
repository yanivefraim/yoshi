'use strict';

const _ = require('lodash/fp');
const cp = require('child_process');
const gutil = require('gulp-util');
const typescript = require('typescript');
const {watchMode, noop} = require('../utils');

const watch = watchMode();
const typescriptSuccessRegex = /Compilation complete/;
const typescriptErrorRegex = /\(\d+,\d+\): error TS\d+:/;

function run({done = noop}) {
  gutil.log(`Compiling TypeScript @ ${typescript.version}`);

  const bin = require.resolve('typescript/bin/tsc');

  const args = toCliArgs({
    project: 'tsconfig.json',
    rootDir: '.',
    outDir: './dist/'
  });

  const child = cp.spawn(bin, [...args, ...watch ? ['--watch'] : []]);

  return new Promise((resolve, reject) => {
    child.stdout.on('data', onStdout(_.compose(resolve, done), reject));
  });
}

function onStdout(resolve, reject) {
  return buffer => {
    const str = buffer.toString();

    if (typescriptErrorRegex.test(str)) {
      printLines(str, 'red');
      reject();

      if (!watch) {
        throw new gutil.PluginError('WixTypeScriptTask', {
          message: 'TypeScript transpilation failed! Please see the red error above.'
        });
      }
    } else if (typescriptSuccessRegex.test(str)) {
      printLines(str, 'green');
      resolve();
    }
  };
}

function print(color) {
  return line => gutil.log(gutil.colors[color](line));
}

function printLines(lines, color) {
  return lines.split('\n').filter(a => a.length > 0).forEach(print(color));
}

function toCliArgs(obj) {
  return _.toPairs(obj).reduce((list, [key, value]) => [...list, `--${key}`, value], []);
}

module.exports = {run};
