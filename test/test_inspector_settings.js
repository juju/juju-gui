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

describe('Inspector Settings', function() {

  var view, service, db, models, utils, juju, env, conn, container,
      inspector, Y, jujuViews, charmData, ecs;

  before(function(done) {
    var requires = ['juju-gui', 'juju-views', 'juju-tests-utils',
      'juju-charm-store', 'juju-charm-models', 'node-event-simulate',
      'environment-change-set'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          utils = Y.namespace('juju-tests.utils');
          models = Y.namespace('juju.models');
          jujuViews = Y.namespace('juju.views');
          juju = Y.namespace('juju');
          charmData = utils.loadFixture(
              'data/mediawiki-api-response.json',
              true);
          done();
        });

  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'container');
    conn = new utils.SocketStub();
    db = new models.Database();
    ecs = new juju.EnvironmentChangeSet();
    env = juju.newEnvironment({conn: conn, ecs: ecs});
    env.update_annotations = function() {};
  });

  afterEach(function(done) {
    if (view) {
      if (inspector) {
        delete view.inspector;
      }
      view.destroy();
    }
    env.after('destroy', function() { done(); });
    env.destroy();
  });

  var setUpInspector = function(options) {
    var charm = new models.Charm(charmData.charm),
        charmId = charm.get('id');
    db.charms.add(charm);
    if (options && options.useGhost) {
      service = db.services.ghostService(charm);
    } else {
      var parsedConfig = {};
      // because a test deletes the config data we need a check to
      // stop it from falling over.
      if (charm.get('options')) {
        Y.Object.each(charm.get('options'), function(val, key) {
          // For boolean fields the default is false, so we need to check
          // undefined directly.
          if (val['default'] !== undefined) {
            parsedConfig[key] = val['default'];
          } else {
            parsedConfig[key] = '';
          }
        });
      }
      service = new models.Service({
        id: 'mediawiki',
        charm: charmId,
        exposed: false,
        config: parsedConfig
      });
      db.services.add(service);
      db.onDelta({data: {result: [
        ['unit', 'add', {id: 'mediawiki/0', agent_state: 'pending'}],
        ['unit', 'add', {id: 'mediawiki/1', agent_state: 'pending'}],
        ['unit', 'add', {id: 'mediawiki/2', agent_state: 'pending'}]
      ]}});
    }
    var fakeStore = new Y.juju.charmworld.APIv3({});
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
    Y.Node.create([
      '<div id="content">'
    ].join('')).appendTo(container);
    return view.createServiceInspector(service, {databinding: {interval: 0}});
  };

  // Retrieve and return the config viewlet.
  var getViewlet = function(inspector) {
    return inspector.views.config;
  };

  // Change the value of the given key in the constraints form.
  // Return the corresponding node.
  var changeForm = function(viewlet, key, value) {
    var selector = 'textarea[name=' + key + '].config-field';
    var node = viewlet.get('container').one(selector);
    node.set('value', value);
    // Trigger bindingEngine to notice change.
    var bindingEngine = inspector.bindingEngine;
    bindingEngine._nodeChanged(node, viewlet);
    return node;
  };

  it('properly renders a service without charm options', function() {
    // Mutate charmData before the render.
    delete charmData.charm.options;
    inspector = setUpInspector();
    // Verify the viewlet rendered, previously it would raise.
    assert.isObject(container.one('.config-file'));
    // Restore the test global
    charmData = utils.loadFixture('data/mediawiki-api-response.json', true);
  });

  it('properly renders charm options with booleans', function() {
    inspector = setUpInspector();
    // Verify the viewlet rendered, previously it would raise.
    assert.isObject(container.one('.config-file'));
    // Restore the test global
    charmData = utils.loadFixture('data/mediawiki-api-response.json', true);

    // Verify we find our checkbox Also note that it's hidden because we're
    // using the slider markup and styling for boolean fields.
    assert.equal(
        container.all('input.hidden-checkbox').size(),
        1,
        'did not render one boolean field');

    // Verify that the textual representation is there.
    assert.equal(
        container.all('.textvalue').size(),
        1,
        'can not find the textual value for the checkbox.');

    // And the value will toggle with the checkbox
    var debugContainer = container.one('.toggle-debug').get('parentNode');
    assert.equal(
        debugContainer.one('.textvalue').get('text').replace(/\s/g, ''),
        'false');
    debugContainer.one('label').simulate('click');
    assert.equal(
        debugContainer.one('.textvalue').get('text').replace(/\s/g, ''),
        'true');
  });

  /**** Begin service destroy UI tests. ****/

  it('has a button to destroy the service', function() {
    inspector = setUpInspector();
    assert.isObject(container.one('.destroy-service-trigger span'));
  });

  it('shows the destroy service prompt if the trigger is clicked', function() {
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

  it('initiates a destroy if the "Destroy" button is clicked', function(done) {
    inspector = setUpInspector();
    var promptBox = container.one('.destroy-service-prompt');
    // First we have to open the prompt.
    container.one('.destroy-service-trigger span').simulate('click');
    assert.isFalse(promptBox.hasClass('closed'));
    // If the test times out, it failed (because the expected function call
    // didn't happen).
    inspector.initiateServiceDestroy = function() {
      done();
    };
    container.one('.initiate-destroy').simulate('click');
  });

  it('wires up UI elements to handlers for service inspector', function() {
    // There are UI elements and they all have to be wired up to something.
    inspector = setUpInspector();
    var events = inspector.constructor.prototype.events;
    assert.equal(
        typeof events['.destroy-service-trigger span'].click, 'string');
    assert.equal(typeof events['.initiate-destroy'].click, 'string');
    assert.equal(typeof events['.cancel-destroy'].click, 'string');
  });

  it('responds to service removal failure by alerting the user', function() {
    var notificationAdded;

    inspector = setUpInspector();

    var SERVICE_NAME = 'the name of the service being removed';
    var evt = {
      err: true,
      service_name: SERVICE_NAME
    };

    var db = {
      notifications: {
        add: function(notification) {
          var attrs = notification.getAttrs();
          // The notification has the required attributes.
          assert.isTrue(attrs.hasOwnProperty('title'));
          assert.isTrue(attrs.hasOwnProperty('message'));
          // The service name is mentioned in the error message.
          assert.notEqual(attrs.message.indexOf(SERVICE_NAME, -1));
          assert.equal(attrs.level, 'error');
          assert.deepEqual(attrs.modelId, ['service', 'mediawiki']);
          notificationAdded = true;
        }
      }
    };

    inspector._destroyServiceCallback(service, db, evt);
    assert.isTrue(notificationAdded);
  });

  it('removes the inspector when service is destroyed', function() {
    window.flags.il = true;
    var container = utils.makeContainer(this, 'bws-sidebar');
    container.append('<div class="bws-content"></div>');
    inspector = setUpInspector();

    var stubFire = utils.makeStubMethod(inspector, 'fire');
    this._cleanups.push(stubFire.reset);

    var notificationAdded = false;
    var SERVICE_NAME = 'the name of the service being removed';
    var evt = {
      err: false,
      service_name: SERVICE_NAME
    };

    var db = {
      notifications: {
        add: function(attrs) {
          // The notification has the required attributes.
          assert.equal(attrs.hasOwnProperty('title'), true,
              'Does not have a title');
          assert.equal(attrs.hasOwnProperty('message'), true,
              'Does not have a message');
          // The service name is mentioned in the error message.
          assert.notEqual(attrs.message.indexOf(SERVICE_NAME, -1));
          assert.equal(attrs.level, 'important');
          notificationAdded = true;
        }
      }
    };

    inspector._destroyServiceCallback(service, db, evt);
    assert.isTrue(notificationAdded);
    // Check that changeState was fired.
    assert.equal(stubFire.calledOnce(), true, 'Fire not called');
    window.flags = {};
  });

  /**** End service destroy UI tests. ****/

  describe('config file upload', function() {
    it('hides the configuration inputs when a file is uploaded', function() {
      inspector = setUpInspector();
      var fileContents = 'yaml yaml yaml';
      inspector.views.config
               .onFileLoaded('a.yaml', {target: {result: fileContents}});
      assert.deepEqual(inspector.configFileContent, fileContents);
      var settings = inspector.get('container')
                              .all('.charm-settings, .settings-wrapper.toggle');
      settings.each(function(node) {
        assert.equal(node.getStyle('display'), 'none');
      });
    });

    it('restores file input when config is removed', function() {
      inspector = setUpInspector();
      container = inspector.get('container');
      var fileContents = 'yaml yaml yaml';
      inspector.views.config
               .onFileLoaded('a.yaml', {target: {result: fileContents}});
      assert.equal(inspector.configFileContent, fileContents);
      var settings = container.all('.charm-settings, .settings-wrapper.toggle');
      settings.each(function(node) {
        assert.equal(node.getStyle('display'), 'none');
      });
      // Load the file.
      inspector.views.config
               .onFileLoaded('a.yaml', {target: {result: fileContents}});
      // And then click to remove it.
      container.one('.config-file .fakebutton').simulate('click');
      // The content should be gone now.
      assert.equal(inspector.configFileContent, undefined);
      assert.equal(container.one('.config-file input').get('files').size(), 0);
      assert.equal(
          container.one('.config-file .fakebutton').getContent(),
          'Import config file...'
      );
    });

    it('is able to set_config with configuration from a file', function(done) {
      inspector = setUpInspector();
      container = inspector.views.config.get('container');
      var env = view.get('env');
      var config_raw = 'admins: \n user:pass';
      var oldSetConfig = env.set_config;
      env.set_config = function(
          serviceName, config, data, serviceConfig, callback) {
        assert.equal(serviceName, 'mediawiki');
        assert.isNull(config);
        assert.equal(data, config_raw);
        assert.isObject(serviceConfig);
        assert.isFunction(callback);
        env.set_config = oldSetConfig;
        done();
      };
      inspector.views.config
               .onFileLoaded('a.yaml', {target: {result: config_raw}});
      var confirmBtn = container.one('.confirm');
      confirmBtn.simulate('click');
    });
  });

  it('saves changes to settings values', function() {
    inspector = setUpInspector();
    env.connect();
    var vmContainer = inspector.get('container'),
        input = vmContainer.one('textarea[name=admins]'),
        button = vmContainer.one('.configuration-buttons .confirm');

    assert.equal(db.services.item(0).get('config').admins, '');
    input.set('value', 'foo');
    // Force the databinding to notice the change in-line.
    inspector.bindingEngine._nodeChanged(
        input, inspector.views.config);
    button.simulate('click');
    var message = env.ws.last_message();
    assert.equal('foo', message.Params.Options.admins);
    // Send back a success message.
    env.ws.msg({RequestId: message.RequestId});
    assert.equal(button.getHTML(), 'Save changes');
    assert.isTrue(input.hasClass('change-saved'));
  });

  it('can cancel changes', function() {
    // Set up.
    inspector = setUpInspector();
    env.connect();
    var viewlet = getViewlet(inspector);
    var node = viewlet.get('container')
                      .one('textarea[data-bind="config.admins"]');
    var parentNode = node.ancestor('.settings-wrapper');
    inspector.get('model').set('config', {admins: 'g:s'});
    changeForm(viewlet, 'admins', 'k:t');
    assert.equal(
        parentNode.all('.modified').size(),
        1,
        'did not find a modified node');
    // Act.
    viewlet.get('container').one('button.cancel').simulate('click');
    // Validate.
    assert.equal(node.get('value'), 'g:s');
    // No modified markers are shown.
    // Verify the form is updated.
    assert.equal(
        parentNode.all('.modified').size(),
        0,
        'found a modified node');
  });

  it('can cancel pending conflicts', function() {
    // Set up.
    inspector = setUpInspector();
    env.connect();
    var viewlet = getViewlet(inspector);
    var node = viewlet.get('container').one('textarea[name="admins"]');
    var parentNode = node.ancestor('.settings-wrapper');
    changeForm(viewlet, 'admins', 'k:t');
    inspector.get('model').set('config', {admins: 'g:s'});
    assert.equal(
        parentNode.all('[name=admins].conflict-pending').size(),
        1,
        'did not find a conflict-pending node');
    // Act.
    viewlet.get('container').one('button.cancel').simulate('click');
    // Validate.
    assert.equal(node.get('value'), 'g:s');
    // No conflict or modified markers are shown.
    assert.equal(
        parentNode.all('.modified').size(),
        0,
        'found a modified node');
    assert.equal(
        parentNode.all('.conflict-pending').size(),
        0,
        'found a conflict-pending node');
  });

  it('can cancel conflicts that are being resolved', function() {
    // Set up.
    inspector = setUpInspector();
    env.connect();
    var viewlet = getViewlet(inspector);
    var node = viewlet.get('container').one('textarea[name="admins"]');
    var parentNode = node.ancestor('.settings-wrapper');
    changeForm(viewlet, 'admins', 'k:t');
    inspector.get('model').set('config', {admins: 'g:s'});
    node.simulate('click');
    assert.equal(
        parentNode.all('[name=admins].conflict').size(),
        1,
        'did not find the conflict node');
    // Act.
    viewlet.get('container').one('button.cancel').simulate('click');
    // Validate.
    assert.equal(node.get('value'), 'g:s');
    // No conflict or modified markers are shown.
    assert.equal(
        parentNode.all('.modified').size(),
        0,
        'found a modified node');
    assert.equal(
        parentNode.all('.conflict-pending').size(),
        0,
        'found a conflict-pending node');
    assert.equal(
        parentNode.all('[name=admins].conflict').size(),
        0,
        'found the conflict node');
  });

});
