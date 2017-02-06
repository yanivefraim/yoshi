'use strict';

const {mergeWith} = require('lodash/fp');
const fs = require('fs');
const process = require('process');
const xml2js = require('xml2js');
const path = require('path');
const mkdirp = require('mkdirp');
const glob = require('glob');
const project = require('../config/project');

const files = module.exports.files = pattern => glob.sync(pattern);
const exists = module.exports.exists = pattern => !!files(pattern).length;

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

module.exports.isTypescriptProject = () =>
  !!tryRequire(path.resolve('tsconfig.json'));

module.exports.isBabelProject = () => {
  return !!glob.sync(path.resolve('.babelrc')).length || !!project.babel();
};

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

module.exports.isSingleEntry = entry => typeof entry === 'string' || Array.isArray(entry);

module.exports.watchMode = value => {
  if (value !== undefined) {
    process.env.WIX_NODE_BUILD_WATCH_MODE = value;
  }
  return !!process.env.WIX_NODE_BUILD_WATCH_MODE;
};

module.exports.inTeamCity = () =>
  process.env.BUILD_NUMBER || process.env.TEAMCITY_VERSION;

module.exports.normalizeGlobDirList = list =>
  list.split(',').length > 1 ? `{${list}}` : `${list}`;

module.exports.filterNoise = comp => {
  comp.plugin('done', stats => {
    console.log(stats.toString({
      colors: true,
      hash: false,
      chunks: false,
      assets: false,
      children: false
    }));
    mkdirp.sync(path.resolve('target'));
    fs.writeFileSync('target/webpack-stats.json', JSON.stringify(stats.toJson()));
  });

  return comp;
};

module.exports.shouldRunWebpack = webpackConfig => {
  const defaultEntryPath = path.join(webpackConfig.context, project.defaultEntry());
  return project.entry() || exists(`${defaultEntryPath}.{js,jsx,ts,tsx}`);
};

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
