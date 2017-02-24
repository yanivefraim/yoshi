'use strict';

const run = require('../../run');
const mocha = require('../mocha');
const jasmine = require('../jasmine');
const protractor = require('../protractor');
const karma = require('../karma');
const jest = require('../jest');

const commands = {mocha, jasmine, protractor, karma, jest};

function test(options) {
  const runWithOptions = run(options);

  const option = Object.keys(commands)
    .find(option => options[option]);

  if (option) {
    return runWithOptions(commands[option]);
  }

  return runWithOptions(mocha)
    .then(() => runWithOptions(protractor));
}

module.exports = test;
