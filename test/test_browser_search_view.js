'use strict';


describe('search view', function() {
  var Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['subapp-browser-searchview'], function(Y) {
          done();
        });
  });

  beforeEach(function() {
  });

  afterEach(function() {
  });

  it.only('exists', function() {
    assert.isObject(Y.juju.views.browser.BrowserSearchView());
  });
});
