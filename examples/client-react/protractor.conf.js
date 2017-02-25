import {start} from './test/mock/fake-server';
import 'babel-polyfill';

export const config = {
  baseUrl: 'http://localhost:3100/',
  onPrepare() {
    browser.ignoreSynchronization = true;
    start(3100);
  }
};
