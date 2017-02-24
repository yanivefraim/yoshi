'use strict';
const utils = require('../utils');
const path = require('path');
const projectConfig = require('../../config/project');

function createMavenTarGz() {
  const clientProjectName = projectConfig.clientProjectName();

  let templateFileName;
  let templateData = {};

  if (clientProjectName) {
    templateFileName = path.join(__dirname, '/../../templates/nbuild.tar.gz.xml');
    templateData = {'client-project': clientProjectName};
  } else {
    templateFileName = path.join(__dirname, '/../../templates/tar.gz.xml');
    templateData = {staticsDir: projectConfig.clientFilesPath()};
  }

  const template = utils.renderTemplate(templateFileName, templateData);
  try {
    const pom = utils.getPom();
    const tarGZLocation = pom.project.build[0].plugins[0].plugin[0].configuration[0].descriptors[0].descriptor[0];
    utils.writeFile(tarGZLocation, template);
  } catch (e) {}

  return Promise.resolve();
}

module.exports = createMavenTarGz;
