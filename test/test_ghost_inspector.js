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

  var charmData, cleanIconHelper, conn, container, content, db, env, inspector,
      juju, jujuViews, models, service, subordinateCharmData, utils, view, Y;

  before(function(done) {
    var requires = [
      'juju-gui', 'juju-views', 'juju-tests-utils', 'juju-charm-store',
      'juju-charm-models', 'ghost-deployer-extension', 'event-valuechange',
      'ghost-service-inspector', 'juju-templates', 'node-event-simulate'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          jujuViews = Y.namespace('juju.views');
          juju = Y.namespace('juju');
          models = Y.namespace('juju.models');
          utils = Y.namespace('juju-tests.utils');

          charmData = utils.loadFixture(
              'data/mediawiki-api-response.json', true);
          subordinateCharmData = utils.loadFixture(
              'data/puppet-api-response.json', true);
          done();
        });

  });

  beforeEach(function() {
    cleanIconHelper = utils.stubCharmIconPath();
    container = utils.makeContainer(this, 'container');
    Y.one('body').append(container);
    content = utils.makeContainer(this, 'content');
    Y.one('body').append(content);
    conn = new utils.SocketStub();
    db = new models.Database();
    env = juju.newEnvironment({conn: conn});
    env.connect();
  });

  afterEach(function(done) {
    cleanIconHelper();
    if (view) {
      if (inspector) {
        inspector.destroy();
      }
      view.destroy();
    }
    db.destroy();
    env.after('destroy', function() { done(); });
    env.destroy();
    window.flags = {};
  });

  var setUpInspector = function(data) {
    if (!data) { data = charmData; }
    var charm = new models.Charm(data.charm);
    db.charms.add(charm);

    // Create a ghost service with the fake charm.
    service = db.services.ghostService(charm);

    var fakeStore = new Y.juju.charmworld.APIv3({});
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
    //Y.Node.create('<div id="content">').appendTo(container);

    // interval: 0 must be set to test sync data updates else there will be
    // an aprox 150ms delay
    //return view.createServiceInspector(service, {databinding: {interval: 0}});

    inspector = new Y.juju.views.GhostServiceInspector({
      db: db,
      model: service,
      env: env,
      environment: view,
      charmModel: charm,
      topo: view.topo,
      store: fakeStore
    });
    inspector.render();
    return inspector;
  };

  describe('charm name validity', function() {
    it('shows when a charm name is invalid initially', function() {
      db.services.add({id: 'mediawiki', charm: 'cs:precise/mediawiki'});
      inspector = setUpInspector();
      var model = inspector.get('model');
      var serviceNameInput = Y.one('input[name=service-name]');
      assert.equal(model.get('displayName'), '(mediawiki)');
      assert.isTrue(serviceNameInput.hasClass('invalid'));
      assert.isFalse(serviceNameInput.hasClass('valid'));
    });

    it('shows when a charm name is valid initially', function() {
      db.services.add({id: 'mediawiki42', charm: 'cs:precise/mediawiki'});
      inspector = setUpInspector();
      var model = inspector.get('model');
      var serviceNameInput = Y.one('input[name=service-name]');
      assert.equal(model.get('displayName'), '(mediawiki)');
      assert.isFalse(serviceNameInput.hasClass('invalid'));
      assert.isTrue(serviceNameInput.hasClass('valid'));
    });

    it('shows when a charm name becomes invalid', function() {
      db.services.add({id: 'mediawiki42', charm: 'cs:precise/mediawiki'});
      inspector = setUpInspector();
      var serviceNameInput = Y.one('input[name=service-name]');
      // This is usually fired by an event.  The event simulation is broken as
      // of this writing, and we can do more of a unit test this way.
      inspector.views.inspectorHeader.updateGhostName(
          {newVal: 'mediawiki42', currentTarget: serviceNameInput});
      assert.isTrue(serviceNameInput.hasClass('invalid'));
      assert.isFalse(serviceNameInput.hasClass('valid'));
    });

    it('shows when a charm name becomes valid', function() {
      db.services.add({id: 'mediawiki', charm: 'cs:precise/mediawiki'});
      inspector = setUpInspector();
      var serviceNameInput = Y.one('input[name=service-name]');
      // This is usually fired by an event.  The event simulation is broken as
      // of this writing, and we can do more of a unit test this way.
      inspector.views.inspectorHeader.updateGhostName(
          {newVal: 'mediawiki42', currentTarget: serviceNameInput});
      assert.isFalse(serviceNameInput.hasClass('invalid'));
      assert.isTrue(serviceNameInput.hasClass('valid'));
    });

    it('won\'t let you deploy a service with an invalid name', function() {
      db.services.add({id: 'mediawiki', charm: 'cs:precise/mediawiki'});
      inspector = setUpInspector();
      var newName = 'foo-2',
          serviceNameInput = Y.one('input[name=service-name]');
      // This is usually fired by an event.  The event simulation is broken as
      // of this writing, and we can do more of a unit test this way.
      serviceNameInput.set('value', newName);
      inspector.views.inspectorHeader.updateGhostName(
          {newVal: newName, currentTarget: serviceNameInput});
      assert.isTrue(serviceNameInput.hasClass('invalid'));
      assert.isFalse(serviceNameInput.hasClass('valid'));
      var env = inspector.get('env');
      env.deploy = function() {
        assert.fail('The method should exit before this function is called.');
      };
      inspector.set('env', env);
      assert.isFalse(inspector.deployCharm());
    });
  });

  it('updates the service name in the topology when changed in the inspector',
      function(done) {
        // XXX (Jeff) YUI's simulate can't properly simulate focus or blur in
        // IE10 as of 3.9.1, 3.11 https://github.com/yui/yui3/issues/489
        if (Y.UA.ie === 10) { done(); }
        inspector = setUpInspector();
        var serviceIcon = Y.one('tspan.name');
        assert.equal(serviceIcon.get('textContent'), '(mediawiki)');

        var serviceNameInput = Y.one('input[name=service-name]'),
            vmContainer = inspector.get('container');
        // In order to properly detect the change event of the input we needed
        // to create our own event handler listening for the special Y.View
        // bubbling valuechange (note not valueChange) event.
        var handler = vmContainer.delegate('valuechange', function() {
          view.update(); // Simulating a db.fire('update') call
          assert.equal(serviceIcon.get('textContent'), '(foo)');
          handler.detach();
          done();
        }, 'input[name=service-name]');

        serviceNameInput.simulate('focus');
        serviceNameInput.set('value', 'foo');
      });

  it('displays the charms icon when rendered', function() {
    inspector = setUpInspector();
    var icon = content.one('.icon img');

    // The icon url is from the fakestore we manually defined.
    assert.equal(icon.getAttribute('src'), '/icon/cs:precise/mediawiki-8');
  });

  it('deploys a service with the specified unit count & config', function() {
    inspector = setUpInspector();
    env.connect();
    var vmContainer = inspector.get('container'),
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

  it('opens a service inspector in place of the ghost inspector', function() {
    inspector = setUpInspector();
    // Create a second inspector.  Our stub beneath should only be called once,
    // and only on the above insepctor.
    setUpInspector(subordinateCharmData);
    var stubCreate = utils.makeStubMethod(view, 'createServiceInspector');
    this._cleanups.push(stubCreate.reset);
    inspector.get('environment').inspector = inspector;
    inspector._deployCallbackHandler('mediawiki', {}, {}, {});
    assert.isTrue(stubCreate.calledOnce());
  });

  it('destroys existing ghost inspector on deploy', function() {
    inspector = setUpInspector();
    var secondInspector = setUpInspector();
    var stubCreate = utils.makeStubMethod(view, 'createServiceInspector');
    this._cleanups.push(stubCreate.reset);
    var secondDestroy = utils.makeStubMethod(secondInspector, 'destroy');
    this._cleanups.push(secondDestroy.reset);
    secondInspector.get('environment').inspector = secondInspector;
    inspector.set('environment', secondInspector.get('environment'));
    inspector._deployCallbackHandler('mediawiki', {}, {}, {});
    // Assert that the service inspector is only created once.
    assert.isTrue(stubCreate.calledOnce(), 'Create called once.');
    // Despite the callback being called from the first inspector, the second
    // inspector is destroyed as well.
    assert.isTrue(secondDestroy.called(), '2nd destroy called');
  });

  it('does not display unit count for subordinate charms', function() {
    inspector = setUpInspector(subordinateCharmData);
    var vmContainer = inspector.get('container');
    assert.strictEqual(vmContainer.all('input[name=number-units]').size(), 0);
  });

  it('presents the contraints to the user in go env', function() {
    // Create our own env to make sure we know which backend we're creating it
    // against.
    env.destroy();
    env = juju.newEnvironment({conn: conn}, 'go');
    inspector = setUpInspector();
    var constraintsNode = content.all('.service-constraints');
    assert.equal(constraintsNode.size(), 1);

    var inputNodes = content.all('.service-constraints input');
    assert.equal(inputNodes.size(), 4);
  });

  it('does not display constraints for subordinate charms', function() {
    inspector = setUpInspector(subordinateCharmData);
    assert.strictEqual(container.all('.service-constraints').size(), 0);
  });

  it('deploys with constraints in go env', function() {
    env.destroy();
    env = juju.newEnvironment({conn: conn}, 'go');
    inspector = setUpInspector();
    env.connect();
    var vmContainer = inspector.get('container');

    vmContainer.one('input[name=cpu-power]').set('value', 2);
    // Called the deploy button, but the css if confirm.
    vmContainer.one('.viewlet-manager-footer button.confirm').simulate('click');

    var message = env.ws.last_message();
    assert.deepEqual(message.Params.Constraints, { 'cpu-power': 2 });
  });

  describe('Environment change set interactions', function() {
    it('calls the ecs deploy method', function() {
      window.flags.ecs = true;
      inspector = setUpInspector();
      var deployStub = utils.makeStubFunction();
      inspector.set('ecs', { deploy: deployStub });
      env.connect();
      var vmContainer = inspector.get('container');
      vmContainer.one('.viewlet-manager-footer button.confirm')
                 .simulate('click');
      assert.equal(deployStub.calledOnce(), true);
      var deployArgs = deployStub.lastArguments();
      // these need to be done individually because mocha doesn't like
      // deepEquals with undefined values.
      assert.equal(deployArgs[0], 'cs:precise/mediawiki-8');
      assert.equal(deployArgs[1], 'mediawiki');
      assert.deepEqual(deployArgs[2], {});
      assert.isUndefined(deployArgs[3]);
      assert.equal(deployArgs[4], 1);
      assert.deepEqual(deployArgs[5],
          { 'cpu-power': '', 'cpu-cores': '', 'mem': '', 'arch': '' });
      assert.strictEqual(deployArgs[6], null);
      assert.isFunction(deployArgs[7]);
    });
  });

  it('deploys with zero units if the charm is a subordinate', function() {
    inspector = setUpInspector(subordinateCharmData);
    env.connect();
    var vmContainer = inspector.get('container');
    vmContainer.one('.viewlet-manager-footer button.confirm').simulate('click');
    var message = env.ws.last_message();
    assert.strictEqual(message.Params.NumUnits, 0);
  });

  it('disables and resets input fields when \'use default config\' is active',
      function() {
        function testDisabled(hasAttr) {
          var settings = vmContainer.one(
              '.service-configuration .service-config');
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
        var vmContainer = inspector.get('container');
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

  it('Resets the canvas when hitting cancel', function(done) {
    // XXX (Jeff) YUI's simulate can't properly simulate focus or blur in
    // IE10 as of 3.9.1, 3.11 https://github.com/yui/yui3/issues/489
    if (Y.UA.ie === 10) { done(); }

    inspector = setUpInspector();
    var vmContainer = inspector.get('container');
    var nameInput = vmContainer.one('input[name=service-name]');
    var model = inspector.get('model');
    var serviceIcon = Y.one('tspan.name');

    assert.equal(serviceIcon.get('textContent'), '(mediawiki)', 'icon before');
    assert.equal(model.get('displayName'), '(mediawiki)', 'model before');

    var handler = vmContainer.delegate('valuechange', function() {
      assert.equal(model.get('displayName'), '(foo)', 'model callback');
      view.update(); // Simulating a db.fire('update') call
      assert.equal(serviceIcon.get('textContent'), '(foo)', 'icon callback');
      vmContainer.one('button.cancel').simulate('click');
      assert.equal(model.get('displayName'), '(mediawiki)', 'model after');
      view.update(); // Simulating a db.fire('update') call
      assert.equal(serviceIcon.get('textContent'), '(mediawiki)', 'icon after');
      handler.detach();
      done();
    }, 'input[name=service-name]');

    nameInput.simulate('focus');
    nameInput.set('value', 'foo');
  });

  it('Resets the canvas when hitting X', function(done) {
    // XXX (Jeff) YUI's simulate can't properly simulate focus or blur in
    // IE10 as of 3.9.1, 3.11 https://github.com/yui/yui3/issues/489
    if (Y.UA.ie === 10) { done(); }

    inspector = setUpInspector();
    var vmContainer = inspector.get('container');
    var nameInput = vmContainer.one('input[name=service-name]');
    var model = inspector.get('model');
    var serviceIcon = Y.one('tspan.name');

    assert.equal(serviceIcon.get('textContent'), '(mediawiki)', 'icon before');
    assert.equal(model.get('displayName'), '(mediawiki)', 'model before');

    var handler = vmContainer.delegate('valuechange', function() {
      assert.equal(model.get('displayName'), '(foo)', 'model callback');
      view.update(); // Simulating a db.fire('update') call
      assert.equal(serviceIcon.get('textContent'), '(foo)', 'icon callback');
      vmContainer.one('.close').simulate('click');
      assert.equal(model.get('displayName'), '(mediawiki)', 'model after');
      view.update(); // Simulating a db.fire('update') call
      assert.equal(serviceIcon.get('textContent'), '(mediawiki)', 'icon after');
      handler.detach();
      done();
    }, 'input[name=service-name]');

    nameInput.simulate('focus');
    nameInput.set('value', 'foo');
  });

  it('renders into the dom when instantiated', function() {
    inspector = setUpInspector();
    assert.isObject(content.one('.view-content'));
    container = inspector.get('container');
    // Basic sanity checks of the rendering.
    // The debug checkbox must start out disabled.
    assert(
        container.one('input[name=debug]').hasAttribute('disabled'),
        'debug checkbox is not disabled'
    );

    // The default config checkbox is a slider
    assert(
        container.one('input#use-default-toggle').hasClass('hidden-checkbox'),
        'Use default checkbox is not a hidden checkbox - slider');

  });

  it('syncs checkbox state with the visible ui', function() {
    inspector = setUpInspector();
    container = inspector.get('container');
    assert.isObject(container.one('.view-content'));
    // We need to enable the checkboxes before we can test them because
    // disabled checkboxes fire no events.
    var input = container.one('input[name=debug]');
    input.removeAttribute('disabled');

    var debugContainer = container.one('.toggle-debug').get('parentNode');
    var stateText = debugContainer.one('.textvalue');

    // The CSS is what capitalizes the text so the assertion values are lower
    // case.
    assert.equal(
        stateText.get('text').replace(/\s/g, ''),
        'false',
        'state did not start out false');
    debugContainer.one('label').simulate('click');
    assert.equal(
        stateText.get('text').replace(/\s/g, ''),
        'true',
        'state did not update to true');
  });

  it('properly renders a service without charm options', function() {
    // Mutate charmData before the render.
    delete charmData.charm.options;
    inspector = setUpInspector();
    container = inspector.get('container');
    // Verify the viewlet rendered, previously it would raise.
    assert.isObject(container.one('.view-content'));
    // Restore the test global
    charmData = utils.loadFixture('data/mediawiki-api-response.json', true);
  });

  it('hides configuration panel when a file is uploaded', function() {
    inspector = setUpInspector();
    var fileContents = 'yaml yaml yaml';

    inspector.views.ghostConfig
             .onFileLoaded('a.yaml', {target: {result: fileContents}});
    inspector.configFileContent.should.equal(fileContents);
    var settings = container.all('.charm-settings, .settings-wrapper.toggle');
    settings.each(function(node) {
      node.getStyle('display').should.equal('none');
    });
  });

  it('must restore file input when config is removed', function() {
    inspector = setUpInspector();
    container = inspector.get('container');
    var fileContents = 'yaml yaml yaml';

    inspector.views.ghostConfig
             .onFileLoaded('a.yaml', {target: {result: fileContents}});
    inspector.configFileContent.should.equal(fileContents);
    var settings = container.all('.charm-settings, .settings-wrapper.toggle');
    settings.each(function(node) {
      node.getStyle('display').should.equal('none');
    });
    // Load the file.
    inspector.views.ghostConfig
             .onFileLoaded('a.yaml', {target: {result: fileContents}});

    // And then click to remove it.
    container.one('.config-file .fakebutton').simulate('click');

    // The content should be gone now.
    assert.equal(
        inspector.configFileContent,
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
    container = inspector.get('container');
    var env = view.get('env');
    env.deploy = function(charm_url, service_name, config, config_raw) {
      received_config = config;
      received_config_raw = config_raw;
    };

    var config_raw = 'admins: \n user:pass';
    inspector.views.ghostConfig
             .onFileLoaded('a.yaml', {target: {result: config_raw}});

    container.one('.confirm').simulate('click');
    // The config from the charm model should be emptied out.
    assert.equal(received_config, undefined);
    // The config from the file should take precedence.
    assert.equal(received_config_raw, config_raw);
  });

  describe('Service destroy UI', function() {
    it('has a button to destroy the service', function() {
      inspector = setUpInspector();
      container = inspector.get('container');
      assert.notEqual(container.one('.destroy-service-trigger span'), null);
    });

    it('shows the destroy service prompt if the trigger is clicked',
        function() {
          inspector = setUpInspector();
          container = inspector.get('container');
          var promptBox = container.one('.destroy-service-prompt');
          assert.isTrue(promptBox.hasClass('closed'));
          container.one('.destroy-service-trigger span').simulate('click');
          assert.isFalse(promptBox.hasClass('closed'));
        });

    it('hides the destroy service prompt if cancel is clicked', function() {
      inspector = setUpInspector();
      container = inspector.get('container');
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
          container = inspector.get('container');
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
      var events = Y.juju.views.GhostServiceInspector.prototype.events;
      assert.equal(
          typeof events['.destroy-service-trigger span'].click, 'string');
      assert.equal(typeof events['.initiate-destroy'].click, 'string');
      assert.equal(typeof events['.cancel-destroy'].click, 'string');
    });
  });

});
