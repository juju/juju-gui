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
    var Y, container, models, utils, views;
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
            models = Y.namespace('juju.models');
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
        app = new Y.juju.subapps.Browser({
          db: new models.Database()
        });
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

    describe('renderAddedServices', function() {
      var app, render;

      beforeEach(function() {
        var db = new models.Database();
        app = new Y.juju.subapps.Browser({db: db});
        app._sidebar = {
          get: function() {
            return {
              one: function() {}
            };
          },
          destroy: function() {}
        };
        render = utils.makeStubMethod(views.AddedServices.prototype, 'render');
        this._cleanups.push(render.reset);
      });

      afterEach(function() {
        app.destroy();
      });

      it('creates a new instance', function() {
        assert.strictEqual(app._addedServices, undefined);
        app.renderAddedServices();
        assert.equal(app._addedServices instanceof views.AddedServices, true);
      });

      it('adds the browser as a bubble target', function(done) {
        app.on('*:baaar', function() {
          // If this is never called then this test will fail.
          done();
        });
        app.renderAddedServices();
        app._addedServices.fire('baaar');
      });

      it('skips creating a new instance if one exists', function() {
        app.renderAddedServices();
        // Setting a nonsense attribute on the instance. If this
        // attribute is no longer there after rendering again, it created a
        // new instance when it shouldn't have.
        app._addedServices.set('flag', true);
        app.renderAddedServices();
        assert.equal(app._addedServices.get('flag'), true);
      });

      it('renders on every call', function() {
        assert.equal(render.callCount(), 0);
        app.renderAddedServices();
        assert.equal(render.callCount(), 1);
        app.renderAddedServices();
        assert.equal(render.callCount(), 2);
      });
    });
  });

  (function() {
    describe('browser app', function() {
      var Y, app, browser, container, next, utils;

      before(function(done) {
        Y = YUI(GlobalConfig).use(
            'app-subapp-extension',
            'juju-browser',
            'juju-charm-models',
            'juju-tests-utils',
            'juju-views',
            'subapp-browser', function(Y) {
              browser = Y.namespace('juju.subapps');
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
        var showSearchStub, setHome, renderCharmBrowser, renderAddedServices,
            entityStub, cleanupEntity, metadata, onboarding;

        beforeEach(function() {
          app = new browser.Browser({});
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
            onboarding = utils.makeStubMethod(app, 'renderOnboarding');
            context._cleanups.push(onboarding.reset);
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
            assert.equal(
                onboarding.callCount(),
                data.renderOnboardingCount,
                'renderOnboardingCount');
          }

          it('calls to render the charmbrowser with the metadata', function() {
            stubRenderers(this);
            metadata = {};
            // Cloning the object passed in so we can see if it's modified.
            app._charmBrowserDispatcher(Y.clone(metadata));
            assertions({
              renderCharmBrowserCount: 1,
              renderCharmBrowserData: metadata,
              renderEntityCount: 0,
              cleanupEntityCount: 1,
              renderOnboardingCount: 1
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
              cleanupEntityCount: 0,
              renderOnboardingCount: 0
            });
          });
        });

        describe('_inspectorDispatcher', function() {
          var clientId,
              ghostStub,
              requestSeriesStub,
              serviceStub,
              upgradeOrNewStub;

          function stubMethods(context) {
            ghostStub = utils.makeStubMethod(Y.juju.views,
                'GhostServiceInspector',
                {render: function() {}, addTarget: function() {} });
            context._cleanups.push(ghostStub.reset);
            serviceStub = utils.makeStubMethod(Y.juju.views,
                'ServiceInspector',
                {render: function() {}, addTarget: function() {} });
            context._cleanups.push(serviceStub.reset);
            requestSeriesStub = utils.makeStubMethod(Y.juju.views,
                'RequestSeriesInspector',
                {render: function() {}, addTarget: function() {} });
            context._cleanups.push(requestSeriesStub.reset);
            upgradeOrNewStub = utils.makeStubMethod(
                Y.juju.views, 'LocalNewUpgradeInspector',
                {render: function() {}, addTarget: function() {} });
            context._cleanups.push(upgradeOrNewStub.reset);
          }

          function stubApp(app, ghost, notes) {
            clientId = 'foo';
            var db = {
              charms: { getById: function() { return {}; } },
              notifications: {
                add: function(note) {
                  if (notes) {
                    notes.push(note);
                  }
                }
              },
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
            app.set('env', {});
            app.set('topo', { get: function() {} });
          }

          it('renders a service inspector with ghost data', function() {
            stubMethods(this);
            stubApp(app, false);
            app._inspectorDispatcher({ id: clientId });
            assert.equal(ghostStub.callCount(), 0);
            assert.equal(serviceStub.callCount(), 1);
            assert.equal(requestSeriesStub.callCount(), 0);
            assert.equal(upgradeOrNewStub.callCount(), 0);
          });

          it('renders a service inspector', function() {
            stubMethods(this);
            stubApp(app, false);
            app._inspectorDispatcher({ id: clientId });
            assert.equal(ghostStub.callCount(), 0);
            assert.equal(serviceStub.callCount(), 1);
            assert.equal(requestSeriesStub.callCount(), 0);
            assert.equal(upgradeOrNewStub.callCount(), 0);
          });

          it('updates a service inspector when showing details', function() {
            stubMethods(this);
            stubApp(app, false);
            var charmId = 'foo',
                called = false;
            app._inspectorDispatcher({ id: clientId });
            app._inspector = {
              name: 'service-inspector',
              destroy: function() {},
              get: function(arg) {
                if (arg === 'activeUnit') {
                  return;
                }
                return { get: function() { return charmId; }};
              },
              setAttrs: function() {},
              renderUI: function() { called = true; }
            };
            app._inspectorDispatcher({ id: clientId }, charmId);
            assert.equal(serviceStub.callCount(), 1);
            assert.equal(ghostStub.callCount(), 0);
            assert.equal(requestSeriesStub.callCount(), 0);
            assert.equal(upgradeOrNewStub.callCount(), 0);
            assert.equal(called, true);
          });

          it('renders a request-series local charm inspector', function() {
            stubMethods(this);
            stubApp(app, true);
            app.set('env', {});
            app._inspectorDispatcher({
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
            stubApp(app, true);
            app.set('env', {});
            app._inspectorDispatcher({
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
            stubApp(app, false);
            app._inspectorDispatcher({ id: clientId });
            app._inspector = {
              destroy: function() {
                // If the inspector is not destroyed, the test will time out.
                done();
              },
              get: function() {
                return { get: function() {} };
              }
            };
            app._inspectorDispatcher({ id: clientId });
          });

          it('can retry the inspector', function() {
            stubMethods(this);
            stubApp(app, false);
            var fakeTimer = {time: 'foo'},
                metadata = { id: clientId },
                laterStub = utils.makeStubMethod(Y, 'later', fakeTimer);
            this._cleanups.push(laterStub.reset);
            assert.equal(app.get('inspectorRetries'), 0);
            app._retryRenderServiceInspector(metadata);
            var lastArguments = laterStub.lastArguments();
            assert.equal(laterStub.calledOnce(), true);
            assert.equal(lastArguments[0], 100);
            assert.equal(lastArguments[1], app);
            assert.equal(lastArguments[2], '_inspectorDispatcher');
            assert.equal(lastArguments[3], metadata);
            assert.equal(app.get('inspectorRetries'), 1);
            assert.equal(app.get('inspectorRetryTimer'), fakeTimer);
          });

          it('retries if it cannot find model data', function() {
            stubApp(app, false);
            stubMethods(this);
            var findStub = utils.makeStubMethod(
                app, '_findModelInServices', false);
            this._cleanups.push(findStub);
            var retryStub = utils.makeStubMethod(
                app, '_retryRenderServiceInspector');
            this._cleanups.push(retryStub.reset);

            var metadata = {id: clientId};
            app._inspectorDispatcher(metadata);
            assert.equal(retryStub.calledOnce(), true);
            assert.equal(retryStub.lastArguments()[0], metadata);
          });

          it('retries if it cannot find charm data', function() {
            stubApp(app, false);
            stubMethods(this);
            app.get('db').charms.getById = function() { return null; };
            var findStub = utils.makeStubMethod(app, '_findModelInServices', {
              get: function() {
                return 'foo';
              }
            });
            this._cleanups.push(findStub);
            var retryStub = utils.makeStubMethod(
                app, '_retryRenderServiceInspector');
            this._cleanups.push(retryStub.reset);

            var metadata = {id: clientId};
            app._inspectorDispatcher(metadata);
            assert.equal(retryStub.calledOnce(), true);
            assert.equal(retryStub.lastArguments()[0], metadata);
          });

          it('stops retrying after a cutoff', function() {
            var notes = [];
            stubMethods(this);
            stubApp(app, false, notes);
            var laterStub = utils.makeStubMethod(Y, 'later'),
                fireStub = utils.makeStubMethod(app, 'fire');
            this._cleanups.push(laterStub.reset);
            this._cleanups.push(fireStub.reset);

            app.set('inspectorRetries', 1);
            app.set('inspectorRetryLimit', 1);
            app._retryRenderServiceInspector({id: clientId});

            assert.equal(laterStub.calledOnce(), false);
            assert.equal(fireStub.calledOnce(), true);
            assert.equal(fireStub.lastArguments()[0], 'changeState');
            var note = notes[0];
            assert.equal(note.title, 'Could not load service inspector.');
            assert.equal(
                note.message,
                'There is no deployed service named ' + clientId + '.');
            assert.equal(note.level, 'error');
          });

          it('cancels the retry timer when dispatching', function() {
            stubMethods(this);
            stubApp(app, false);
            var fakeTimer = {},
                timerStub = utils.makeStubMethod(fakeTimer, 'cancel');
            app.set('inspectorRetryTimer', fakeTimer);
            app.fire('changeState');
            assert.equal(timerStub.calledOnce(), true);
            assert.equal(app.get('inspectorRetries'), 0);
          });
        });

        describe('_addedServicesDispatcher', function() {
          var detailsVisible;

          function stubRenderers(context) {
            renderAddedServices = utils.makeStubMethod(
                app, 'renderAddedServices');
            context._cleanups.push(renderAddedServices.reset);
            detailsVisible = utils.makeStubMethod(
                app, '_detailsVisible');
            context._cleanups.push(detailsVisible.reset);
          }

          it('calls to render the added services view', function() {
            stubRenderers(this);
            app._addedServicesDispatcher();
            assert.equal(renderAddedServices.callCount(), 1);
          });

          it('hides the details panel', function() {
            stubRenderers(this);
            app._addedServicesDispatcher();
            assert.equal(detailsVisible.callCount(), 1);
            assert.equal(detailsVisible.lastArguments()[0], false);
          });
        });

        describe('_deployTargetDispatcher', function() {
          it('gets bundle yaml from charmstore then deploys', function() {
            var bundleId = 'bundle/elasticsearch';
            app.set('charmstore', {
              getBundleYAML: utils.makeStubFunction(),
              downConvertBundleYAML: utils.makeStubFunction('yamlres')
            });
            app.set('deployBundle', utils.makeStubFunction());
            app._deployTargetDispatcher(bundleId);
            var charmstore = app.get('charmstore');
            assert.equal(charmstore.getBundleYAML.callCount(), 1);
            var bundleArgs = charmstore.getBundleYAML.lastArguments();
            assert.equal(bundleArgs[0], bundleId);
            // The second param is the callback for the store response. So
            // we need to manually trigger it to test it.
            bundleArgs[1].call(app, 'yaml');
            var deploy = app.get('deployBundle');
            assert.equal(charmstore.downConvertBundleYAML.callCount(), 1);
            assert.equal(deploy.callCount(), 1);
            assert.deepEqual(
                deploy.lastArguments(),
                ['yamlres', bundleId]);
          });

          it('requests bundle id from charmstore then deploys (namespaced)',
              function() {
                var bundleId = '~jorge/bundle/elasticsearch';
                app.set('charmstore', {
                  getBundleYAML: utils.makeStubFunction(),
                  downConvertBundleYAML: utils.makeStubFunction('yamlres')
                });
                app.set('deployBundle', utils.makeStubFunction());
                app._deployTargetDispatcher(bundleId);
                var charmstore = app.get('charmstore');
                assert.equal(charmstore.getBundleYAML.callCount(), 1);
                var bundleArgs = charmstore.getBundleYAML.lastArguments();
                assert.equal(bundleArgs[0], bundleId);
                // The second param is the callback for the store response. So
                // we need to manually trigger it to test it.
                bundleArgs[1].call(app, 'yaml');
                var deploy = app.get('deployBundle');
                assert.equal(charmstore.downConvertBundleYAML.callCount(), 1);
                assert.equal(deploy.callCount(), 1);
                assert.deepEqual(
                    deploy.lastArguments(),
                    ['yamlres', bundleId]);
              });

          it('requests charm id from store then deploys', function() {
            app.setAttrs({
              charmstore: { getEntity: utils.makeStubFunction() },
              env: { deploy: utils.makeStubFunction() }
            });
            app._deployTargetDispatcher('cs:precise/apache2-25');
            var charmstore = app.get('charmstore');
            assert.equal(charmstore.getEntity.callCount(), 1);
            var charmArgs = charmstore.getEntity.lastArguments();
            assert.equal(charmArgs[0], 'precise/apache2-25',
                'api requires removal of cs:');
            // The second param is the callback for the store response. So we
            // need to manually trigger it to test it.
            var charmData = new Y.juju.models.Charm({
              id: 'cs:precise/foo',
              name: 'bar',
              options: {
                opt1: { 'default': 'opt1default' }
              }
            });
            charmArgs[1]([charmData]);
            var deploy = app.get('env').deploy;
            assert.equal(deploy.callCount(), 1);
            var deployArgs = deploy.lastArguments();
            assert.equal(deployArgs[0], charmData.get('id'));
            assert.equal(deployArgs[1], charmData.get('name'));
            assert.deepEqual(deployArgs[2], { opt1: 'opt1default' });
            assert.strictEqual(deployArgs[3], undefined);
            assert.equal(deployArgs[4], 1);
            assert.deepEqual(deployArgs[5], {});
            assert.strictEqual(deployArgs[6], null);
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
            app._addedServices = { destroy: utils.makeStubFunction() };
            app.machineViewPanel = { destroy: utils.makeStubFunction() };
          }

          it('emptySectionA', function() {
            stubMethods(app);
            var bwsdata = utils.makeContainer(this),
                charmbrowserDestroyMethod = app._charmbrowser.destroy,
                addedServicesDestroyMethod = app._addedServices.destroy,
                charmbrowserDestroyCalled = false,
                addedServicesDestroyCalled = false;
            bwsdata.addClass('bws-view-data');
            // The original destroy method is set to null after the
            // destroy is called so we need to stub out the method here
            // so that we can track the destroy.
            app._charmbrowser.destroy = function() {
              charmbrowserDestroyCalled = true;
              app._charmbrowser.destroy = charmbrowserDestroyMethod;
            };
            app._addedServices.destroy = function() {
              addedServicesDestroyCalled = true;
              app._addedServices.destroy = addedServicesDestroyMethod;
            };
            app.emptySectionA();
            assert.equal(app._sidebar.hideSearch.callCount(), 1);
            assert.equal(charmbrowserDestroyCalled, true);
            assert.equal(addedServicesDestroyCalled, true);
            assert.equal(app._details.destroy.callCount(), 1);
            assert.equal(bwsdata.getStyle('display'), 'none');
          });

          it('emptySectionB', function() {
            stubMethods(app);
            var destroyMethod = app.machineViewPanel.destroy,
                destroyCalled = false;
            // The original destroy method is set to null after the
            // destroy is called so we need to stub out the method here
            // so that we can track the destroy.
            app.machineViewPanel.destroy = function() {
              destroyCalled = true;
              app.machineViewPanel.destroy = destroyMethod;
            };
            app.emptySectionB();
            assert.equal(destroyCalled, true);
            assert.equal(app.machineViewPanel, null);
          });
        });
      });

      it('listens to serviceDeployed events', function(done) {
        app = new browser.Browser({});
        var generateStub = utils.makeStubMethod(app.state, 'generateUrl');
        this._cleanups.push(generateStub.reset);
        var navigateStub = utils.makeStubMethod(app, 'navigate');
        this._cleanups.push(navigateStub.reset);
        app._inspector = {
          get: function(key) {
            if (key === 'destroyed') { return false; }
            if (key === 'model') {
              return { get: function() { return 'foo'; } };
            }
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

      it('don\'t render a destroyed inspector on serviceDeployed', function() {
        app = new browser.Browser({});
        var generateStub = utils.makeStubMethod(app.state, 'generateUrl');
        this._cleanups.push(generateStub.reset);
        var navigateStub = utils.makeStubMethod(app, 'navigate');
        this._cleanups.push(navigateStub.reset);
        app._inspector = {
          get: function() { return true; }
        };
        app.on('changeState', function(e) {
          e.halt(); // stop any futher propogation of this event.
          // We don't need to wait on this, if the event is fired later this
          // test will still fail out of band.
          assert.fail(
              'changeState should not be fired with a destroyed inspector');
        });
        app.fire('serviceDeployed', {
          clientId: 'foo',
          serviceName: 'bar'
        });
      });

      it('listens to changeState events', function() {
        app = new browser.Browser({});
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
        app = new browser.Browser({});
        Y.each(app.get('routes'), function(route) {
          assert.isTrue(typeof app[route.callback] === 'function');
        });
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
        browser = new ns.Browser({ sandbox: false });
      });

      afterEach(function() {
        browser.destroy();
      });

      it('knows when the search cache should be updated (state)', function() {
        var charmbrowser = new ns.Browser({ sandbox: false });
        charmbrowser.state.set('current', {
          sectionA: {
            component: 'charmbrowser',
            metadata: { search: 'foo' }
          }, sectionB: {}});
        assert.equal(charmbrowser._searchChanged(), true);
      });
    });
  })();
})();
