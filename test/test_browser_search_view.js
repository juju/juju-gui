'use strict';


describe('search view', function() {
  var SearchView,
      views,
      Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['subapp-browser-searchview'], function(Y) {
          views = Y.namespace('juju.browser.views');
          SearchView = views.BrowserSearchView;
          done();
        });
  });

  beforeEach(function() {
  });

  afterEach(function() {
  });

  it('exists', function() {
    assert.isObject(new SearchView());
  });

  it('renders correctly');

  it('rerenders on textChange');
});
