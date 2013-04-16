'use strict';


describe('search view', function() {
  var searchView,
      views,
      Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['subapp-browser-searchview'], function(Y) {
          views = Y.namespace('juju.browser.views');
          searchView = views.BrowserSearchView;
          done();
        });
  });

  beforeEach(function() {
  });

  afterEach(function() {
  });

  it.only('exists', function() {
    assert.isObject(new searchView());
  });
});
