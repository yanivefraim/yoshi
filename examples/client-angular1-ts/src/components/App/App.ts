import * as angular from 'angular';

class AppController {
  //
}

export default angular
  .module('appModule', [])
  .component('app', {
    template: `<div class="hero">{{$ctrl.hero}}</div>`,
    controller: AppController,
    bindings: {
      hero: '@'
    }
  })
  .name;
