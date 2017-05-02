/*
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

describe('application hotkeys', function() {
  let app, container, env, juju, jujuConfig, keyboard, utils, Y;
  const requirements = [
    'juju-gui',
    'juju-tests-utils',
    'node-event-simulate',
    'modal-gui-settings',
    'modal-shortcuts'
  ];

  before(function(done) {
    Y = YUI(GlobalConfig).use(requirements, function(Y) {
      utils = Y.namespace('juju-tests.utils');
      juju = Y.namespace('juju');
      done();
    });
  });

  const getMockStorage = function() {
    return new function() {
      return {
        store: {},
        setItem: function(name, val) { this.store['name'] = val; },
        getItem: function(name) { return this.store['name'] || null; }
      };
    };
  };

  beforeEach(function() {
    jujuConfig = window.juju_config;
    window.juju_config = {
      charmstoreURL: 'http://1.2.3.4/',
      plansURL: 'http://plans.example.com/',
      termsURL: 'http://terms.example.com/'
    };
    container = utils.makeAppContainer();
    const userClass = new window.jujugui.User({storage: getMockStorage()});
    userClass.controller = {user: 'user', password: 'password'};
    env = new juju.environments.GoEnvironment({
      conn: new utils.SocketStub(),
      ecs: new juju.EnvironmentChangeSet(),
      user: userClass
    });
    env.connect();
    app = new Y.juju.App({
      baseUrl: 'http://example.com/',
      consoleEnabled: true,
      controllerAPI: new juju.ControllerAPI({
        conn: new utils.SocketStub(),
        user: userClass
      }),
      env: env,
      container: container,
      viewContainer: container,
      jujuCoreVersion: '2.0.0',
      controllerSocketTemplate: '',
      user: userClass
    });
    app.showView(new Y.View());
    app.activateHotkeys();
    app.render();
    keyboard = Keysim.Keyboard.US_ENGLISH;
  });

  afterEach(function(done) {
    window.juju_config = jujuConfig;
    env.close(() => {
      app.destroy({remove: true});
      container.remove(true);
      done();
    });
  });

  it('should listen for "?" events', function() {
    const keystroke = new Keysim.Keystroke(Keysim.Keystroke.SHIFT, 191);
    keyboard.dispatchEventsForKeystroke(keystroke, container);

    const shortcuts = document.getElementById('modal-shortcuts');
    assert.equal(shortcuts.children.length > 0, true,
      'The shortcuts component did not render');
  });

  it('should listen for "!" events', function() {
    const keystroke = new Keysim.Keystroke(Keysim.Keystroke.SHIFT, 49);
    keyboard.dispatchEventsForKeystroke(keystroke, container);

    const settings = document.getElementById('modal-gui-settings');
    assert.equal(settings.children.length > 0, true,
      'The settings component did not render');
  });

  it('should listen for Alt-S key events', function() {
    var searchInput = document.createElement('input');
    searchInput.setAttribute('id', 'charm-search-field');
    container.appendChild(searchInput);
    const keystroke = new Keysim.Keystroke(Keysim.Keystroke.ALT, 83);
    keyboard.dispatchEventsForKeystroke(keystroke, container);
    // Did charm-search-field get the focus?
    assert.equal(searchInput, document.activeElement);
  });
});
