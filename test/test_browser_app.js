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

  var addBrowserContainer = function(Y, container) {
    Y.Node.create([
      '<div id="content">',
      '<div id="browser-nav">',
      '<div class="sidebar"></div>',
      '<div class="fullscreen"</div>',
      '</div>',
      '<div id="subapp-browser-min"></div>',
      '<div id="subapp-browser"></div>',
      '</div>'
    ].join('')).appendTo(container);
  };

  (function() {
    describe('browser fullscreen view', function() {
      var container, FullScreen, view, views, Y;

      before(function(done) {
        Y = YUI(GlobalConfig).use(
            'juju-views',
            'juju-browser',
            'juju-tests-utils',
            'subapp-browser-fullscreen', function(Y) {
              views = Y.namespace('juju.browser.views');
              FullScreen = views.FullScreen;
              done();
            });
      });

      beforeEach(function() {
        container = Y.namespace('juju-tests.utils').makeContainer('container');
        addBrowserContainer(Y, container);
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

      it('knows that it is fullscreen', function() {
        view = new FullScreen();
        view.isFullscreen().should.equal(true);
      });

      // Ensure the search results are rendered inside the container.
      it('must correctly render the initial browser ui', function() {
        var container = Y.one('#subapp-browser');
        view = new FullScreen({
          store: new Y.juju.charmworld.APIv2({
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
        assert.isTrue(Y.Lang.isObject(container.one('#bws-fullscreen')));
        // Also verify that the search widget has rendered into the view code.
        assert.isTrue(Y.Lang.isObject(container.one('input')));

        // The default is to now show the home buttons on the widget.
        assert.isFalse(view.get('withHome'));
      });

      it('must show the home icons when withHome is set', function() {
        var container = Y.one('#subapp-browser'),
            fakeStore = new Y.juju.charmworld.APIv2({});

        view = new FullScreen({
          store: fakeStore,
          withHome: true
        });
        view.render(container);

        // The default is to now show the home buttons on the widget.
        assert.isTrue(view.get('withHome'));
      });

      it('shows the home icons if the withHome is changed', function(done) {
        var container = Y.one('#subapp-browser'),
            fakeStore = new Y.juju.charmworld.APIv2({});

        view = new FullScreen({
          store: fakeStore
        });
        view.render(container);

        view.search.showHome = function() {
          // The only way to exit the test is that we hit this callback bound to
          // the change event we trigger below.
          done();
        };

        view.set('withHome', true);
      });

      it('routes home when it catches a gohome event', function(done) {
        var container = Y.one('#subapp-browser'),
            fakeStore = new Y.juju.charmworld.APIv2({});
        view = new FullScreen({
          store: fakeStore
        });
        view.on('viewNavigate', function(ev) {
          assert.equal(ev.change.search, false);
          assert.equal(ev.change.filter.clear, true);
          assert.equal(ev.change.hash, undefined);
          done();
        });

        view.render(container);
        view.search._onHome({
          halt: function() {}
        });
      });

      it('resets charmid and hash on search', function(done) {
        var container = Y.one('#subapp-browser'),
            fakeStore = new Y.juju.charmworld.APIv2({});
        view = new FullScreen({
          charmID: 'precise/jenkins-13'
        });

        view.on('viewNavigate', function(ev) {
          assert.equal(ev.change.filter.text, 'test search');
          assert.equal(ev.change.charmID, undefined);
          assert.equal(ev.change.hash, undefined);
          done();
        });

        view.render(container);
        view._searchChanged({
          newVal: 'test search'
        });
      });

    });
  })();

  (function() {
    describe('browser minimzed view', function() {
      var Y, container, view, views, Minimized;

      before(function(done) {
        Y = YUI(GlobalConfig).use(
            'juju-browser',
            'juju-models',
            'juju-views',
            'juju-tests-utils',
            'subapp-browser-minimized',
            function(Y) {
              views = Y.namespace('juju.browser.views');
              Minimized = views.MinimizedView;
              done();
            });
      });

      beforeEach(function() {
        container = Y.namespace('juju-tests.utils').makeContainer('container');
        addBrowserContainer(Y, container);
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

      it('toggles to sidebar', function(done) {
        var container = Y.one('#subapp-browser');
        view = new Minimized();
        view.on('viewNavigate', function(ev) {
          assert(ev.change.viewmode === 'sidebar');
          done();
        });
        view.render(container);
        view.controls._toggleViewable({halt: function() {}});
      });
    });
  })();

  (function() {
    describe('browser sidebar view', function() {
      var Y, container, view, views, Sidebar;

      before(function(done) {
        Y = YUI(GlobalConfig).use(
            'juju-browser',
            'juju-models',
            'juju-views',
            'juju-tests-utils',
            'node-event-simulate',
            'subapp-browser-sidebar',
            function(Y) {
              views = Y.namespace('juju.browser.views');
              Sidebar = views.Sidebar;
              done();
            });
      });

      beforeEach(function() {
        container = Y.namespace('juju-tests.utils').makeContainer('container');
        addBrowserContainer(Y, container);
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

      it('must correctly render the initial browser ui', function(done) {
        var container = Y.one('#subapp-browser');
        view = new Sidebar({
          container: container,
          store: new Y.juju.charmworld.APIv2({
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
        view.render();

        // And the hide button is rendered to the container node.
        assert.isTrue(Y.Lang.isObject(container.one('#bws-sidebar')));
        // Also verify that the search widget has rendered into the view code.
        assert.isTrue(Y.Lang.isObject(container.one('input')));

        // The home buttons are not visible by default.
        assert.isFalse(view.get('withHome'));
        assert.isTrue(container.one('.browser-nav').hasClass('hidden'));

        // Yet changing the attribute triggers it to go.
        view.search.showHome = function() {
          // The only way to exit the test is that we hit this callback bound to
          // the change event we trigger below.
          done();
        };
        view.set('withHome', true);
      });

      it('shows the home icon when instructed', function() {
        var container = Y.one('#subapp-browser');
        view = new Sidebar({
          store: new Y.juju.charmworld.APIv2({
            apiHost: 'http://localhost'
          }),
          withHome: true
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

        // The home buttons are not visible by default.
        assert.isTrue(view.get('withHome'));
        assert.isFalse(container.one('.browser-nav').hasClass('hidden'));

      });

      it('routes home when it catches a gohome event', function(done) {
        var container = Y.one('#subapp-browser'),
            fakeStore = new Y.juju.charmworld.APIv2({});
        view = new Sidebar({
          store: fakeStore
        });
        view.on('viewNavigate', function(ev) {
          assert.equal(ev.change.search, false);
          assert.equal(ev.change.filter.clear, true);
          done();
        });

        view.render(container);
        view.search._onHome({
          halt: function() {}
        });
      });

    });
  })();


  (function() {
    describe('browser app', function() {
      var Y, app, browser, CharmworldAPI, container, next;

      before(function(done) {
        Y = YUI(GlobalConfig).use(
            'app-subapp-extension',
            'juju-browser',
            'juju-charm-store',
            'juju-tests-utils',
            'juju-views',
            'subapp-browser', function(Y) {
              browser = Y.namespace('juju.subapps');
              CharmworldAPI = Y.namespace('juju').charmworld.APIv2;
              next = function() {};
              done();
            });
      });

      beforeEach(function() {
        // Mock out a dummy location for the Store used in view instances.
        window.juju_config = {
          charmworldURL: 'http://localhost'
        };
        container = Y.namespace('juju-tests.utils').makeContainer('container');
        addBrowserContainer(Y, container);

      });

      afterEach(function() {
        if (app) {
          app.destroy();
        }
        container.remove(true);
        window.juju_config = undefined;
      });

      it('verify that route callables exist', function() {
        app = new browser.Browser();
        Y.each(app.get('routes'), function(route) {
          assert.isTrue(typeof app[route.callback] === 'function');
        });
      });

      it('verify that route callables exist', function() {
        app = new browser.Browser();
        Y.each(app.get('routes'), function(route) {
          assert.isTrue(typeof app[route.callback] === 'function');
        });
      });

      it('can go to a default jujucharms landing page', function() {
        app = new browser.Browser({isJujucharms: true});
        var called = false;
        app.jujucharms = function() {
          called = true;
        };
        var req = {
          path: '/'
        };

        app.routeDefault(req, null, next);
        assert.isTrue(called);
      });

      it('resets using initState', function() {
        app = new browser.Browser();
        var mockView = {
          destroy: function() {}
        };
        app._sidebar = mockView;
        app._minimized = mockView;
        app._fullscreen = mockView;

        // Setup some previous state to check for clearing.
        app._oldState.viewmode = 'fullscreen';
        app._viewState.viewmode = 'sidebar';

        app.initState();

        assert.equal(app._sidebar, undefined, 'sidebar is removed');
        assert.equal(app._fullscreen, undefined, 'fullscreen is removed');
        assert.equal(app._minimized, undefined, 'minimized is removed');
        assert.equal(app._oldState.viewmode, null, 'old state is reset');
        assert.equal(app._viewState.viewmode, null, 'view state is reset');
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

      it('* route uses the default viewmode', function() {
        app = new browser.Browser({defaultViewmode: 'sidebar'});
        app.sidebar = function() {};
        var req = {
          path: '/'
        };

        app.routeDefault(req, null, next);
        // The viewmode should be populated now to the default.
        assert.equal(req.params.viewmode, 'sidebar');

        app = new browser.Browser({defaultViewmode: 'fullscreen'});
        app.fullscreen = function() {};
        req = {
          path: '/'
        };
        app.routeDefault(req, null, next);
        assert.equal(req.params.viewmode, 'fullscreen');
      });

      it('prevents * route from doing more than the default', function() {
        app = new browser.Browser({defaultViewmode: 'sidebar'});
        var req = {
          path: '/sidebar'
        };

        app.routeDefault(req, null, next);
        // The viewmode is ignored. This path isn't meant for this route
        // callable to deal with at all.
        assert.equal(req.params, undefined);

        app = new browser.Browser({defaultViewmode: 'fullscreen'});
        req = {
          path: '/fullscreen'
        };
        app.routeDefault(req, null, next);
        assert.equal(req.params, undefined);
      });

      it('/charm/id routes to the default view correctly', function() {
        app = new browser.Browser({
          store: new CharmworldAPI({
            'apiHost': 'http://localhost'
          })
        });
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

      it('directCharmId skips routes starting with viewmode', function(done) {
        app = new browser.Browser({
          store: new CharmworldAPI({
            'apiHost': 'http://localhost'
          })
        });
        // Stub out the sidebar so we don't render anything.
        app.sidebar = function() {};
        var req = {
          path: '/fullscreen/precise/mysql-10/'
        };

        var testNext = function() {
          // The request params should not be defined or have a viewmode set
          // since the callable bailed out and called next() since it's not to
          // meant to handle this route.
          assert.equal(req.params, undefined);
          done();
        };

        app.routeDirectCharmId(req, null, testNext);
      });

      it('/charm/id handles routes for new charms correctly', function() {
        app = new browser.Browser({
          store: new CharmworldAPI({
            'apiHost': 'http://localhost'
          })
        });
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

        // It takes into account hash.
        url = app._getStateUrl({
          viewmode: 'fullscreen',
          charmID: undefined,
          hash: '#bws-readme',
          search: undefined,
          filter: undefined
        });
        assert.equal(url, 'fullscreen#bws-readme');

        // It always puts the hash last.
        url = app._getStateUrl({
          viewmode: 'fullscreen',
          charmID: 'precise/jenkins-2',
          hash: '#bws-readme',
          search: true,
          querystring: 'text=jenkins'
        });
        assert.equal(
            url,
            'fullscreen/search/precise/jenkins-2?text=jenkins#bws-readme');
      });

      it('/charm/id router ignores other urls', function() {
        app = new browser.Browser({
          store: new CharmworldAPI({
            'apiHost': 'http://localhost',
            'noop': true
          })
        });
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

      it('fullscreen destroys old views not required', function(done) {
        var searchCleaned = false,
            editorialCleaned = false;

        app = new browser.Browser({
          store: new CharmworldAPI({
            'apiHost': 'http://localhost',
            'noop': true
          })
        });

        app._search = {
          destroy: function() {
            searchCleaned = true;
          }
        };
        app._editorial = {
          destroy: function() {
            editorialCleaned = true;
          }
        };

        // We'll hit the default renderEditorial so stub that out as the catch
        // that out test is done.
        app._shouldShowCharm = function() { return true; };
        app.renderEntityDetails = function() {
          assert.equal(searchCleaned, true);
          assert.equal(editorialCleaned, true);
          done();
        };

        app.fullscreen({}, {}, function() {});
      });

    });

    describe('browser subapp display tree', function() {
      var Y, browser, container, fullscreenRender, hits, minRender, ns,
          resetHits, sidebarRender;

      before(function(done) {
        Y = YUI(GlobalConfig).use(
            'app-subapp-extension',
            'juju-views',
            'juju-browser',
            'juju-tests-utils',
            'subapp-browser', function(Y) {
              browser = Y.namespace('juju.subapps');

              resetHits = function() {
                hits = {
                  fullscreen: false,
                  minimized: false,
                  sidebar: false,
                  renderCharmDetails: false,
                  renderEditorial: false,
                  renderOnboarding: false,
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
        addBrowserContainer(Y, container);

        // Track which render functions are hit.
        resetHits();

        // Mock out a dummy location for the Store used in view instances.
        window.juju_config = {
          charmworldURL: 'http://localhost'
        };

        browser = new ns.Browser();
        // Block out each render target so we only track it was hit.
        browser.renderEntityDetails = function() {
          hits.renderCharmDetails = true;
        };
        browser.renderEditorial = function() {
          hits.renderEditorial = true;
        };
        browser.renderOnboarding = function() {
          hits.renderOnboarding = true;
        };
        browser.renderSearchResults = function() {
          hits.renderSearchResults = true;
        };
        browser.minimized = function() {
          hits.minimized = true;
        };
        // We can't just replace the sidebar method as it does logic for
        // future routing. We need to hook directly into the Sidebar view's
        // render() method to make sure it's called.
        sidebarRender = Y.juju.browser.views.Sidebar.prototype.render;
        Y.juju.browser.views.Sidebar.prototype.render = function() {
          hits.sidebar = true;
        };
        fullscreenRender = Y.juju.browser.views.FullScreen.prototype.render;
        Y.juju.browser.views.FullScreen.prototype.render = function() {
          hits.fullscreen = true;
        };
        minRender = Y.juju.browser.views.MinimizedView.prototype.render;
        Y.juju.browser.views.MinimizedView.prototype.render = function() {
          hits.minimized = true;
        };
        browser.showView = function(view) {
          hits[view] = true;
        };
      });

      afterEach(function() {
        browser.destroy();
        Y.one('#subapp-browser').remove(true);
        // Replace the render methods for the main views we replaced for
        // testing hits.
        Y.juju.browser.views.Sidebar.prototype.render = sidebarRender;
        Y.juju.browser.views.FullScreen.prototype.render = fullscreenRender;
        Y.juju.browser.views.MinimizedView.prototype.render = minRender;
        container.remove(true);
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
        // Set the state before changing up.
        browser._saveState();
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
        window.stop = true;
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

        // And the sidebar view should be detached from the subapp now since
        // it's been replaced.
        assert.equal(browser._sidebar, undefined);
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

      it('onboarding is called in build mode', function() {
        window.flags.onboard = true;
        var req = {
          path: '/sidebar/',
          params: {
            viewmode: 'sidebar'
          }
        };
        var expected = Y.merge(hits, {
          sidebar: true,
          renderEditorial: true,
          renderOnboarding: true
        });

        browser.routeView(req, undefined, function() {});
        assert.deepEqual(hits, expected);
        window.flags.onboard = {};
      });

      it('onboarding is not called with a charm id', function() {
        window.flags.onboard = true;
        var req = {
          path: '/sidebar/',
          params: {
            viewmode: 'sidebar',
            id: '/precise/mysql'
          }
        };
        var expected = Y.merge(hits, {
          sidebar: true,
          renderEditorial: true,
          renderCharmDetails: true,
          renderOnboarding: false
        });

        browser.routeView(req, undefined, function() {});
        assert.deepEqual(hits, expected);
        window.flags.onboard = {};
      });

      it('onboarding is not called with a search', function() {
        window.flags.onboard = true;
        var req = {
          path: '/sidebar/search',
          params: {
            viewmode: 'sidebar',
            id: 'search'
          }
        };
        var expected = Y.merge(hits, {
          sidebar: true,
          renderSearchResults: true,
          renderOnboarding: false
        });

        browser.routeView(req, undefined, function() {});
        assert.deepEqual(hits, expected);
        window.flags.onboard = {};
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
        // XXX bug:1217383
        // We also want to verify that the old views are cleared to avoid
        // having hidden views doing UX work for us.
        var hitCount = 0;
        var mockView = {
          destroy: function() {
            hitCount = hitCount + 1;
          }
        };
        browser._sidebar = mockView;
        browser._minimized = mockView;
        browser._fullscreen = mockView;

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

        assert.equal(hitCount, 3);

        // The view state needs to also be sync'd and updated even though
        // we're hidden so that we can detect changes in the app state across
        // requests while hidden.
        assert.equal(browser._oldState.viewmode, 'minimized');
      });

      it('knows when the search cache should be updated', function() {
        browser._getStateUrl({
          'search': true,
          'querystring': 'text=apache'
        });
        assert.isTrue(browser._searchChanged());
        browser._saveState();
        browser._getStateUrl({
          'search': true,
          'querystring': 'text=apache'
        });
        assert.isFalse(browser._searchChanged());
        browser._saveState();
        browser._getStateUrl({
          'search': true,
          'querystring': 'text=ceph'
        });
        assert.isTrue(browser._searchChanged());
        browser._saveState();
      });

      it('permits a filter clear command', function() {
        var url = browser._getStateUrl({
          'search': true,
          'filter': {
            text: 'apache'
          }
        });

        // We have a good valid search.
        assert.equal(url, '/search?text=apache');

        // Now let's clear it and make sure it's emptied.
        url = browser._getStateUrl({
          'filter': {
            clear: true
          }
        });
        assert.equal(url, '/search');
      });

      it('permits a filter replace command', function() {
        var url = browser._getStateUrl({
          'search': true,
          'filter': {
            text: 'apache',
            categories: ['app-servers']
          }
        });
        // We have a good valid search.
        assert.equal(
            url,
            '/search?categories=app-servers&text=apache');

        // Now let's update it and force all the rest to go away.
        url = browser._getStateUrl({
          'filter': {
            replace: true,
            text: 'mysql'
          }
        });
        assert.equal(url, '/search?text=mysql');
      });

      it('re-renders charm details with the sidebar', function() {
        // Set a charm identifier in the view state, and patch the old state
        // so that it is no different than the current one.
        browser._viewState.charmID = 'precise/mediawiki-10';
        browser._oldState = browser._viewState;
        // Call the sidebar method and ensure the charm detail is re-rendered.
        browser.sidebar({path: '/'}, null, function() {});
        assert.isTrue(hits.renderCharmDetails);
      });
    });
  })();
})();
