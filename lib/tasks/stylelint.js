'use strict';

const path = require('path');

module.exports = (gulp, plugins, options) =>
  gulp.task('stylelint', () => {
    plugins.util.log('Linting with Stylelint');

    return gulp.src(['**/*.s+(a|c)ss', '!node_modules/**', '!dist/**'])
      .pipe(plugins.stylelint({
        failAfterError: !options.watch,
        reporters: [
          {formatter: 'verbose', console: true}
        ],
        configFile: path.join(__dirname, '../../config/.stylelint.config.js')
      }));
  });
