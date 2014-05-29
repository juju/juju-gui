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
      '<div class="charmbrowser">',
      '</div>',
      '</div>',
      '</div>'
    ].join('')).appendTo(container);
  };

  describe('browser', function() {
    var Y, container, utils, views;
    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-browser',
          'subapp-browser',
          'juju-models',
          'juju-views',
          'juju-tests-utils',
          'subapp-browser-sidebar',
          function(Y) {
            views = Y.namespace('juju.browser.views');
            utils = Y.namespace('juju-tests.utils');
            done();
          });
    });

    describe('sidebar view', function() {
      var view;

      afterEach(function() {
        view.destroy();
      });

      it('renders the sidebar ui', function() {
        view = new views.Sidebar();
        view.render();

        // Make sure the template is rendered into the container
        assert.notEqual(view.get('container').one('.charmbrowser'), null);
      });
    });

    describe('renderCharmBrowser', function() {
      var app, render;

      beforeEach(function() {
        // XXX window.flags.il
        window.flags = { il: true };
        app = new Y.juju.subapps.Browser({});
        app._sidebar = {
          get: function() {
            return {
              one: function() {}
            };
          },
          destroy: function() {}
        };
        render = utils.makeStubMethod(views.CharmBrowser.prototype, 'render');
        this._cleanups.push(render.reset);
      });

      afterEach(function() {
        app.destroy();
        window.flags = {};
      });

      it('creates a new instance', function() {
        assert.strictEqual(app._charmbrowser, undefined);
        app.renderCharmBrowser();
        assert.equal(app._charmbrowser instanceof views.CharmBrowser, true);
      });

      it('passes in the deploy methods on instantiation', function() {
        var deployService = 'deployServiceFn';
        var deployBundle = 'deployBundleFn';
        app.set('deployService', deployService);
        app.set('deployBundle', deployBundle);
        app.renderCharmBrowser();
        assert.equal(app._charmbrowser.get('deployService'), deployService);
        assert.equal(app._charmbrowser.get('deployBundle'), deployBundle);
      });

      it('adds the browser as a bubble target', function(done) {
        app.on('*:fooo', function() {
          // If this is never called then this test will fail.
          done();
        });
        app.renderCharmBrowser();
        app._charmbrowser.fire('fooo');
      });

      it('skips creating a new instance if one exists', function() {
        app.renderCharmBrowser();
        // Setting a nonsense attribute on the charmbrowser instance. If this
        // attribute is no longer there after rendering again, it created a
        // new instance when it shouldn't have.
        app._charmbrowser.set('flag', true);
        app.renderCharmBrowser();
        assert.equal(app._charmbrowser.get('flag'), true);
      });

      it('sets attributes every time it is called', function() {
        app.renderCharmBrowser.call(app);
        assert.equal(app._charmbrowser.get('activeID'), undefined);
        var getState = utils.makeStubMethod(app.state, 'getState', {id: 'foo'});
        this._cleanups.push(getState.reset);
        app.renderCharmBrowser.call(app);
        assert.equal(app._charmbrowser.get('activeID'), 'foo');
      });

      it('passes the metadata through to the render call', function() {
        var metadata = { foo: 'bar' };
        app.renderCharmBrowser(metadata);
        assert.deepEqual(render.lastArguments()[0], metadata);
      });

      it('calls _searchChanged and passes to render method', function() {
        var search = utils.makeStubMethod(app, '_searchChanged', true);
        this._cleanups.push(search.reset);
        app.renderCharmBrowser();
        assert.equal(render.lastArguments()[1], true);
      });

      it('renders on every call', function() {
        assert.equal(render.callCount(), 0);
        app.renderCharmBrowser();
        assert.equal(render.callCount(), 1);
        app.renderCharmBrowser();
        assert.equal(render.callCount(), 2);
      });
    });
  });

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
        var showSearchStub, setHome, renderCharmBrowser, entityStub,
            cleanupEntity, metadata;

        beforeEach(function() {
          app = new browser.Browser();
          app._sidebar = {
            destroy: utils.makeStubFunction()
          };
          app._charmbrowser = {
            get: utils.makeStubFunction()
          };
        });
        afterEach(function() {
          if (app) { app.destroy(); }
        });

        describe('_charmBrowserDispatcher', function() {
          function stubRenderers(context) {
            showSearchStub = utils.makeStubMethod(app._sidebar, 'showSearch');
            context._cleanups.push(showSearchStub.reset);
            setHome = utils.makeStubMethod(app._sidebar, 'set');
            context._cleanups.push(setHome.reset);
            renderCharmBrowser = utils.makeStubMethod(
                app, 'renderCharmBrowser');
            context._cleanups.push(renderCharmBrowser.reset);
            entityStub = utils.makeStubMethod(app, 'renderEntityDetails');
            context._cleanups.push(entityStub.reset);
            cleanupEntity = utils.makeStubMethod(app, '_cleanupEntityDetails');
            context._cleanups.push(cleanupEntity.reset);
          }

          function assertions(data) {
            assert.equal(
                renderCharmBrowser.callCount(),
                data.renderCharmBrowserCount,
                'renderCharmBrowser');
            assert.deepEqual(
                renderCharmBrowser.lastArguments()[0],
                data.renderCharmBrowserData,
                'renderCharmBrowserData');
            assert.equal(
                entityStub.callCount(),
                data.renderEntityCount,
                'entityStub');
            assert.equal(
                cleanupEntity.callCount(),
                data.cleanupEntityCount,
                'cleanupEntity');
          }

          it('calls to reneder the charmbrowser with the metadata', function() {
            stubRenderers(this);
            metadata = {};
            // Cloning the object passed in so we can see if it's modified.
            app._charmBrowserDispatcher(Y.clone(metadata));
            assertions({
              renderCharmBrowserCount: 1,
              renderCharmBrowserData: metadata,
              renderEntityCount: 0,
              cleanupEntityCount: 1
            });
          });

          it('shows the selected charm details', function() {
            stubRenderers(this);
            metadata = {
              id: 'foo'
            };
            var showStub = utils.makeStubMethod(app, '_shouldShowCharm', true);
            this._cleanups.push(showStub.reset);
            // Cloning the object passed in so we can see if it's modified.
            app._charmBrowserDispatcher(Y.clone(metadata));
            assertions({
              renderCharmBrowserCount: 1,
              renderCharmBrowserData: metadata,
              renderEntityCount: 1,
              cleanupEntityCount: 0
            });
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

          it('removes existing inspectors', function(done) {
            stubMethods(this);
            stubDb(app, false);
            app._inspector({ id: clientId });
            app._activeInspector = {
              destroy: function() {
                // If the inspector is not destroyed, the test will time out.
                done();
              }
            };
            app._inspector({ id: clientId });
          });
        });

        describe('_machine', function() {
          var renderMachineStub, setSelectedStub;
          function stubRenderers(context) {
            renderMachineStub = utils.makeStubMethod(app,
                '_renderMachineViewPanelView');
            context._cleanups.push(renderMachineStub.reset);
            app.set('environmentHeader', {});
            setSelectedStub = utils.makeStubMethod(app.get('environmentHeader'),
                'setSelectedTab');
            context._cleanups.push(setSelectedStub.reset);
          }

          it('highlights the machine tab', function() {
            stubRenderers(this);
            app._machine();
            assert.equal(setSelectedStub.callCount(), 1);
          });

          it('renders the machine view panel view', function() {
            stubRenderers(this);
            app._machine();
            assert.equal(renderMachineStub.callCount(), 1);
          });
        });

        describe('emptySections', function() {
          function stubMethods(app) {
            app._charmbrowser = { destroy: utils.makeStubFunction() };
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
                destroyMethod = app._charmbrowser.destroy,
                destroyCalled = false;
            bwsdata.addClass('bws-view-data');
            // The original destroy method is set to null after the
            // destroy is called so we need to stub out the method here
            // so that we can track the destroy.
            app._charmbrowser.destroy = function() {
              destroyCalled = true;
              app._charmbrowser.destroy = destroyMethod;
            };
            app.emptySectionA();
            assert.equal(destroyCalled, true);
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
        app.state.set('allowInspector', false);
        var generateUrlStub = utils.makeStubMethod(
            app.state, 'generateUrl', 'genUrl');
        var navigateStub = utils.makeStubMethod(app, 'navigate');
        app.fire('changeState', {foo: 'bar'});
        assert.equal(generateUrlStub.calledOnce(), true);
        assert.deepEqual(generateUrlStub.lastArguments()[0], {foo: 'bar'});
        assert.equal(navigateStub.calledOnce(), true);
        assert.equal(navigateStub.lastArguments()[0], 'genUrl');
        assert.isTrue(app.state.get('allowInspector'));
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
                  charmbrowser: false,
                  renderOnboarding: true
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

        browser = new ns.Browser({ sandbox: false });
        // Block out each render target so we only track it was hit.
        browser.renderEntityDetails = function() {
          hits.renderCharmDetails = true;
        };
        browser.renderCharmBrowser = function() {
          hits.charmbrowser = true;
        };
        // remove me (renderSearchResults) window.flags.il
        browser.renderSearchResults = function() {};
        browser.renderOnboarding = function() {
          hits.renderOnboarding = true;
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
          charmbrowser: true
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
          charmbrowser: true
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
          // XXX window.flags.il this should be true but the old
          // viewmode/sidebar code requires it to be false.
          charmbrowser: false
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
          // XXX window.flags.il this should be true but the old
          // viewmode/sidebar code requires it to be false.
          charmbrowser: false,
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
          charmbrowser: true
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
          charmbrowser: true,
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
          charmbrowser: true,
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
          // XXX window.flags.il this should be true but the old
          // viewmode/sidebar code requires it to be false.
          charmbrowser: false,
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
        // curated content again.
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
          // XXX window.flags.il this should be true but the old
          // viewmode/sidebar code requires it to be false.
          charmbrowser: false
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
          // XXX window.flags.il this should be true but the old
          // viewmode/sidebar code requires it to be false.
          charmbrowser: false
        });

        browser.routeView(req, undefined, function() {});
        assert.deepEqual(hits, expected);
      });

      it('back from searching dispatches curated', function() {
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
          charmbrowser: true
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
          charmbrowser: true,
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
          charmbrowser: true,
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
          // XXX window.flags.il this should be true but the old
          // viewmode/sidebar code requires it to be false.
          charmbrowser: false,
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
        var charmbrowser = new ns.Browser({ sandbox: false });
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
