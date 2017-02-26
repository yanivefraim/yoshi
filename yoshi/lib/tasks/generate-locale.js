const jsonAngularTranslate = require('gulp-json-angular-translate');
const globs = require('../globs');
const projectConfig = require('../../config/project');
const gulp = require('gulp');
const path = require('path');

function processJsonAngularTranslate(context, output, dirs) {
  return new Promise((resolve, reject) => {
    const base = path.join(process.cwd(), context);
    gulp.src(dirs, {base})
      .pipe(jsonAngularTranslate({
        moduleName: projectConfig.translationModuleName(),
        extractLanguage: /..(?=\.[^.]*$)/,
        hasPreferredLanguage: true,
        createNestedKeys: true
      }))
      .pipe(gulp.dest(path.join('./dist', output)))
      .on('error', reject)
      .once('end', resolve);
  });
}

function generateLocale({context = 'src', output = 'statics', dirs = globs.localeJson()}) {
  if (projectConfig.isAngularProject()) {
    return processJsonAngularTranslate(context, output, dirs);
  }

  return Promise.resolve();
}

module.exports = generateLocale;