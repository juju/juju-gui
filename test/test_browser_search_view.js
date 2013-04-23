'use strict';


describe('search view', function() {
  var apiURL,
      container,
      view,
      Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'json',
        'juju-charm-store',
        'node',
        'subapp-browser-searchview',
        function(Y) {
          done();
        });
  });

  beforeEach(function() {
    // Mock out a dummy location for the Store used in view instances.
    window.juju_config = {charmworldURL: 'http://localhost'};
    container = Y.Node.create('<div id="container"></div>');
    Y.one('body').append(container);
    view = new Y.juju.browser.views.BrowserSearchView({text: 'foo'});
    //
    // Create monkeypatched store to verify right method is called.
    apiURL = '';
    var fakeStore = new Y.juju.Charmworld0({});
    var sampleData = {
      result: [{
        id: 'foo/bar-2',
        name: 'bar',
        description: 'some charm named bar'
      }]
    };
    fakeStore.set('datasource', {
      sendRequest: function(params) {
        // Stubbing the server callback value
        apiURL = params.request;
        params.callback.success({
          response: {
            results: [{
              responseText: Y.JSON.stringify(sampleData)
            }]
          }
        });
      }
    });
    view.set('store', fakeStore);
    view.set('renderTo', container);
  });

  afterEach(function() {
    delete window.juju_config;
    view.destroy();
    container.remove(true);
  });

  it('exists', function() {
    assert.isObject(view);
  });

  it('renders correctly', function() {
    view.render();
    assert.equal('charms?text=foo', apiURL);
    assert.equal(1, Y.all('.yui3-charmtoken').size());
    var charmText = Y.one('.yui3-charmtoken').one('.title').get('text');
    assert.equal(charmText.replace(/\s+/g, ''), 'bar');
  });

  it('handles empty text for search', function() {
    view.set('text', '');
    view.render();
    assert.equal('charms?text=', apiURL);
  });
});
