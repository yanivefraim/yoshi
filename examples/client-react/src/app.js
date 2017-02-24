import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import {I18nextProvider} from 'react-i18next';
import App from './components/App';
import i18n from './i18n';

const locale = window.__LOCALE__;
const staticsBaseUrl = window.__STATICS_BASE_URL__;

ReactDOM.render(
  <I18nextProvider i18n={i18n({locale, baseUrl: staticsBaseUrl})}>
    <App/>
  </I18nextProvider>,
  document.getElementById('root')
);
