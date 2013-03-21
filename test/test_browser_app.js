'use strict';

(function() {

  var addBrowserContainer = function(Y) {
    var docBody = Y.one(document.body);
    Y.Node.create('<div id="subapp-browser">' +
        '</div>').appendTo(docBody);
  };

  describe('browser fullscreen view', function() {
    var browser, FullScreen, view, views, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-views',
          'juju-browser',
          'subapp-browser-fullscreen', function(Y) {
            browser = Y.namespace('juju.browser');
            views = Y.namespace('juju.browser.views');
            FullScreen = views.FullScreen;
            done();
          });
    });

    beforeEach(function() {
      addBrowserContainer(Y);
    });

    afterEach(function() {
      view.destroy();
      Y.one('#subapp-browser').remove(true);
    });

    // Ensure the search results are rendered inside the container.
    it('must correctly render the initial browser ui', function() {
      var container = Y.one('#subapp-browser');

      view = new FullScreen();
      view.render(container);

      // And the hide button is rendered to the container node.
      assert.isTrue(Y.Lang.isObject(container.one('#bws-fullscreen')));
      // Also verify that the search widget has rendered into the view code.
      assert.isTrue(Y.Lang.isObject(container.one('input')));
    });

  });


  describe('browser sidebar view', function() {
    var Y, browser, view, views, Sidebar;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-browser',
          'juju-views',
          'subapp-browser-sidebar',
          function(Y) {
            browser = Y.namespace('juju.browser');
            views = Y.namespace('juju.browser.views');
            Sidebar = views.Sidebar;
            done();
          });
    });

    beforeEach(function() {
      addBrowserContainer(Y);
      window.juju_config = {
        charmworld_url: 'http://localhost'
      };
    });

    afterEach(function() {
      view.destroy();
      Y.one('#subapp-browser').remove(true);
      delete window.juju_config;
    });

    it('must correctly render the initial browser ui', function() {
      var container = Y.one('#subapp-browser');
      view = new Sidebar();

      // mock out the data source on the view so that it won't actually make a
      // request.
      var sample_data = {
        responseText: Y.JSON.stringify({
          result: {
            'new': [],
            slider: []
          }
        })
      };

      view.get('store').set(
          'datasource',
          new Y.DataSource.Local({source: sample_data}));
      view.render(container);

      // And the hide button is rendered to the container node.
      assert.isTrue(Y.Lang.isObject(container.one('#bws-sidebar')));
      // Also verify that the search widget has rendered into the view code.
      assert.isTrue(Y.Lang.isObject(container.one('input')));
    });

  });


  describe('browser app', function() {
    var Y, browser;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'app-subapp-extension',
          'juju-views',
          'juju-browser',
          'subapp-browser', function(Y) {
            browser = Y.namespace('juju.subapps');
            done();
          });
    });

    it('verify that route callables exist', function() {
      var app = new browser.Browser();
      Y.each(app.get('routes'), function(route) {
        assert.isTrue(typeof app[route.callback] === 'function');
      });

    });

  });

})();
