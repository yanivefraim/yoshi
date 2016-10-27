const jest = require('jest-cli');

module.exports = cb => {
  jest.runCLI({}, process.cwd(), cb);
};
