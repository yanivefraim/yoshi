function conditionedProxy(predicate = () => {}) {
  return new Proxy({}, {
    get: (target, name) =>
      predicate(name) ? conditionedProxy() : name
  });
}

function mockCssModules(module) {
  module.exports = conditionedProxy(name => name === 'default');
}

function noop() {}

require.extensions['.css'] = mockCssModules;
require.extensions['.scss'] = mockCssModules;

require.extensions['.png'] = noop;
require.extensions['.svg'] = noop;
require.extensions['.jpg'] = noop;
require.extensions['.jpeg'] = noop;
require.extensions['.gif'] = noop;
