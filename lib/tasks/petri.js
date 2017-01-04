'use strict';

// TODO: consider multiple modules
// TODO: figure out if we need definition files

const {tryRequire, exists, watchMode} = require('../utils');
const globs = require('../globs');
const gutil = require('gulp-util');
const petriSpecs = tryRequire('petri-specs/lib/petri-specs');


function build() {
  const options = {directory: globs.petri(), json: globs.petriOutput()};

  if (!petriSpecs || !exists(globs.petriSpecs())) {
    return;
  }

  gutil.log('Building petri specs');
  return petriSpecs.build(options);
}

function watch() {
  // TODO: implement watch mode using chokidar
}

function run() {
  return watchMode() ? watch() : build();
}

module.exports = {run, build, watch};
