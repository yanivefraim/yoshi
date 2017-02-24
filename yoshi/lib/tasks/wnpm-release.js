'use strict';

const wnpm = require('wnpm-ci');

function wnpmRelease() {
  return new Promise(resolve =>
    wnpm.prepareForRelease({shouldShrinkWrap: false}, resolve)
  );
}

module.exports = wnpmRelease;
