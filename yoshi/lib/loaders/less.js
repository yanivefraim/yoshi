'use strict';

module.exports = (extractCSS, cssModules, tpaStyle) => {
  const cssLoaderOptions = {
    modules: cssModules,
    camelCase: true,
    sourceMap: !!extractCSS,
    localIdentName: '[path][name]__[local]__[hash:base64:5]',
    importLoaders: tpaStyle ? 3 : 2
  };

  const lessLoaderOptions = {
    sourceMap: true,
    paths: ['.', 'node_modules']
  };

  return {
    client: {
      test: /\.less$/,
      loader: clientLoader(extractCSS, 'style', [
        `css-loader?${JSON.stringify(cssLoaderOptions)}`,
        'postcss',
        ...tpaStyle ? ['wix-tpa-style-loader'] : [],
        `less?${JSON.stringify(lessLoaderOptions)}`
      ])
    },
    specs: {
      test: /\.less$/,
      loaders: [
        `css-loader/locals?${JSON.stringify(cssLoaderOptions)}`,
        ...tpaStyle ? ['wix-tpa-style-loader'] : [],
        `less?${JSON.stringify(lessLoaderOptions)}`
      ]
    }
  };
};

function clientLoader(extractCSS, l1, l2) {
  return extractCSS ? extractCSS.extract(l1, l2) : [l1].concat(l2).join('!');
}
