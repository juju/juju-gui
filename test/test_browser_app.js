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

    it('knows that it is fullscreen', function() {
      view = new FullScreen();
      view.isFullscreen().should.equal(true);
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

    it('calls the deploy function when "Add" is clicked', function() {
      var container = Y.one('#subapp-browser');
      var add_button = container.one('a.add');
      debugger
      view = new FullScreen();
      view.render(container);
    });

  });
})();


(function() {
  var addBrowserContainer = function(Y) {
    var docBody = Y.one(document.body);
    Y.Node.create('<div id="subapp-browser">' +
        '</div>').appendTo(docBody);
  };

  describe('browser sidebar view', function() {
    var Y, browser, view, views, sampleData, Sidebar;

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
            sampleData = Y.io('data/sidebar_editorial.json', {sync: true});
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

    it('knows that it is not fullscreen', function() {
      view = new Sidebar();
      view.isFullscreen().should.equal(false);
    });

    it('must correctly render the initial browser ui', function() {
      var container = Y.one('#subapp-browser');
      view = new Sidebar();

      // mock out the data source on the view so that it won't actually make a
      // request.
      var emptyData = {
        responseText: Y.JSON.stringify({
          result: {
            'new': [],
            slider: []
          }
        })
      };

      view.get('store').set(
          'datasource',
          new Y.DataSource.Local({source: emptyData}));
      view.render(container);

      // And the hide button is rendered to the container node.
      assert.isTrue(Y.Lang.isObject(container.one('#bws-sidebar')));
      // Also verify that the search widget has rendered into the view code.
      assert.isTrue(Y.Lang.isObject(container.one('input')));
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

  });

  describe('browser subapp display tree', function() {
    var Y, browser, hits, ns, resetHits;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'app-subapp-extension',
          'juju-views',
          'juju-browser',
          'subapp-browser', function(Y) {
            browser = Y.namespace('juju.subapps');

            resetHits = function() {
              hits = {
                fullscreen: false,
                sidebar: false,
                renderCharmDetails: false,
                renderEditorial: false,
                renderSearchResults: false
              };
            };
            done();
          });
    });

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-views',
          'juju-browser',
          'subapp-browser', function(Y) {
            ns = Y.namespace('juju.subapps');
            done();
          });
    });

    beforeEach(function() {
      var docBody = Y.one(document.body);
      Y.Node.create('<div id="subapp-browser">' +
          '</div>').appendTo(docBody);

      // Track which render functions are hit.
      resetHits();

      // Mock out a dummy location for the Store used in view instances.
      window.juju_config = {
        charmworldURL: 'http://localhost'
      };

      browser = new ns.Browser();
      // Block out each render target so we only track it was hit.
      browser.renderCharmDetails = function() {
        hits.renderCharmDetails = true;
      };
      browser.renderEditorial = function() {
        hits.renderEditorial = true;
      };
      browser.renderSearchResults = function() {
        hits.renderSearchResults = true;
      };
      // showView needs to be hacked because it does the rendering of
      // fullscreen/sidebar.
      browser.showView = function(view) {
        hits[view] = true;
      };
    });

    afterEach(function() {
      browser.destroy();
      Y.one('#subapp-browser').remove(true);
    });

    it('bws-sidebar dispatches correctly', function() {
      var req = {
        path: '/bws/sidebar/',
        params: {
          viewmode: 'sidebar'
        }
      };
      var expected = Y.merge(hits, {
        sidebar: true,
        renderEditorial: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('bws-sidebar-charmid dispatches correctly', function() {
      var req = {
        path: '/bws/sidebar/precise/apache2-2',
        params: {
          viewmode: 'sidebar',
          id: 'precise/apache2-2'
        }
      };
      var expected = Y.merge(hits, {
        sidebar: true,
        renderEditorial: true,
        renderCharmDetails: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('bws-sidebar-search-charmid dispatches correctly', function() {
      var req = {
        path: '/bws/sidebar/search/precise/apache2-2',
        params: {
          viewmode: 'sidebar',
          id: 'precise/apache2-2'
        }
      };
      var expected = Y.merge(hits, {
        sidebar: true,
        renderSearchResults: true,
        renderCharmDetails: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('bws-fullscreen dispatches correctly', function() {
      var req = {
        path: '/bws/fullscreen/',
        params: {
          viewmode: 'fullscreen'
        }
      };
      var expected = Y.merge(hits, {
        fullscreen: true,
        renderEditorial: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('fullscreen-charmid dispatches correctly', function() {
      var req = {
        path: '/bws/fullscreen/precise/apache2-2',
        params: {
          viewmode: 'fullscreen',
          id: 'precise/apache2-2'
        }
      };
      var expected = Y.merge(hits, {
        fullscreen: true,
        renderCharmDetails: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('fullscreen-search-charmid dispatches correctly', function() {
      var req = {
        path: '/bws/fullscreen/search/precise/apache2-2',
        params: {
          viewmode: 'fullscreen',
          id: 'precise/apache2-2'
        }
      };
      var expected = Y.merge(hits, {
        fullscreen: true,
        renderCharmDetails: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('sidebar to sidebar-charmid dispatches correctly', function() {
      var req = {
        path: '/bws/sidebar/',
        params: {
          viewmode: 'sidebar'
        }
      };
      browser.routeView(req, undefined, function() {});

      // Now route through to the charmid from here and we should not hit the
      // editorial content again.
      resetHits();
      req = {
        path: '/bws/sidebar/precise/apache2-2',
        params: {
          viewmode: 'sidebar',
          id: 'precise/apache2-2'
        }
      };

      var expected = Y.merge(hits, {
        renderCharmDetails: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('sidebar-details to sidebar dispatchse correctly', function() {
      var req = {
        path: '/bws/sidebar/precise/apache2-2',
        params: {
          viewmode: 'sidebar',
          id: 'precise/apache2-2'
        }
      };
      browser.routeView(req, undefined, function() {});

      // Reset the hits and we should not redraw anything to update the view.
      resetHits();
      req = {
        path: '/bws/sidebar/',
        params: {
          viewmode: 'sidebar'
        }
      };

      var expected = Y.merge(hits, {});
      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('fullscreen to fullscreen-details dispatches correctly', function() {
      var req = {
        path: '/bws/fullscreen/',
        params: {
          viewmode: 'fullscreen'
        }
      };
      browser.routeView(req, undefined, function() {});

      // Now route through to the charmid from here and we should not hit the
      // editorial content again.
      resetHits();
      req = {
        path: '/bws/fullscreen/precise/apache2-2',
        params: {
          viewmode: 'fullscreen',
          id: 'precise/apache2-2'
        }
      };

      var expected = Y.merge(hits, {
        renderCharmDetails: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('fullscreen-details to fullscreen renders editorial', function() {
      var req = {
        path: '/bws/fullscreen/precise/apache2-2',
        params: {
          viewmode: 'fullscreen',
          id: 'precise/apache2-2'
        }
      };
      browser.routeView(req, undefined, function() {});

      // Reset the hits and we should not redraw anything to update the view.
      resetHits();
      req = {
        path: '/bws/fullscreen/',
        params: {
          viewmode: 'fullscreen'
        }
      };

      var expected = Y.merge(hits, {
        renderEditorial: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('sidebar to fullscreen dispatches correctly', function() {
      var req = {
        path: '/bws/sidebar',
        params: {
          viewmode: 'sidebar'
        }
      };
      browser.routeView(req, undefined, function() {});

      // Reset the hits and we should not redraw anything to update the view.
      resetHits();
      req = {
        path: '/bws/fullscreen/',
        params: {
          viewmode: 'fullscreen'
        }
      };

      var expected = Y.merge(hits, {
        fullscreen: true,
        renderEditorial: true
      });
      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

  });
})();

