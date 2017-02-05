'use strict';

// TODO: consider multiple modules
// TODO: figure out if we need definition files

const {tryRequire, exists, watchMode} = require('../utils');
const globs = require('../globs');
const petriSpecs = tryRequire('petri-specs/lib/petri-specs');


function build() {
  const options = {directory: globs.petri(), json: globs.petriOutput()};

  if (!petriSpecs || !exists(globs.petriSpecs())) {
    return Promise.resolve();
  }

  petriSpecs.build(options);

  return Promise.resolve();
}

function watch() {
  // TODO: implement watch mode using chokidar
  return Promise.resolve();
}

function petri() {
  return watchMode() ? watch() : build();
}

module.exports = petri;
