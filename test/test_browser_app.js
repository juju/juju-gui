/**
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

(function() {

  describe('browser fullscreen view', function() {
    var browser, container, FullScreen, view, views, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-views',
          'juju-browser',
          'juju-tests-utils',
          'subapp-browser-fullscreen', function(Y) {
            browser = Y.namespace('juju.browser');
            views = Y.namespace('juju.browser.views');
            FullScreen = views.FullScreen;
            done();
          });
    });

    beforeEach(function() {
      container = Y.namespace('juju-tests.utils').makeContainer('container');
      addBrowserContainer(Y);
      // Mock out a dummy location for the Store used in view instances.
      window.juju_config = {
        charmworldURL: 'http://localhost'
      };

    });

    var addBrowserContainer = function(Y) {
      Y.Node.create([
        '<div id="content">',
        '<div id="browser-nav">',
        '<div class="sidebar"></div>',
        '<div class="fullscreen"</div>',
        '</div>',
        '<div id="subapp-browser"></div>',
        '</div>'
      ].join('')).appendTo(container);
    };

    afterEach(function() {
      view.destroy();
      Y.one('#subapp-browser').remove(true);
      delete window.juju_config;
      container.remove(true);
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

    it('reroutes to minimized when toggled', function(done) {
      var container = Y.one('#subapp-browser');
      view = new FullScreen();
      view.on('viewNavigate', function(ev) {
        assert(ev.change.viewmode === 'minimized');
        done();
      });
      view.render(container);
      container.one('.bws-icon').simulate('click');
    });

  });
})();


(function() {
  describe('browser sidebar view', function() {
    var Y, browser, container, view, views, Sidebar;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-browser',
          'juju-models',
          'juju-views',
          'juju-tests-utils',
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
      container = Y.namespace('juju-tests.utils').makeContainer('container');
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
      container.remove(true);
    });

    var addBrowserContainer = function(Y) {
      Y.Node.create([
        '<div id="content">',
        '<div id="browser-nav">',
        '<div class="sidebar"></div>',
        '<div class="fullscreen"</div>',
        '</div>',
        '<div id="subapp-browser"></div>',
        '</div>'
      ].join('')).appendTo(container);
    };

    it('knows that it is not fullscreen', function() {
      view = new Sidebar();
      view.isFullscreen().should.equal(false);
    });

    it('reroutes to minimized when toggled', function(done) {
      var container = Y.one('#subapp-browser');
      view = new Sidebar();
      view.on('viewNavigate', function(ev) {
        assert(ev.change.viewmode === 'minimized');
        done();
      });
      view.render(container);
      container.one('.bws-icon').simulate('click');
    });

    it('must correctly render the initial browser ui', function() {
      var container = Y.one('#subapp-browser');
      view = new Sidebar({
        store: new Y.juju.Charmworld2({
          apiHost: 'http://localhost'
        })
      });

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

      // Override the store to not call the dummy localhost address.
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
    var Y, app, browser, next;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'app-subapp-extension',
          'juju-views',
          'juju-browser',
          'subapp-browser', function(Y) {
            browser = Y.namespace('juju.subapps');
            next = function() {};
            done();
          });
    });

    beforeEach(function() {
      // Mock out a dummy location for the Store used in view instances.
      window.juju_config = {
        charmworldURL: 'http://localhost'
      };
    });

    afterEach(function() {
      if (app) {
        app.destroy();
      }

      window.juju_config = undefined;
    });

    it('verify that route callables exist', function() {
      app = new browser.Browser();
      Y.each(app.get('routes'), function(route) {
        assert.isTrue(typeof app[route.callback] === 'function');
      });
    });

    it('correctly strips viewmode from the charmID', function() {
      app = new browser.Browser();
      var paths = [
        'foo/bar-66',
        'search/foo/bar-66',
        'sidebar/foo/bar-66',
        'minimized/foo/bar-66',
        'fullscreen/foo/bar-66',
        'sidebar/search/foo/bar-66',
        'minimized/search/foo/bar-66',
        'fullscreen/search/foo/bar-66'
      ];
      paths.map(function(id) {
        assert.equal(
            'foo/bar-66', app._stripViewMode(id),
            id + ' was not stripped correctly.'
        );
      });
    });

    it('* route set sidebar by default', function() {
      app = new browser.Browser();
      // Stub out the sidebar so we don't render anything.
      app.sidebar = function() {};
      var req = {
        path: '/'
      };

      app.routeSidebarDefault(req, null, next);
      // The viewmode should be populated now to the default.
      assert.equal(req.params.viewmode, 'sidebar');
    });

    it('prevents * route from doing more than sidebar by default', function() {
      app = new browser.Browser();
      var req = {
        path: '/sidebar'
      };

      app.routeSidebarDefault(req, null, next);
      // The viewmode is ignored. This path isn't meant for this route
      // callable to deal with at all.
      assert.equal(req.params, undefined);
    });

    it('/charm/id routes to the default view correctly', function() {
      app = new browser.Browser();
      // Stub out the sidebar so we don't render anything.
      app.sidebar = function() {};
      var req = {
        path: '/precise/mysql-10/'
      };

      app.routeDirectCharmId(req, null, next);
      // The viewmode should be populated now to the default.
      assert.equal(req.params.viewmode, 'sidebar');
      assert.equal(req.params.id, 'precise/mysql-10');
    });

    it('/charm/id handles routes for new charms correctly', function() {
      app = new browser.Browser();
      // Stub out the sidebar so we don't render anything.
      app.sidebar = function() {};
      var req = {
        path: '~foo/precise/mysql-10/'
      };
      app.routeDirectCharmId(req, null, next);
      assert.equal(req.params.id, '~foo/precise/mysql-10');
    });

    it('does not add sidebar to urls that do not require it', function() {
      app = new browser.Browser();

      // sidebar is the default viewmode and is not required on urls that have
      // a charm id in them or the root url. Leave out the viewmode in these
      // cases.
      var url = app._getStateUrl({
        viewmode: 'sidebar',
        charmID: 'precise/mysql-10',
        search: undefined,
        filter: undefined
      });
      assert.equal(url, 'precise/mysql-10');

      url = app._getStateUrl({
        viewmode: 'sidebar',
        charmID: undefined,
        search: undefined,
        filter: undefined
      });
      assert.equal(url, '');

      // The viewmode is required for search related routes though.
      url = app._getStateUrl({
        viewmode: 'sidebar',
        charmID: undefined,
        search: true,
        filter: undefined
      });
      assert.equal(url, 'sidebar/search');

      // If the viewmode is set to something not sidebar, it's part of the
      // url.
      url = app._getStateUrl({
        viewmode: 'fullscreen',
        charmID: undefined,
        search: undefined,
        filter: undefined
      });
      assert.equal(url, 'fullscreen');
    });

    it('/charm/id router ignores other urls', function() {
      app = new browser.Browser();
      // Stub out the sidebar so we don't render anything.
      app.sidebar = function() {};
      var req = {
        path: 'fullscreen/search'
      };

      app.routeDirectCharmId(req, null, next);
      // The viewmode should be populated now to the default.
      assert.equal(req.params, undefined);

      req = {
        path: '/login/'
      };

      app.routeDirectCharmId(req, null, next);
      // The viewmode should be populated now to the default.
      assert.equal(req.params, undefined);
    });

  });

  describe('browser subapp display tree', function() {
    var Y, browser, container, hits, ns, resetHits;

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
                minimized: false,
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
          'juju-tests-utils',
          'subapp-browser', function(Y) {
            ns = Y.namespace('juju.subapps');
            done();
          });
    });

    beforeEach(function() {
      container = Y.namespace('juju-tests.utils').makeContainer('container');
      Y.Node.create('<div id="subapp-browser-min"><div id="subapp-browser">' +
          '</div></div>').appendTo(container);

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
      browser.minimized = function() {
        hits.minimized = true;
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


    it('/ dispatches correctly', function() {
      var req = {
        path: '/'
      };
      var expected = Y.merge(hits, {
        sidebar: true,
        renderEditorial: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('viewmodes we do not support do not route', function() {
      var req = {
        path: '/ignoreme/',
        params: {
          viewmode: 'ignoreme'
        }
      };
      var expected = Y.merge(hits);

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('resets filters when navigating away from search', function() {
      browser._viewState.search = true;
      browser._filter.set('text', 'foo');
      browser._getStateUrl({search: false});
      assert.equal('', browser._filter.get('text'));
    });

    it('viewmodes are not a valid charm id', function() {
      var req = {
        path: '/sidebar/',
        params: {
          viewmode: 'sidebar',
          id: 'sidebar'
        }
      };
      var expected = Y.merge(hits, {
        sidebar: true,
        renderEditorial: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('search is not a valid charm id', function() {
      var req = {
        path: '/sidebar/search',
        params: {
          viewmode: 'sidebar',
          id: 'search'
        }
      };
      var expected = Y.merge(hits, {
        sidebar: true,
        renderSearchResults: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('search is not a valid part of a charm id', function() {
      var req = {
        path: '/sidebar/search/precise/cassandra-1',
        params: {
          viewmode: 'sidebar',
          id: 'search/precise/cassandra-1'
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

    it('/sidebar dispatches correctly', function() {
      var req = {
        path: '/sidebar/',
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

    it('/charmid dispatches correctly', function() {
      var req = {
        path: '/precise/apache2-2',
        params: {
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

    it('/sidebar/charmid dispatches correctly', function() {
      var req = {
        path: '/sidebar/precise/apache2-2',
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

    it('/sidebar/search/charmid dispatches correctly', function() {
      var req = {
        path: '/sidebar/search/precise/apache2-2',
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

    it('/fullscreen dispatches correctly', function() {
      var req = {
        path: '/fullscreen/',
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

    it('/fullscreen/charmid dispatches correctly', function() {
      var req = {
        path: '/fullscreen/precise/apache2-2',
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

    it('/fullscreen/search/charmid dispatches correctly', function() {
      var req = {
        path: '/fullscreen/search/precise/apache2-2',
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

    it('/sidebar to /sidebar/charmid dispatches correctly', function() {
      var req = {
        path: '/sidebar/',
        params: {
          viewmode: 'sidebar'
        }
      };
      browser.routeView(req, undefined, function() {});

      // Now route through to the charmid from here and we should not hit the
      // editorial content again.
      resetHits();
      req = {
        path: '/sidebar/precise/apache2-2',
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

    it('/sidebar/charmid to /sidebar dispatchse correctly', function() {
      var req = {
        path: '/sidebar/precise/apache2-2',
        params: {
          viewmode: 'sidebar',
          id: 'precise/apache2-2'
        }
      };
      browser.routeView(req, undefined, function() {});

      // Reset the hits and we should not redraw anything to update the view.
      resetHits();
      req = {
        path: '/sidebar/',
        params: {
          viewmode: 'sidebar'
        }
      };

      var expected = Y.merge(hits, {});
      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('/fullscreen to /fullscreen/charmid dispatches correctly', function() {
      var req = {
        path: '/fullscreen/',
        params: {
          viewmode: 'fullscreen'
        }
      };
      browser.routeView(req, undefined, function() {});

      // Now route through to the charmid from here and we should not hit the
      // editorial content again.
      resetHits();
      req = {
        path: '/fullscreen/precise/apache2-2',
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

    it('/fullscreen/details to /fullscreen renders editorial', function() {
      var req = {
        path: '/fullscreen/precise/apache2-2',
        params: {
          viewmode: 'fullscreen',
          id: 'precise/apache2-2'
        }
      };
      browser.routeView(req, undefined, function() {});

      // Reset the hits and we should not redraw anything to update the view.
      resetHits();
      req = {
        path: '/fullscreen/',
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

    it('/sidebar to /fullscreen dispatches correctly', function() {
      var req = {
        path: '/sidebar',
        params: {
          viewmode: 'sidebar'
        }
      };
      browser.routeView(req, undefined, function() {});

      // Reset the hits and we should not redraw anything to update the view.
      resetHits();
      req = {
        path: '/fullscreen/',
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

    it('changing the query string dispatches correctly', function() {
      var req = {
        path: '/fullscreen/search/',
        params: {
          viewmode: 'fullscreen'
        },
        query: {
          text: 'test'
        }
      };
      browser.routeView(req, undefined, function() {});

      // Reset the hits and we should not redraw anything to update the view.
      resetHits();
      req.query.text = 'test2';

      var expected = Y.merge(hits, {
        renderSearchResults: true
      });
      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('no change to query string does not redraw', function() {
      var req = {
        path: '/fullscreen/search/',
        params: {
          viewmode: 'fullscreen'
        },
        query: {
          text: 'test'
        }
      };
      browser.routeView(req, undefined, function() {});

      // Reset the hits and we should not redraw anything to update the view.
      resetHits();

      var expected = Y.merge(hits);
      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('searches without a query string function', function() {
      var req = {
        path: '/fullscreen/search/',
        params: {
          viewmode: 'fullscreen'
        }
      };

      var expected = Y.merge(hits, {
        fullscreen: true,
        renderSearchResults: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('back from searching dispatches editorial', function() {
      var req = {
        path: '/sidebar/search/',
        params: {
          viewmode: 'sidebar'
        }
      };
      browser.routeView(req, undefined, function() {});

      resetHits();

      // Now update the request to be back to /sidebar.
      req = {
        path: '/sidebar/',
        params: {
          viewmode: 'sidebar'
        }
      };
      browser.routeView(req, undefined, function() {});

      // The viewmode did not change so we don't hit sidebar again.
      var expected = Y.merge(hits, {
        sidebar: false,
        renderSearchResults: false,
        renderEditorial: true
      });
      assert.deepEqual(hits, expected);
    });

    it('/minimized dispatches correctly', function() {
      var req = {
        path: '/minimized',
        params: {
          viewmode: 'minimized'
        }
      };

      var expected = Y.merge(hits, {
        minimized: true
      });

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);
    });

    it('when hidden the browser avoids routing', function() {
      browser.hidden = true;

      var req = {
        path: '/minimized',
        params: {
          viewmode: 'minimized'
        }
      };
      var expected = Y.merge(hits);

      browser.routeView(req, undefined, function() {});
      assert.deepEqual(hits, expected);

      // And both nodes are hidden.
      var minNode = Y.one('#subapp-browser-min');
      var browserNode = Y.one('#subapp-browser');

      minNode.getComputedStyle('display').should.eql('none');
      browserNode.getComputedStyle('display').should.eql('none');
    });

    it('knows when the search cache should be updated', function() {
      browser._getStateUrl({
        'search': true,
        'querystring': 'text=apache'
      });
      assert.isTrue(browser._searchChanged());
      browser._getStateUrl({
        'search': true,
        'querystring': 'text=apache'
      });
      assert.isFalse(browser._searchChanged());
      browser._getStateUrl({
        'search': true,
        'querystring': 'text=ceph'
      });
      assert.isTrue(browser._searchChanged());
    });
  });
})();
