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
      '<div id="navbar">',
      '<div id="browser-nav"></div>',
      '</div>',
      '<div id="content">',
      '<div id="subapp-browser">',
      '</div>',
      '</div>'
    ].join('')).appendTo(container);
  };

  var addSidebarContainer = function(Y, container) {
    Y.Node.create([
      '<div class="charmbrowser">',
      '<div id="bws-sidebar">',
      '<div class="bws-header">',
      '</div>',
      '<div class="bws-content">',
      '</div>',
      '</div>',
      '<div class="bws-view-data content-panel">',
      '<div></div>',
      '</div>',
      '</div>'
    ].join('')).appendTo(container);
  };

  (function() {
    describe('browser sidebar view', function() {
      var Y, cleanIconHelper, container, sampleData, utils, view, views, View;

      before(function(done) {
        Y = YUI(GlobalConfig).use(
            'juju-browser',
            'juju-models',
            'juju-views',
            'juju-tests-utils',
            'subapp-browser-sidebar',
            function(Y) {
              views = Y.namespace('juju.browser.views');
              utils = Y.namespace('juju-tests.utils');
              View = views.EditorialView;
              cleanIconHelper = utils.stubCharmIconPath();
              sampleData = utils.loadFixture('data/interesting.json');
              done();
            });
      });

      beforeEach(function() {
        container = utils.makeContainer(this, 'container');
        addBrowserContainer(Y, container);
        addSidebarContainer(Y, container.one('#subapp-browser'));

        // Mock up store stuff
        var fakeStore = new Y.juju.charmworld.APIv3({});
        fakeStore.set('datasource', {
          sendRequest: function(params) {
            // Stubbing the server callback value
            params.callback.success({
              response: {
                results: [{
                  responseText: sampleData
                }]
              }
            });
          }
        });
        window.juju_config = {
          charmworldURL: 'http://localhost'
        };

        // Setup the view under test
        view = new View({
          store: fakeStore,
          renderTo: container.one('.bws-content')
        });
      });

      afterEach(function() {
        view.destroy();
        delete window.juju_config;
      });

      after(function() {
        cleanIconHelper();
      });

      it('must correctly render the initial browser ui', function() {
        view.render();

        // Make sure the sidebar is there
        assert.notEqual(Y.one('#bws-sidebar'), null,
                        'sidebar is not present');
        // Also verify that the search widget has rendered into the view code.
        assert.notEqual(container.one('input'), null,
                        'search widget is not present');

        // The home buttons are not visible by default.
        assert.equal(view.get('withHome'), false,
                     'withHome is true on the view');
        assert.equal(Y.one('#bws-sidebar').hasClass('with-home'),
                     false, 'with-home class is set');

        // Yet changing the attribute triggers it to go.
        view.set('withHome', true);
        assert.equal(view.get('withHome'), true,
                     'withHome is false on the view');
        assert.equal(Y.one('#bws-sidebar').hasClass('with-home'),
                     true, 'with-home class is not set');
      });

      it('shows the home icon when instructed', function() {
        view.set('withHome', true);
        view.render();

        // The home buttons are not visible by default.
        assert.isTrue(view.get('withHome'));
        assert.isFalse(Y.one('#bws-sidebar').hasClass('with-home'));
      });

      it('routes home when it catches a gohome event', function(done) {
        view.on('viewNavigate', function(ev) {
          assert.equal(ev.change.search, false);
          assert.equal(ev.change.filter.clear, true);
          done();
        });

        view.render();
        view.search._onHome({
          preventDefault: function() {}
        });
      });

      it('picks up the search widget deploy event', function(done) {
        var container = Y.one('#subapp-browser');
        view.set('charmID', 'precise/jenkins-13');

        view._deployEntity = function() {
          container.remove(true);
          done();
        };

        view.render();
        view.search.fire(view.search.EVT_DEPLOY);
      });

    });
  })();


  (function() {
    describe('browser app', function() {
      var Y, app, browser, CharmworldAPI, container, next, utils;

      before(function(done) {
        Y = YUI(GlobalConfig).use(
            'app-subapp-extension',
            'juju-browser',
            'juju-charm-store',
            'juju-tests-utils',
            'juju-views',
            'subapp-browser', function(Y) {
              browser = Y.namespace('juju.subapps');
              CharmworldAPI = Y.namespace('juju').charmworld.APIv3;
              utils = Y.namespace('juju-tests.utils');
              next = function() {};
              done();
            });
      });

      beforeEach(function() {
        // Mock out a dummy location for the Store used in view instances.
        window.juju_config = {
          charmworldURL: 'http://localhost'
        };
        container = utils.makeContainer(this, 'container');
        addBrowserContainer(Y, container);

      });

      afterEach(function() {
        if (app) {
          app.destroy();
        }
        window.juju_config = undefined;
      });

      describe('state dispatchers', function() {
        var editorialStub, searchStub, entityStub, showSearchStub;
        beforeEach(function() {
          app = new browser.Browser();
          app._sidebar = {
            destroy: utils.makeStubFunction()
          };
        });
        afterEach(function() {
          if (app) { app.destroy(); }
        });

        describe('_charmbrowser', function() {
          function stubRenderers(context) {
            editorialStub = utils.makeStubMethod(app, 'renderEditorial');
            context._cleanups.push(editorialStub.reset);
            searchStub = utils.makeStubMethod(app, 'renderSearchResults');
            context._cleanups.push(searchStub.reset);
            entityStub = utils.makeStubMethod(app, 'renderEntityDetails');
            context._cleanups.push(entityStub.reset);
            showSearchStub = utils.makeStubMethod(app._sidebar, 'showSearch');
            context._cleanups.push(showSearchStub.reset);
          }

          function assertions(
              editorialCount, searchCount, entityCount, showSearchCount) {
            assert.equal(editorialStub.callCount(), editorialCount,
                'editorialStub');
            assert.equal(searchStub.callCount(), searchCount, 'searchStub');
            assert.equal(entityStub.callCount(), entityCount, 'entityStub');
            assert.equal(showSearchStub.callCount(), showSearchCount,
                'showSearchStub');
          }

          it('renders the editorial when no metadata is provided', function() {
            stubRenderers(this);
            app._charmbrowser(undefined);
            assertions(1, 0, 0, 1);
          });

          it('renders the editorial when no search is provided', function() {
            stubRenderers(this);
            app._charmbrowser({});
            assertions(1, 0, 0, 1);
          });

          it('renders search results when search is provided', function() {
            stubRenderers(this);
            app._charmbrowser({
              search: 'foo'
            });
            assertions(0, 1, 0, 1);
          });

          it('renders & editorial charm details with id provided', function() {
            stubRenderers(this);
            app._charmbrowser({
              id: 'foo'
            });
            assertions(1, 0, 1, 2);
          });

          it('renders search and charm details', function() {
            stubRenderers(this);
            app._charmbrowser({
              search: 'foo',
              id: 'foo'
            });
            assertions(0, 1, 1, 2);
          });

          it('does not rerender the editorial if it exists', function() {
            stubRenderers(this);
            // Start with an exisiting editorial so that the test skips
            // the creation.
            app._editorial = {};
            var activeStub = utils.makeStubMethod(app._editorial,
                'updateActive');
            this._cleanups.push(activeStub.reset);
            app._charmbrowser();
            assertions(0, 0, 0, 1);
          });

          it('deselects the last active charm', function() {
            stubRenderers(this);
            // Start with an exisiting editorial so that the test skips
            // the creation.
            app._editorial = {};
            var activeStub = utils.makeStubMethod(app._editorial,
                'updateActive');
            this._cleanups.push(activeStub.reset);
            app._charmbrowser();
            assert.equal(activeStub.callCount(), 1);
          });
        });

        describe('_inspector', function() {
          var clientId,
              ghostStub,
              requestSeriesStub,
              serviceStub,
              upgradeOrNewStub;

          function stubMethods(context) {
            ghostStub = utils.makeStubMethod(app, 'createGhostInspector');
            context._cleanups.push(ghostStub.reset);
            serviceStub = utils.makeStubMethod(app, 'createServiceInspector');
            context._cleanups.push(serviceStub.reset);
            requestSeriesStub = utils.makeStubMethod(
                app, 'createRequestSeriesInspector');
            context._cleanups.push(requestSeriesStub.reset);
            upgradeOrNewStub = utils.makeStubMethod(
                app, 'createUpgradeOrNewInspector');
            context._cleanups.push(upgradeOrNewStub.reset);
          }

          function stubDb(app, ghost) {
            clientId = 'foo';
            var db = {
              services: {
                some: function(callback) {
                  callback({
                    get: function(val) {
                      if (val === 'config') {
                        if (ghost) {
                          return false;
                        } else {
                          return true;
                        }
                      } else {
                        return clientId;
                      }
                    }
                  });
                }
              }
            };
            app.set('db', db);
          }

          it('renders a ghost inspector', function() {
            stubMethods(this);
            stubDb(app, true);
            app._inspector({ id: clientId });
            assert.equal(ghostStub.callCount(), 1);
            assert.equal(serviceStub.callCount(), 0);
            assert.equal(requestSeriesStub.callCount(), 0);
            assert.equal(upgradeOrNewStub.callCount(), 0);
          });

          it('renders a service inspector', function() {
            stubMethods(this);
            stubDb(app, false);
            app._inspector({ id: clientId });
            assert.equal(ghostStub.callCount(), 0);
            assert.equal(serviceStub.callCount(), 1);
            assert.equal(requestSeriesStub.callCount(), 0);
            assert.equal(upgradeOrNewStub.callCount(), 0);
          });

          it('renders a request-series local charm inspector', function() {
            stubMethods(this);
            stubDb(app, true);
            app._inspector({
              localType: 'new',
              flash: { file: 'foo' }
            });
            assert.equal(ghostStub.callCount(), 0);
            assert.equal(serviceStub.callCount(), 0);
            assert.equal(requestSeriesStub.callCount(), 1);
            assert.equal(upgradeOrNewStub.callCount(), 0);
          });

          it('renders an upgrade-or-new inspector', function() {
            stubMethods(this);
            stubDb(app, true);
            app._inspector({
              localType: 'upgrade',
              flash: {
                file: 'foo',
                services: ['bar']
              }
            });
            assert.equal(ghostStub.callCount(), 0);
            assert.equal(serviceStub.callCount(), 0);
            assert.equal(requestSeriesStub.callCount(), 0);
            assert.equal(upgradeOrNewStub.callCount(), 1);
          });
        });

        describe('emptySections', function() {
          function stubMethods(app) {
            app._editorial = { destroy: utils.makeStubFunction() };
            app._search = { destroy: utils.makeStubFunction() };
            app._sidebar = {
              search: {},
              destroy: function() {},
              hideSearch: utils.makeStubFunction() };
            app._details = { destroy: utils.makeStubFunction() };
            app.machineViewPanel = { destroy: utils.makeStubFunction() };
          }

          it('emptySectionA', function() {
            stubMethods(app);
            var bwsdata = utils.makeContainer(this),
                destroyMethod = app._editorial.destroy,
                destroyCalled = false;
            bwsdata.addClass('bws-view-data');
            // The original destroy method is set to null after the
            // destroy is called so we need to stub out the method here
            // so that we can track the destroy.
            app._editorial.destroy = function() {
              destroyCalled = true;
              app._editorial.destroy = destroyMethod;
            };
            app.emptySectionA();
            assert.equal(destroyCalled, true);
            assert.equal(app._search.destroy.callCount(), 1);
            assert.equal(app._sidebar.hideSearch.callCount(), 1);
            assert.equal(app._details.destroy.callCount(), 1);
            assert.equal(bwsdata.getStyle('display'), 'none');
          });

          it('emptySectionB', function() {
            stubMethods(app);
            app.emptySectionB();
            assert.equal(app.machineViewPanel.destroy.callCount(), 1);
          });
        });
      });

      it('listens to serviceDeployed events', function(done) {
        app = new browser.Browser();
        var generateStub = utils.makeStubMethod(app.state, 'generateUrl');
        this._cleanups.push(generateStub.reset);
        var navigateStub = utils.makeStubMethod(app, 'navigate');
        this._cleanups.push(navigateStub.reset);
        app._activeInspector = {
          get: function() {
            return {
              get: function() {
                return 'foo'; }};
          }};
        app.on('changeState', function(e) {
          e.halt(); // stop any futher propogation of this event.
          assert.deepEqual(e.details[0], {
            sectionA: {
              component: 'inspector',
              metadata: {
                id: 'bar' }}});
          done();
        });
        app.fire('serviceDeployed', {
          clientId: 'foo',
          serviceName: 'bar'
        });
      });

      it('listens to changeState events', function() {
        app = new browser.Browser();
        var generateUrlStub = utils.makeStubMethod(
            app.state, 'generateUrl', 'genUrl');
        var navigateStub = utils.makeStubMethod(app, 'navigate');
        app.fire('changeState', {foo: 'bar'});
        assert.equal(generateUrlStub.calledOnce(), true);
        assert.deepEqual(generateUrlStub.lastArguments()[0], {foo: 'bar'});
        assert.equal(navigateStub.calledOnce(), true);
        assert.equal(navigateStub.lastArguments()[0], 'genUrl');
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

      it('resets using state init', function() {
        app = new browser.Browser();
        var mockView = {
          destroy: function() {}
        };
        app._sidebar = mockView;

        // Setup some previous state to check for clearing.
        app.state._setCurrent('viewmode', 'sidebar');

        // The old initState used to do both state initialization and clearing
        // the views. Now that state is refactored into its own object, we
        // need to call both explicitly.
        app.state.init();
        app._clearViews();

        assert.equal(app._sidebar, undefined, 'sidebar is removed');
        assert.equal(app.state.getPrevious('viewmode'), null,
                     'old state is reset');
        assert.equal(app.state.getCurrent('viewmode'), null,
                     'view state is reset');
      });

      it('correctly strips viewmode from the charmID', function() {
        app = new browser.Browser();
        var paths = [
          'foo/bar-66',
          'search/foo/bar-66',
          'sidebar/foo/bar-66',
          'sidebar/search/foo/bar-66'
        ];
        paths.map(function(id) {
          assert.equal(
              'foo/bar-66', app._stripViewMode(id),
              id + ' was not stripped correctly.'
          );
        });
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
          path: 'search'
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
      var Y, browser, container, hits, minRender, ns,
          resetHits, sidebarRender, utils;

      before(function(done) {
        Y = YUI(GlobalConfig).use(
            'app-subapp-extension',
            'juju-views',
            'juju-browser',
            'juju-tests-utils',
            'subapp-browser', function(Y) {
              browser = Y.namespace('juju.subapps');
              utils = Y.namespace('juju-tests.utils');

              resetHits = function() {
                hits = {
                  sidebar: false,
                  renderCharmDetails: false,
                  renderEditorial: false,
                  renderOnboarding: true,
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
        container = utils.makeContainer(this, 'container');
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
        // We can't just replace the sidebar method as it does logic for
        // future routing. We need to hook directly into the Sidebar view's
        // render() method to make sure it's called.
        sidebarRender = Y.juju.browser.views.Sidebar.prototype.render;
        Y.juju.browser.views.Sidebar.prototype.render = function() {
          hits.sidebar = true;
        };
        browser.showView = function(view) {
          hits[view] = true;
        };
      });

      afterEach(function() {
        browser.destroy();
        // Replace the render methods for the main views we replaced for
        // testing hits.
        Y.juju.browser.views.Sidebar.prototype.render = sidebarRender;
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

      it('/fullscreen dispatches correctly', function(done) {
        var req = {
          path: '/fullscreen/',
          params: {
            viewmode: 'fullscreen'
          }
        };

        // Fullscreen urls get redirected to / which is sidebar
        browser.navigate = function(url) {
          assert.equal(url, '');
          done();
        };

        browser.routeView(req, undefined, function() {});
      });

      it('/fullscreen/charmid dispatches correctly', function(done) {
        var req = {
          path: '/fullscreen/precise/apache2-2',
          params: {
            viewmode: 'fullscreen',
            id: 'precise/apache2-2'
          }
        };

        // Fullscreen urls get redirected to / which is sidebar
        browser.navigate = function(url) {
          assert.equal(url, 'precise/apache2-2');
          done();
        };

        browser.routeView(req, undefined, function() {});
      });

      it('/fullscreen/search/charmid dispatches correctly', function(done) {
        var req = {
          path: '/fullscreen/search/precise/apache2-2',
          params: {
            viewmode: 'fullscreen',
            id: 'precise/apache2-2'
          }
        };

        // Fullscreen urls get redirected to / which is sidebar
        browser.navigate = function(url) {
          assert.equal(url, 'sidebar/search/precise/apache2-2');
          done();
        };

        browser.routeView(req, undefined, function() {});
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

      it('changing the query string dispatches correctly', function() {
        var req = {
          path: '/search/',
          params: {
            viewmode: 'sidebar'
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
          path: '/search/',
          params: {
            viewmode: 'sidebar'
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
          path: '/search/',
          params: {
            viewmode: 'sidebar'
          }
        };

        var expected = Y.merge(hits, {
          sidebar: true,
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
      });

      it('onboarding is not called with a charm id', function() {
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
          renderOnboarding: true
        });

        browser.routeView(req, undefined, function() {});
        assert.deepEqual(hits, expected);
      });

      it('onboarding is not called with a search', function() {
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
          renderOnboarding: true
        });

        browser.routeView(req, undefined, function() {});
        assert.deepEqual(hits, expected);
      });

      it('onboarding is rendered with force-onboarding query', function(done) {
        var req = {
          path: '/sidebar'
        };

        localStorage.setItem('force-onboarding', true);

        browser.renderOnboarding = function(force) {
          assert.equal(force, 'true');
          assert.equal(localStorage.getItem('force-onboarding'), '');
          assert.deepEqual(hits.sidebar, true);
          done();
        };

        browser.routeView(req, undefined, function() {});
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

        var req = {
          path: '/',
          params: {
            viewmode: 'sidebar'
          }
        };
        var expected = Y.merge(hits);

        browser.routeView(req, undefined, function() {});
        assert.deepEqual(hits, expected);

        // And both nodes are hidden.
        var browserNode = Y.one('#subapp-browser');

        browserNode.getComputedStyle('display').should.eql('none');

        assert.equal(hitCount, 1);

        // The view state needs to also be sync'd and updated even though
        // we're hidden so that we can detect changes in the app state across
        // requests while hidden.
        assert.equal(browser.state.getPrevious('viewmode'), 'sidebar');
      });

      it('knows when the search cache should be updated', function() {
        browser.state.getUrl({
          'search': true,
          'querystring': 'text=apache'
        });
        assert.isTrue(browser._searchChanged());
        browser.state.save();
        browser.state.getUrl({
          'search': true,
          'querystring': 'text=apache'
        });
        assert.isFalse(browser._searchChanged());
        browser.state.save();
        browser.state.getUrl({
          'search': true,
          'querystring': 'text=ceph'
        });
        assert.isTrue(browser._searchChanged());
        browser.state.save();
      });

      it('knows when the search cache should be updated (state)', function() {
        window.flags.il = true;
        // This flag needs to be set before creating the charmbrowser instance
        // to get the proper settings in the charmbrowser. This can be removed
        // once the state flag is removed.
        var charmbrowser = new ns.Browser();
        charmbrowser.state.set('current', {
          sectionA: {
            component: 'charmbrowser',
            metadata: { search: 'foo' }
          }, sectionB: {}});
        assert.equal(charmbrowser._searchChanged(), true);
        window.flags = {};
      });

      it('re-renders charm details with the sidebar', function() {
        // Set a charm identifier in the view state, and patch the old state
        // so that it is no different than the current one.
        browser.state._setCurrent('charmID', 'precise/mediawiki-10');
        browser.state._previous = browser.state._current;
        // Call the sidebar method and ensure the charm detail is re-rendered.
        browser.sidebar({path: '/'}, null, function() {});
        assert.isTrue(hits.renderCharmDetails);
      });
    });
  })();
})();
