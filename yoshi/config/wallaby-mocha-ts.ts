module.exports = function (wallaby) {
  process.env.NODE_PATH += `:${require('path').join(wallaby.localProjectDir, 'node_modules')}`;

  return {
    files: [
      {pattern: 'test/**/*.spec.ts*', ignore: true},
      {pattern: 'test/**/*.ts'},
      {pattern: 'src/assets/**', instrument: false},
      {pattern: 'src/**', instrument: true},
      {pattern: 'src/**/*.spec.ts*', ignore: true},
      {pattern: 'target/**/*.json', instrument: false},
      {pattern: 'templates/**', instrument: false},
      {pattern: 'index.ts', instrument: true},
      {pattern: 'package.json', instrument: false}
    ],

    tests: [
      {pattern: 'test/**/*.spec.ts*'},
      {pattern: 'src/**/*.spec.ts*'},
    ],
    testFramework: 'mocha',

    setup(wallaby) {
      const mocha = wallaby.testFramework;
      mocha.timeout(30000);
      require('wix-node-build/lib/setup/mocha-setup');
    },

    env: {
      type: 'node',
      params: {
        env: `LOCAL_PATH=${process.cwd()}`
      }
    },
    workers: {
      initial: 1,
      regular: 1
    }
  };
};
