'use strict';

const path = require('path');
const {tryRequire, isTypescriptProject} = require('../utils');

const ext = isTypescriptProject() ? 'ts' : 'js';
const mochSetupPath = path.join(process.cwd(), 'test', `mocha-setup.${ext}`);

require('../ignore-extensions');
tryRequire(mochSetupPath);
