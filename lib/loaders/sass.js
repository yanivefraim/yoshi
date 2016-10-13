'use strict';

module.exports = extractCSS => {
  const cssLoaderOptions = {
    modules: true,
    camelCase: true,
    sourceMap: true,
    localIdentName: '[path][name]__[local]__[hash:base64:5]'
  };

  return {
    client: {
      test: /\.s?css$/,
      loader: clientLoader(extractCSS, 'style', [
        `css-loader?${JSON.stringify(cssLoaderOptions)}`,
        `sass?${JSON.stringify({
          sourceMap: true
        })}`,
        'postcss'
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
