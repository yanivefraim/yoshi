const expect = require('chai').expect;

const tp = require('./helpers/test-phases');
const fx = require('./helpers/fixtures');

describe('Aggregator: Lint', () => {
  const test = tp.create();
  afterEach(() => test.teardown());

  describe('TSLint', () => {
    it('should pass with exit code 0', () => {
      const res = test
        .setup({
          'app/a.ts': `parseInt("1", 10);`,
          'package.json': fx.packageJson(),
          'tsconfig.json': fx.tsconfig(),
          'tslint.json': fx.tslint()
        })
        .execute('lint');

      expect(res.code).to.equal(0);
    });

    it('should fail with exit code 1', () => {
      const res = test
        .setup({
          'app/a.ts': `parseInt("1");`,
          'package.json': fx.packageJson(),
          'tsconfig.json': fx.tsconfig(),
          'tslint.json': fx.tslint()
        })
        .execute('lint');

      expect(res.code).to.equal(1);
      expect(res.stdout).to.contain('Missing radix parameter');
    });

    it('should should fail with exit code 1 (tsx)', () => {
      const res = test
        .setup({
          'app/a.tsx': `parseInt("1");`,
          'package.json': fx.packageJson(),
          'tsconfig.json': fx.tsconfig(),
          'tslint.json': fx.tslint()
        })
        .execute('lint');

      expect(res.code).to.equal(1);
      expect(res.stdout).to.contain('Missing radix parameter');
    });

    it('should fail with exit code 0 when the process is in watch mode', () => {
      const resp = test
        .setup({
          'app/a.ts': 'parseInt(\'1\');',
          'package.json': fx.packageJson(),
          'tsconfig.json': fx.tsconfig(),
          'tslint.json': fx.tslint()
        })
        .execute('lint', null, {WATCH_MODE: true});

      expect(resp.code).to.equal(0);
      expect(resp.stdout).to.contain('Missing radix parameter');
    });
  });

  describe('ESLint', () => {

    function setup(data) {
      return test.setup(Object.assign({
        'package.json': fx.packageJson(),
        '.eslintrc': fx.eslintrc()
      }, data));
    }

    it('should lint js files in the root folder too', () => {
      const res = setup({'a.js': 'parseInt("1");'}).execute('lint');
      expect(res.code).to.equal(1);
      expect(res.stdout).to.contain('1:1  error  Missing radix parameter  radix');
    });

    it('should pass with exit code 0', () => {
      const res = setup({'app/a.js': `parseInt("1", 10);`}).execute('lint');
      expect(res.code).to.equal(0);
    });

    it('should fail with exit code 1', () => {
      const res = setup({'app/a.js': `parseInt("1");`}).execute('lint');
      expect(res.code).to.equal(1);
      expect(res.stdout).to.contain('1:1  error  Missing radix parameter  radix');
    });

    it('should fail with exit code 0 when the process is in watch mode', () => {
      const resp = setup({'app/a.js': 'parseInt(\'1\');'}).execute('lint', null, {WATCH_MODE: true});
      expect(resp.code).to.equal(0);
      expect(resp.stdout).to.contain('1:1  error  Missing radix parameter  radix');
    });

  });

  describe('Stylelint', () => {
    it('should pass with exit code 0', () => {

      const goodStyle = `
p {
  $color: #ff0;
  color: #ff0;
}`;
      const res = test
        .setup({
          'a.sass': goodStyle,
          'a.scss': goodStyle,
          'package.json': fx.packageJson()
        })
        .execute('lint', ['--client']);

      expect(res.stdout).to.contain('Linting with Stylelint');
      expect(res.stdout).to.contain('2 sources checked');
      expect(res.code).to.equal(0);
    });

    it('should fail with exit code 1', () => {
      const badStyle = `
p {
  color: #ff0;
}




`;

      const res = test
        .setup({
          'a.sass': badStyle,
          'a.scss': badStyle,
          'package.json': fx.packageJson()
        })
        .execute('lint', ['--client']);

      expect(res.stdout).to.contain('✖  Expected no more than 1 empty line(s)   max-empty-lines');
      expect(res.code).to.equal(1);
    });

  });

  describe('Empty state', () => {
    it('should pass out of the box if no relevant files exist', () => {

      const res = test
        .setup({
          'package.json': fx.packageJson()
        })
        .execute('lint');

      expect(res.code).to.equal(0);
    });
  });
});
