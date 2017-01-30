'use strict';

const path = require('path');
const {tryRequire} = require('../utils');

require('../ignore-extensions');
tryRequire(path.join(process.cwd(), 'test', 'mocha-setup'));
