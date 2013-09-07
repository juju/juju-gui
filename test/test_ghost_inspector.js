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

describe('Ghost Inspector', function() {

  var charmData, cleanIconHelper, conn, container, db, env, inspector, juju,
      jujuViews, models, service, utils, view, Y;

  before(function(done) {
    var requires = [
      'juju-gui', 'juju-views', 'juju-tests-utils', 'juju-charm-store',
      'juju-charm-models', 'juju-ghost-inspector', 'event-valuechange'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          jujuViews = Y.namespace('juju.views');
          juju = Y.namespace('juju');
          models = Y.namespace('juju.models');
          utils = Y.namespace('juju-tests.utils');

          charmData = utils.loadFixture(
              'data/mediawiki-api-response.json', true);
          done();
        });

  });

  beforeEach(function() {
    cleanIconHelper = utils.stubCharmIconPath();
    container = utils.makeContainer('container');
    conn = new utils.SocketStub();
    db = new models.Database();
    env = juju.newEnvironment({conn: conn});
    window.flags.serviceInspector = true;
  });

  afterEach(function(done) {
    cleanIconHelper();
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
    var charm = new models.BrowserCharm(charmData.charm);
    db.charms.add(charm);

    // Create a ghost service with the fake charm.
    service = db.services.ghostService(charm);

    var fakeStore = new Y.juju.Charmworld2({});
    fakeStore.iconpath = function(id) {
      return '/icon/' + id;
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
        // XXX (Jeff) YUI's simulate can't properly simulate focus or blur in
        // IE10 as of 3.9.1, 3.11 https://github.com/yui/yui3/issues/489
        if (Y.UA.ie === 10) {
          done();
        }
        inspector = setUpInspector();
        var serviceIcon = Y.one('tspan.name');
        assert.equal(serviceIcon.get('textContent'), '(mediawiki 1)');

        var serviceNameInput = Y.one('input[name=service-name]'),
            vmContainer = inspector.viewletManager.get('container');
        // In order to properly detect the change event of the input we needed
        // to create our own event handler listening for the special Y.View
        // bubbling valuechange (note not valueChange) event.
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

  it('displays the charms icon when rendered', function() {
    inspector = setUpInspector();
    var icon = container.one('.icon img');

    // The icon url is from the fakestore we manually defined.
    assert.equal(icon.getAttribute('src'), '/icon/cs:precise/mediawiki-8');
  });

  it('deploys a service with the specified unit count & config', function() {
    inspector = setUpInspector();
    env.connect();
    var vmContainer = inspector.viewletManager.get('container'),
        numUnits = 10;

    vmContainer.one('input[name=number-units]').set('value', numUnits);
    vmContainer.one('textarea[name=name]').set('value', 'foo');
    vmContainer.one('.viewlet-manager-footer button.confirm').simulate('click');

    var message = env.ws.last_message();
    var params = message.Params;
    var config = {
      name: 'foo'
    };
    assert.equal('ServiceDeploy', message.Request);
    assert.equal('mediawiki', params.ServiceName);
    assert.equal(numUnits, params.NumUnits);
    assert.deepEqual(config, params.Config);
  });

  it('presents the contraints to the user in python env', function() {
    // Create our own env to make sure we know which backend we're creating it
    // against.
    env.destroy();
    env = juju.newEnvironment({conn: conn}, 'python');
    inspector = setUpInspector();
    var constraintsNode = container.all('.service-constraints');
    assert.equal(constraintsNode.size(), 1);

    var inputNodes = container.all('.service-constraints input');
    assert.equal(inputNodes.size(), 3);
  });

  it('presents the contraints to the user in go env', function() {
    // Create our own env to make sure we know which backend we're creating it
    // against.
    env.destroy();
    env = juju.newEnvironment({conn: conn}, 'go');
    inspector = setUpInspector();
    var constraintsNode = container.all('.service-constraints');
    assert.equal(constraintsNode.size(), 1);

    var inputNodes = container.all('.service-constraints input');
    assert.equal(inputNodes.size(), 4);
  });

  it('deploys with constraints in python env', function() {
    env.destroy();
    env = juju.newEnvironment({conn: conn}, 'python');
    inspector = setUpInspector();
    env.connect();
    var vmContainer = inspector.viewletManager.get('container');

    vmContainer.one('input[name=cpu]').set('value', 2);
    // Called the deploy button, but the css if confirm.
    vmContainer.one('.viewlet-manager-footer button.confirm').simulate('click');

    var message = env.ws.last_message();
    assert.deepEqual(message.constraints, ['cpu=2', 'mem=', 'arch=']);
  });

  it('deploys with constraints in go env', function() {
    env.destroy();
    env = juju.newEnvironment({conn: conn}, 'go');
    inspector = setUpInspector();
    env.connect();
    var vmContainer = inspector.viewletManager.get('container');

    vmContainer.one('input[name=cpu-power]').set('value', 2);
    // Called the deploy button, but the css if confirm.
    vmContainer.one('.viewlet-manager-footer button.confirm').simulate('click');

    var message = env.ws.last_message();
    assert.deepEqual(message.Params.Constraints, { 'cpu-power': 2 });
  });

  it('disables and resets input fields when \'use default config\' is active',
      function() {
        function testDisabled(hasAttr) {
          var settings = vmContainer.one(
              '.service-configuration .ghost-config-content');
          var inputs = settings.all('textarea');
          inputs.each(function(input) {
            assert.equal(input.hasAttribute('disabled'), hasAttr,
                         'textarea missing disabled');
          });
          inputs = settings.all('input');
          inputs.each(function(input) {
            // The import config field is not disabled.
            var id = input.getAttribute('id');
            if (id !== 'config-file' && id !== 'use-default-toggle') {
              assert.equal(input.hasAttribute('disabled'), hasAttr,
                           'input missing disabled');
            }
          });
        }
        inspector = setUpInspector();
        var vmContainer = inspector.viewletManager.get('container');
        // 'use default config' should be on set by default
        var toggle = vmContainer.one('input#use-default-toggle');
        assert.equal(toggle.hasAttribute('checked'), true,
                     'toggle is not checked');
        // inputs should be disabled by default within the settings
        testDisabled(true);
        // clicking the toggle enables the input elements
        toggle.simulate('click');
        testDisabled(false);
        // set an input to a new value and then toggle the checkbox should
        // reset it to its previous value.
        var nameInput = vmContainer.one('textarea[name=name]'),
            oldVal = nameInput.get('value'),
            newVal = 'foo';

        assert.equal(nameInput.get('value'), oldVal);
        nameInput.set('value', newVal);
        assert.equal(nameInput.get('value'), newVal);
        toggle.simulate('click');
        testDisabled(true);
        assert.equal(nameInput.get('value'), oldVal);
      });

  it('Saves the config when closing the inspector via \'X\' or \'Save\'');

  it('renders into the dom when instantiated', function() {
    inspector = setUpInspector();
    assert.isObject(container.one('.ghost-config-wrapper'));
  });

  it('properly renders a service without charm options', function() {
    // Mutate charmData before the render.
    delete charmData.charm.options;
    inspector = setUpInspector();
    // Verify the viewlet rendered, previously it would raise.
    assert.isObject(container.one('.ghost-config-wrapper'));
    // Restore the test global
    charmData = utils.loadFixture('data/mediawiki-api-response.json', true);
  });

  it('hides configuration panel when a file is uploaded', function() {
    inspector = setUpInspector();
    var fileContents = 'yaml yaml yaml';

    inspector.onFileLoaded('a.yaml', {target: {result: fileContents}});
    inspector.viewletManager.configFileContent.should.equal(fileContents);
    var settings = container.all('.settings-wrapper');
    settings.each(function(node) {
      node.getStyle('display').should.equal('none');
    });
  });

  it('must restore file input when config is removed', function() {
    inspector = setUpInspector();
    var fileContents = 'yaml yaml yaml';

    inspector.onFileLoaded('a.yaml', {target: {result: fileContents}});
    inspector.viewletManager.configFileContent.should.equal(fileContents);
    var settings = container.all('.settings-wrapper');
    settings.each(function(node) {
      node.getStyle('display').should.equal('none');
    });
    // Load the file.
    inspector.onFileLoaded('a.yaml', {target: {result: fileContents}});

    // And then click to remove it.
    container.one('.config-file .fakebutton').simulate('click');

    // The content should be gone now.
    assert.equal(
        inspector.viewletManager.configFileContent,
        undefined);
    assert.equal(
        container.one('.config-file input').get('files').size(),
        0
    );
    assert.equal(
        container.one('.config-file .fakebutton').getContent(),
        'Import config file...'
    );
  });

  it('must be able to deploy with configuration from a file', function() {
    var received_config,
        received_config_raw;

    inspector = setUpInspector();
    var env = view.get('env');
    env.deploy = function(charm_url, service_name, config, config_raw) {
      received_config = config;
      received_config_raw = config_raw;
    };

    var config_raw = 'admins: \n user:pass';
    inspector.onFileLoaded('a.yaml', {target: {result: config_raw}});

    container.one('.confirm').simulate('click');
    // The config from the charm model should be emptied out.
    assert.equal(received_config, undefined);
    // The config from the file should take precedence.
    assert.equal(received_config_raw, config_raw);
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
