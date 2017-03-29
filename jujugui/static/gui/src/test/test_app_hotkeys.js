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
  let app, container, env, juju, jujuConfig, utils, windowNode, Y;
  const requirements = ['juju-gui', 'juju-tests-utils', 'node-event-simulate'];

  before(function(done) {
    Y = YUI(GlobalConfig).use(requirements, function(Y) {
      utils = Y.namespace('juju-tests.utils');
      juju = Y.namespace('juju');
      windowNode = Y.one(window);
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
    container = utils.makeAppContainer(Y);
    container.one('#shortcut-help').setStyle('display', 'none');
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
    windowNode.simulate('keydown', {
      keyCode: 191, // "/" key.
      shiftKey: true
    });
    var help = container.one('#shortcut-help');
    assert.equal(help.getStyle('display'), 'block',
                 'Shortcut help not displayed');
    // Is the "S-?" label displayed in the help?
    var bindings = help.all('.two-col'),
        found = false;
    bindings.each(function(node) {
      var text = node.getDOMNode().textContent;
      if (text === 'Shift + ?') {
        found = true;
      }
    });
    assert.equal(found, true, 'Shortcut label not found');
    help.hide();
  });

  it('should listen for Alt-S key events', function() {
    var searchInput = Y.Node.create('<input/>');
    searchInput.set('id', 'charm-search-field');
    container.append(searchInput);
    windowNode.simulate('keydown', {
      keyCode: 83, // "S" key.
      altKey: true
    });
    // Did charm-search-field get the focus?
    assert.equal(searchInput, Y.one(document.activeElement));
  });

  it('should listen for alt-E events', function(done) {
    var altEtriggered = false;
    app.on('navigateTo', function(ev) {
      if (ev && ev.url === '/:gui:/') {
        altEtriggered = true;
      }
      // Avoid URL change performed by additional listeners.
      ev.stopImmediatePropagation();
      assert.isTrue(altEtriggered);
      done();
    });
    windowNode.simulate('keydown', {
      keyCode: 69, // "E" key.
      altKey: true
    });
  });
});
