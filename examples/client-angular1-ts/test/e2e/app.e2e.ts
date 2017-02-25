import {$, browser} from 'protractor';
import {use, expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

describe('React application', () => {

  describe('open page', () => {

    it('should display counter', () => {
      browser.get('/');
      expect($('#visit-count').getText()).to.eventually.contain('Visit');
    });

    it('should display title', () => {
      browser.get('/');
      expect($('.hero').getText()).to.eventually.equal('Superman');
    });
  });
});
