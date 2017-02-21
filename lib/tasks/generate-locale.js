const jsonAngularTranslate = require('gulp-json-angular-translate');
const globs = require('../globs');
const projectConfig = require('../../config/project');
const gulp = require('gulp');
const rm = require('gulp-rm');

function processJsonAngularTranslate(dirs) {
  return new Promise((resolve, reject) => {
    gulp.src(dirs)
      .pipe(jsonAngularTranslate({
        moduleName: projectConfig.translationModuleName(),
        extractLanguage: /..(?=\.[^.]*$)/,
        hasPreferredLanguage: true,
        createNestedKeys: true
      }))
      .pipe(gulp.dest('./dist'))
      .on('error', reject)
      .once('end', resolve);
  });
}

function removeOldJsonFiles(dirs) {
  return new Promise((resolve, reject) => {
    gulp.src(dirs.map(dir => `dist/${dir}`), {read: false})
      .pipe(rm({async: false}))
      .on('error', reject)
      .once('end', resolve);
  });
}

function generateLocale({dirs = globs.localeJson()}) {
  if (projectConfig.isAngularProject()) {
    return processJsonAngularTranslate(dirs)
      .then(() => removeOldJsonFiles(dirs));
  }

  return Promise.resolve();
}

module.exports = generateLocale;
