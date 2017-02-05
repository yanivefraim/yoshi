'use strict';

const path = require('path');
const gulp = require('gulp');
const gulpStylelint = require('gulp-stylelint');

function stylelint() {
  return new Promise((resolve, reject) =>
    gulp.src(['**/*.s+(a|c)ss', '!node_modules/**', '!dist/**'])
      .pipe(gulpStylelint({
        failAfterError: true,
        reporters: [
          {formatter: 'verbose', console: true}
        ],
        configFile: path.join(__dirname, '../../config/.stylelint.config.js')
      }))
      .on('error', reject)
      .once('end', resolve)
  );
}

module.exports = stylelint;
