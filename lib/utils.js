'use strict';

const mergeWith = require('lodash/fp/mergeWith');
const fs = require('fs');
const process = require('process');
const xml2js = require('xml2js');
const path = require('path');
const mkdirp = require('mkdirp');
const glob = require('glob');

const tryRequire = module.exports.tryRequire = name => {
  try {
    return require(name);
  } catch (ex) {
    if (ex.code === 'MODULE_NOT_FOUND') {
      return null;
    } else {
      throw ex;
    }
  }
};

function concatCustomizer(objValue, srcValue) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

module.exports.noop = () => {};

module.exports.mergeByConcat = mergeWith(concatCustomizer);

module.exports.suffix = suffix => str => {
  const hasSuffix = str.lastIndexOf(suffix) === str.length - suffix.length;
  return hasSuffix ? str : str + suffix;
};

module.exports.handleRunSequenceErrors = cb =>
  err => err ? process.exit(1) : cb();

module.exports.isTypescriptProject = () =>
  !!tryRequire(path.resolve('tsconfig.json'));

module.exports.testRunner = options => options.mocha ? 'mocha' : 'jasmine';

module.exports.getPom = () =>
  parseXml(fs.readFileSync(path.resolve('pom.xml'), 'utf-8'));

// TODO: replace with real template?
module.exports.renderTemplate = (templateFileName, data) => {
  let template = fs.readFileSync(templateFileName).toString();
  Object.keys(data).forEach(function (key) {
    template = template.replace('{{' + key + '}}', data[key]);
  });

  return template;
};

module.exports.writeFile = (targetFileName, data) => {
  mkdirp.sync(path.dirname(targetFileName));
  fs.writeFileSync(path.resolve(targetFileName), data);
};

module.exports.files = pattern =>
  glob.sync(pattern);

module.exports.exists = pattern =>
  !!glob.sync(pattern).length;

module.exports.inTeamCity = () =>
  process.env.BUILD_NUMBER || process.env.TEAMCITY_VERSION;

module.exports.normalizeGlobDirList = list =>
  list.split(',').length > 1 ? `{${list}}` : `${list}`;

function parseXml(pomXml) {
  var parseError;
  var parseResult;
  xml2js.parseString(pomXml, function (err, result) {
    // This looks to be async, but is totally synchronous. Which is why we can
    // use the values of parseResult/Error in the code immediately after the call to parseString.
    parseError = err;
    parseResult = result;
  });
  if (parseError) {
    throw parseError;
  }

  return parseResult;
}
