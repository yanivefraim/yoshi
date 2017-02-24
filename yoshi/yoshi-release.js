#!/usr/bin/env node

const run = require('./lib/run');
const release = require('./lib/tasks/aggregators/release');

run()(release);
