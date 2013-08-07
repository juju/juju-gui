/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2013 Canonical Ltd.

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

describe.only('Ghost Inspector', function() {

  var view, service, db, models, utils, juju, env, conn, container,
      inspector, Y, jujuViews, charmConfig;

  before(function(done) {
    var requires = ['juju-gui', 'juju-views', 'juju-tests-utils',
      'juju-charm-store', 'juju-charm-models', 'juju-ghost-inspector',
      'event-valuechange'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          utils = Y.namespace('juju-tests.utils');
          models = Y.namespace('juju.models');
          jujuViews = Y.namespace('juju.views');
          juju = Y.namespace('juju');
          charmConfig = utils
            .loadFixture('data/mediawiki-charmdata.json', true);
          done();
        });

  });

  beforeEach(function() {
    container = utils.makeContainer('container');
    conn = new utils.SocketStub();
    db = new models.Database();
    env = juju.newEnvironment({conn: conn});
    window.flags.serviceInspector = true;
  });

  afterEach(function(done) {
    if (view) {
      if (inspector) {
        view.setInspector(inspector, true);
      }
      view.destroy();
    }
    env.after('destroy', function() { done(); });
    env.destroy();
    container.remove(true);
    window.flags = {};
  });

  var setUpInspector = function(options) {
    charmConfig.id = 'precise/mediawiki-4';
    var charm = new models.Charm(charmConfig);
    db.charms.add(charm);

    // Create a ghost service with the fake charm.
    service = db.services.ghostService(charm);

    var fakeStore = new Y.juju.Charmworld2({});
    fakeStore.iconpath = function() {
      return 'charm icon url';
    };

    view = new jujuViews.environment({
      container: container,
      db: db,
      env: env,
      store: fakeStore
    });

    view.render();
    Y.Node.create('<div id="content">').appendTo(container);

    // interval: 0 must be set to test sync data updates else there will be
    // an aprox 150ms delay
    return view.createServiceInspector(service, {databinding: {interval: 0}});
  };

  it('updates the service name in the topology when changed in the inspector',
      function(done) {
        inspector = setUpInspector();
        var serviceIcon = Y.one('tspan.name');
        assert.equal(serviceIcon.get('textContent'), '(mediawiki 1)');
        var serviceNameInput = Y.one('input[name=service-name]'),
            vmContainer = inspector.viewletManager.get('container');
        var handler = vmContainer.delegate('valuechange', function() {
          view.update(); // simulating a db.fire('update') call
          // Reselecting the service node because it is replaced not actually
          // updated by the topo service d3 system.
          assert.equal(Y.one('tspan.name').get('textContent'), '(foo)');
          handler.detach();
          done();
        }, 'input[name=service-name]');
        serviceNameInput.simulate('focus');
        serviceNameInput.set('value', 'foo');
      });

  it('deploys a service with the specified unit count');
  it('deploys a service with the specified configuration');
  it('disables and resets input fields when \'use default config\' is active');
  it('disables the file upload button when \'use default config\' is active');
  it('Saves the config when closing the inspector via \'X\' or \'Save\'');

  it('renders into the dom when instantiated', function() {
    inspector = setUpInspector();
    assert.isObject(container.one('.ghost-config-wrapper'));
  });

  it('properly renders a service without charm options', function() {
    // Mutate charmConfig before the render.
    delete charmConfig.config;
    inspector = setUpInspector();
    // Verify the viewlet rendered, previously it would raise.
    assert.isObject(container.one('.ghost-config-wrapper'));
    // Restore the test global
    charmConfig = utils.loadFixture('data/mediawiki-charmdata.json', true);
  });

  describe('Service destroy UI', function() {
    it('has a button to destroy the service', function() {
      inspector = setUpInspector();
      assert.isObject(container.one('.destroy-service-trigger span'));
    });

    it('shows the destroy service prompt if the trigger is clicked',
        function() {
          inspector = setUpInspector();
          var promptBox = container.one('.destroy-service-prompt');
          assert.isTrue(promptBox.hasClass('closed'));
          container.one('.destroy-service-trigger span').simulate('click');
          assert.isFalse(promptBox.hasClass('closed'));
        });

    it('hides the destroy service prompt if cancel is clicked', function() {
      inspector = setUpInspector();
      var promptBox = container.one('.destroy-service-prompt');
      assert.isTrue(promptBox.hasClass('closed'));
      // First we have to open the prompt.
      container.one('.destroy-service-trigger span').simulate('click');
      assert.isFalse(promptBox.hasClass('closed'));
      // Now we can close it.
      container.one('.cancel-destroy').simulate('click');
      assert.isTrue(promptBox.hasClass('closed'));
    });

    it('initiates a destroy if the "Destroy" button is clicked',
        function(done) {
          inspector = setUpInspector();
          var promptBox = container.one('.destroy-service-prompt');
          // First we have to open the prompt.
          container.one('.destroy-service-trigger span').simulate('click');
          assert.isFalse(promptBox.hasClass('closed'));
          // If the test times out, it failed (because the expected
          // function call didn't happen).
          inspector.initiateServiceDestroy = function() {
            done();
          };
          container.one('.initiate-destroy').simulate('click');
        });

    it('wires up UI elements to handlers for destroy service', function() {
      // There are UI elements and they all have to be wired up to something.
      inspector = setUpInspector();
      var events = inspector.viewletManager.events;
      assert.equal(
          typeof events['.destroy-service-trigger span'].click, 'function');
      assert.equal(typeof events['.initiate-destroy'].click, 'function');
      assert.equal(typeof events['.cancel-destroy'].click, 'function');
    });
  });

});
