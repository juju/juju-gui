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

describe('Inspector Conflict UX', function() {

  var Y, juju, views, templates, utils, container, models;
  var conn, env, view, service, charmData, db, inspector, sidebar;
  var modifyAndWaitHandler;

  before(function(done) {
    var requires = ['juju-databinding',
                    'juju-view-inspector',
                    'juju-templates',
                    'juju-gui',
                    'juju-views',
                    'node-event-simulate',
                    'subapp-browser-sidebar',
                    'juju-charm-models',
                    'base',
                    'charmstore-api',
                    'juju-models'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      utils = window.jujuTestUtils.utils;
      views = Y.namespace('juju.views');
      templates = views.Templates;
      charmData = utils.loadFixture(
          'data/mediawiki-api-response.json',
          true);
      done();
    });
  });

  beforeEach(function() {
    // This is not being done in the utils.makeContainer because the simulate
    // function in YUI has a bug which causes it to fail/
    container = Y.Node.create('<div>');
    container.set('id', 'container');
    container.appendTo(document.body);
    container.setStyle('position', 'absolute');
    container.setStyle('top', '-10000px');
    container.setStyle('left', '-10000px');
    // Add the destroy ability to the test hook context to be run on
    // afterEach automatically.
    this._cleanups.push(function() {
      container.remove(true);
      container.destroy();
    });
    db = new models.Database();
    conn = new utils.SocketStub();
    env = new juju.environments.GoEnvironment({conn: conn});
    env.update_annotations = function() {};
    env.set('ecs', {
      changeSet: {
        'setConfig-123': {
          command: {
            args: ['service', {'logo': 'superlogo.gif'}]
          }
        }}});
    inspector = setUpInspector();
  });

  afterEach(function(done) {
    delete view.inspector;
    view.destroy();
    sidebar.destroy();
    env.after('destroy', function() { done(); });
    env.destroy();
  });

  function setUpInspector(options) {
    var charm = new models.Charm(charmData.charm),
        charmId = charm.get('id');
    db.charms.add(charm);
    service = new models.Service({
      id: 'mediawiki',
      charm: charmId,
      config: {
        logo: 'foo',
        debug: false
      }});
    db.services.add(service);
    db.onDelta({data: {result: [
      ['unit', 'add', {id: 'mediawiki/0', agent_state: 'pending'}]
    ]}});

    var fakeStore = new Y.juju.charmstore.APIv4({});
    fakeStore.getIconPath = function() {
      return 'charm icon url';
    };
    view = new views.environment({
      container: container,
      db: db,
      env: env,
      charmstore: fakeStore
    });
    view.render();
    Y.Node.create(['<div id="content">'].join('')).appendTo(container);
    sidebar = new Y.juju.browser.views.Sidebar({ container: container });
    sidebar.render();
    return view.createServiceInspector(service, {databinding: {interval: 0}});
  }

  function modifyAndWait(node, value, callback) {
    var event,
        prop;
    var isCheckbox = node.getAttribute('type') === 'checkbox' ? true : false;
    if (isCheckbox) {
      event = 'change';
    } else {
      event = 'valueChange';
    }
    modifyAndWaitHandler = node.after(event, function(e) {
      callback(node);
      if (modifyAndWaitHandler) {
        modifyAndWaitHandler.detach();
      }
    });
    // Tricks to simulate valueChange
    node.simulate('focus');

    if (isCheckbox) {
      prop = 'checked';
    } else {
      prop = 'value';
    }
    node.set(prop, value);

    if (isCheckbox) {
      node.simulate('change');
    }
  }

  it('should be able to indicate change to fields', function(done) {
    // XXX (Jeff) YUI's simulate can't properly simulate focus or blur in
    // IE10 as of 3.9.1, 3.11 https://github.com/yui/yui3/issues/489
    if (Y.UA.ie === 10) {
      done();
    }
    var input = container.one('#input-logo');
    assert.equal(input.get('value'), 'foo');

    // Simulate editing.
    modifyAndWait(input, 'something new', function(node) {
      // See that it got the proper style added
      assert.equal(node.hasClass('modified'), true);
      done();
    });
  });

  it('should respect that some fields do not need indicating', function(done) {
    // For instance, in multiple items bound to a single model field, we might
    // choose to only have one indicate a changed value.
    // XXX (Jeff) YUI's simulate can't properly simulate focus or blur in
    // IE10 as of 3.9.1, 3.11 https://github.com/yui/yui3/issues/489
    if (Y.UA.ie === 10) {
      done();
    }
    var input = container.one('#input-logo');
    // Indicate this should not show conflict ux via a data- attribute.
    input.setData('skipconflictux', true);
    assert.equal(input.get('value'), 'foo');

    // Simulate editing.
    modifyAndWait(input, 'something new', function(node) {
      // It does not get the conflict css classes.
      assert.equal(node.hasClass('modified'), false);
      done();
    });
  });

  it('should indicate conflict and allow resolution of config', function(done) {
    // XXX (Jeff) YUI's simulate can't properly simulate focus or blur in
    // IE10 as of 3.9.1, 3.11 https://github.com/yui/yui3/issues/489
    if (Y.UA.ie === 10) {
      done();
    }
    var input = container.one('#input-logo');
    assert.equal(input.get('value'), 'foo');

    modifyAndWait(input, 'form value', function() {
      // See that it got the proper style added
      assert.equal(input.hasClass('modified'), true,
          'missing modified class');

      service.set('environmentConfig', {logo: 'conflicting value'});
      // Setting of this conflicted Fields attribute is what tells us that the
      // handlers are attached properly because the conflict-pending class
      // assert would fail if it's not.
      service.set('_conflictedFields', ['logo']);
      assert.equal(input.hasClass('conflict-pending'), true,
          'missing conflict-pending class');

      // Open the conflict dialog
      input.simulate('click');
      var conflict_option = container.one('#input-logo-env.conflicted-env');
      assert.equal(conflict_option.get('text'), 'conflicting value');

      // Select the models value
      conflict_option.simulate('click');

      // Verify the form is updated.
      assert.equal(input.get('value'), 'conflicting value');
      assert.equal(input.hasClass('modified'), false);
      assert.equal(input.hasClass('conflict'), false);
      assert.equal(
          env.get('ecs').changeSet['setConfig-123'].command.args[1].logo,
          'conflicting value');
      assert.deepEqual(service.get('_conflictedFields'), []);
      assert.deepEqual(service.get('_dirtyFields'), []);
      done();
    });
  });
});
