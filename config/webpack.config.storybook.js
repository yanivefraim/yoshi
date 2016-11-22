const getWebpackClientConfig = require('./webpack.config.client');

module.exports = config => {
  const webpackClientConfig = getWebpackClientConfig({
    debug: true,
    separateCss: false
  });

  config.module.loaders = webpackClientConfig.module.loaders;

  return config;
};
