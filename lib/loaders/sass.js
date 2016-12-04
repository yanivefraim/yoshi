'use strict';

module.exports = (extractCSS, cssModules) => {
  const cssLoaderOptions = {
    modules: cssModules,
    camelCase: true,
    sourceMap: !!extractCSS,
    localIdentName: '[path][name]__[local]__[hash:base64:5]'
  };

  const sassLoaderOptions = {
    sourceMap: true,
    includePaths: ['.', 'node_modules']
  };

  const sassLoader = `sass?${JSON.stringify(sassLoaderOptions)}`;
  const postcssLoader = 'postcss';

  const {unprocessedModules} = require('../../config/project');

  return [
    {
      test: /\.s?css$/,
      include: unprocessedModules(),
      loader: clientLoader(extractCSS, 'style', [
        `css-loader?${JSON.stringify(cssLoaderOptions)}`,
        sassLoader,
        postcssLoader
      ])
    },
    {
      test: /\.s?css$/,
      exclude: unprocessedModules(),
      loader: clientLoader(extractCSS, 'style', [
        'css-loader',
        sassLoader,
        postcssLoader
      ])
    }
  ];
};

function clientLoader(extractCSS, l1, l2) {
  return extractCSS ? extractCSS.extract(l1, l2) : [l1].concat(l2).join('!');
}
