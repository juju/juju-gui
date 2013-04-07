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
      // Mock out a dummy location for the Store used in view instances.
      window.juju_config = {
        charmworldURL: 'http://localhost'
      };

    });

    afterEach(function() {
      view.destroy();
      Y.one('#subapp-browser').remove(true);
      delete window.juju_config;
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
})();


(function() {
  var addBrowserContainer = function(Y) {
    var docBody = Y.one(document.body);
    Y.Node.create('<div id="subapp-browser">' +
        '</div>').appendTo(docBody);
  };

  describe.only('browser sidebar view', function() {
    var Y, browser, view, views, Sidebar;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-browser',
          'juju-views',
          'node-event-simulate',
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
      // Mock out a dummy location for the Store used in view instances.
      window.juju_config = {
        charmworldURL: 'http://localhost'
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

    it('caches models fetched from the api for later use', function() {
      var container = Y.one('#subapp-browser');
      view = new Sidebar();
      view._cacheCharms.size().should.eql(0);

      // mock out the request data for the editorial view. We want to make
      // sure we're caching the results.
      var sample_data = Y.io('data/sidebar_editorial.json', {sync: true});
      view.get('store').set(
          'datasource',
          new Y.DataSource.Local({source: sample_data}));
      view.render(container);

      view._cacheCharms.size().should.eql(4);
    });

    it('handles details event when clicking on a charm token', function(done) {
      var container = Y.one('#subapp-browser');
      view = new Sidebar();

      // Test is successful when it completes by hitting this callback we've
      // over written.
      view._handleTokenSelect = function(ev) {
        done();
      };

      var sample_data = Y.io('data/sidebar_editorial.json', {sync: true});
      view.get('store').set(
          'datasource',
          new Y.DataSource.Local({source: sample_data}));
      view.render(container);
      container.one('.charm-token').simulate('click');
    });

    it('renders details when clicking on a charm token', function() {
      var container = Y.one('#subapp-browser');
      view = new Sidebar();

      var sample_data = Y.io('data/sidebar_editorial.json', {sync: true});
      view.get('store').set(
          'datasource',
          new Y.DataSource.Local({source: sample_data}));
      view.render(container);
      container.one('.charm-token').simulate('click');

      var details_node = container.one('.bws-view-data');
      details_node.one('h1').get('text').should.eql('byobu-classroom');
      details_node.all('.tabs').size().should.eql(1);
    });

  });
})();


(function() {
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

    it('should be able to determine if the route is a sub path', function() {
      var app = new browser.Browser(),
          subpaths = ['configuration', 'hooks', 'interfaces', 'qa', 'readme'];

      Y.Array.each(subpaths, function(path) {
        var url = '/bws/fullscreen/charm/id/stuff/' + path + '/';
        app._getSubPath(url).should.eql(path);
      });
    });

  });

})();
