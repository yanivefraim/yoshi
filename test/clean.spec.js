const expect = require('chai').expect;

const tp = require('./helpers/test-phases');
const fx = require('./helpers/fixtures');

describe('Aggregator: Clean', () => {
  const test = tp.create();
  afterEach(() => test.teardown());

  it('should remove \'dist\' folder', () => {
    const res = test
      .setup({
        'dist/app.js': `const hello = "world!";`,
        'package.json': fx.packageJson()
      })
      .execute('clean');

    expect(res.code).to.be.equal(0);
    expect(res.stdout).to.include('Cleaning up \'dist\'...');
    expect(test.list()).to.not.include('dist');
  });
});
