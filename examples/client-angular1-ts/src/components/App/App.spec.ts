import * as angular from 'angular';
import { TurnerComponentDriver } from 'turnerjs';
import {expect} from 'chai';

class AppDriver extends TurnerComponentDriver {

  render(name = '') {
    this.renderFromTemplate(`<app hero="${name}"></app>`);
  }

  getHeroElement() {
    return this.findByDataHook('hero');
  }
}

describe('Component: app', () => {
  let driver: AppDriver;

  beforeEach(() => {
    angular.mock.module('appModule');
    driver = new AppDriver();
  });

  afterEach(() => {
    driver.disconnectFromBody();
  });

  it('should render app component', () => {
    driver.render('wonderwoman');
    expect(driver.element.text()).to.equal('wonderwoman');
  });
});
