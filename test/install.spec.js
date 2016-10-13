const expect = require('chai').expect;
const tp = require('./helpers/test-phases');
const fx = require('./helpers/fixtures');

describe('Aggregator: Install', () => {

  describe('Typings', () => {
    const test = tp.create();
    afterEach(() => test.teardown());

    it('should not fail when no typings.json file', () => {
      const res = test.setup({
        '.gitkeep': ''
      }).execute('install');

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('Installing Typings from typings.json');
    });

    it('should install specified dependencies', () => {
      const res = test.setup({
        'typings.json': fx.typingsJson()
      }).execute('install');

      const typingToCheck = 'debug';

      expect(res.code).to.equal(0);
      expect(res.stdout).to.contain('Installing Typings from typings.json');

      expect(test.list('typings/modules')).to.contain(typingToCheck);

      // expect(test.contains(`typings/main/definitions/${typingToCheck}/index.d.ts`)).to.be.true;
      // expect(test.contains(`typings/browser/definitions/${typingToCheck}/index.d.ts`)).to.be.true;
      //
      // expect(test.content('typings/main.d.ts')).to.contain(`main/definitions/${typingToCheck}/index.d.ts`);
      // expect(test.content('typings/browser.d.ts')).to.contain(`browser/definitions/${typingToCheck}/index.d.ts`);
    });
  });
});
