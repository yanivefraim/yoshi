const fs = require('fs');
const graphqlLoader = require('graphql-tag/loader');

function conditionedProxy(predicate = () => {}) {
  return new Proxy({}, {
    get: (target, name) =>
      predicate(name) ? conditionedProxy() : name
  });
}

function mockCssModules(module) {
  module.exports = conditionedProxy(name => name === 'default');
}

function loadGraphQLModules(module) {
  const query = fs.readFileSync(module.filename, 'utf-8');
  const scopedLoader = graphqlLoader.bind({cacheable: noop});
  const output = scopedLoader(query);
  module.exports = eval(output); // eslint-disable-line no-eval
}

function noop() {}

require.extensions['.css'] = mockCssModules;
require.extensions['.scss'] = mockCssModules;

require.extensions['.graphql'] = loadGraphQLModules;
require.extensions['.gql'] = loadGraphQLModules;

require.extensions['.png'] = noop;
require.extensions['.svg'] = noop;
require.extensions['.jpg'] = noop;
require.extensions['.jpeg'] = noop;
require.extensions['.gif'] = noop;
