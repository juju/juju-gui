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


const Keysim = require('keysim');
const utils = require('./utils');

describe('application hotkeys', function() {
  let app, container, env, juju, jujuConfig;
  const keyboard = Keysim.Keyboard.US_ENGLISH;

  before(function(done) {
    // The module list is copied from index.html.mako and is required by
    // init.js.
    YUI(GlobalConfig).use([
      'acl',
      'analytics',
      'changes-utils',
      'juju-charm-models',
      'juju-bundle-models',
      'juju-controller-api',
      'juju-endpoints-controller',
      'juju-env-base',
      'juju-env-api',
      'juju-env-web-handler',
      'juju-models',
      'jujulib-utils',
      'bakery-utils',
      'net-utils',
      // juju-views group
      'd3-components',
      'juju-view-utils',
      'juju-topology',
      'juju-view-environment',
      'juju-landscape',
      // end juju-views group
      'io',
      'json-parse',
      'app-base',
      'app-transitions',
      'base',
      'bundle-importer',
      'bundle-import-notifications',
      'node',
      'model',
      'app-cookies-extension',
      'app-renderer-extension',
      'cookie',
      'querystring',
      'event-key',
      'event-touch',
      'model-controller',
      'FileSaver',
      'ghost-deployer-extension',
      'environment-change-set',
      'relation-utils',
      'yui-patches'], function(Y) {
      // init.js requires the window to contain the YUI object.
      window.yui = Y;
      juju = Y.namespace('juju');
      // The require needs to be after the yui modules have been loaded.
      const JujuGUI = require('../app/init');
      // 02-05-2016 Luke: I've moved this to 'before' rather then 'beforeEach'.
      // 'beforeEach' duplicated the 'keydown' event listener on subsequent
      // inits of the 'container' 'app' resulting in keyboard events firing
      // multiple times.
      container = utils.makeAppContainer();
      const userClass = new window.jujugui.User({storage: getMockStorage()});
      userClass.controller = {user: 'user', password: 'password'};
      env = new juju.environments.GoEnvironment({
        conn: new utils.SocketStub(),
        ecs: new juju.EnvironmentChangeSet(),
        user: userClass
      });
      env.connect();
      app = new JujuGUI({
        baseUrl: 'http://example.com/',
        flags: {},
        charmstoreURL: 'http://1.2.3.4/',
        plansURL: 'http://plans.example.com/',
        termsURL: 'http://terms.example.com/',
        consoleEnabled: true,
        controllerAPI: new juju.ControllerAPI({
          conn: new utils.SocketStub(),
          user: userClass
        }),
        env: env,
        jujuCoreVersion: '2.0.0',
        controllerSocketTemplate: '',
        user: userClass
      });
      done();
    });
  });

  after(function(done) {
    window.juju_config = jujuConfig;
    env.close(() => {
      app.destructor();
      container.remove(true);
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

  it('should listen for "?" events', function() {
    window.GUI_VERSION = {version: '1.2.3', commit: '123abc]'};
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
    let searchInput = document.createElement('input');
    searchInput.setAttribute('id', 'charm-search-field');
    container.appendChild(searchInput);

    const keystroke = new Keysim.Keystroke(Keysim.Keystroke.ALT, 83);
    keyboard.dispatchEventsForKeystroke(keystroke, container);

    // Did charm-search-field get the focus?
    assert.equal(searchInput, document.activeElement);
  });
});
