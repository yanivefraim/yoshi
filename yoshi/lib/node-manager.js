'use strict';

const {log} = require('gulp-util');
const fs = require('fs');

function updateVersion() {
  const fwVersion = fs.readFileSync(require.resolve('../templates/.nvmrc')).toString();
  let projectVersion = '0';

  try {
    projectVersion = fs.readFileSync('.nvmrc').toString();
  } catch (e) {}

  if (fwVersion > projectVersion) {
    log(`Upgrading node version @ ${fwVersion}`);
    fs.writeFileSync('.nvmrc', fwVersion);
  }
}

module.exports = {
  updateVersion
};
