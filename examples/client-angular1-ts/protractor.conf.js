const fakeServer = require('./test/fakes/fake-server');

module.exports = {
  config: {
	baseUrl: 'http://localhost:3100/',
	framework: 'mocha',
	onPrepare() {
		browser.ignoreSynchronization = true;
		fakeServer.start(3100);
	}
  }
};
