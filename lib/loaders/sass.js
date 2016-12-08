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

  return {
    client: {
      test: /\.s?css$/,
      loader: clientLoader(extractCSS, 'style', [
        `css-loader?${JSON.stringify(cssLoaderOptions)}`,
        'postcss',
        `sass?${JSON.stringify(sassLoaderOptions)}`
      ])
    },
    server: {
      test: /\.s?css$/,
      loaders: [
        `css-loader/locals?${JSON.stringify(cssLoaderOptions)}`,
        `sass?${JSON.stringify({
          sourceMap: true
        })}`
      ]
    }
  };
};

function clientLoader(extractCSS, l1, l2) {
  return extractCSS ? extractCSS.extract(l1, l2) : [l1].concat(l2).join('!');
}
