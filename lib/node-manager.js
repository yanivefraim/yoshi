'use strict';

const fs = require('fs');

function updateVersion() {
  fs.writeFileSync('.nvmrc', fs.readFileSync(require.resolve('../templates/.nvmrc')));
}

module.exports = {
  updateVersion
};
