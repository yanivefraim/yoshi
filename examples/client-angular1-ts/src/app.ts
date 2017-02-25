import * as angular from 'angular';
import appModule from './components/App';

angular.module('angular1Example', [appModule]);

angular.bootstrap(document.body, ['angular1Example']);
