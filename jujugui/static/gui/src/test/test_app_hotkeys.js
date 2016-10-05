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
  let app, container, controllerAPI, env, windowNode, Y;
  const requirements = ['juju-gui', 'juju-tests-utils', 'node-event-simulate'];

  before(function(done) {
    Y = YUI(GlobalConfig).use(requirements, function(Y) {
      controllerAPI = {
        after: () => {},
        getBundleChanges: () => {},
        set: () => {},
        setAttrs: () => {},
        setCredentials: () => {}
      };
      env = {
        after: () => {},
        get: () => {},
        on: () => {},
        once: () => {},
        set: () => {},
        setCredentials: () => {},
        getCredentials: () => {
          return {areAvailable: false};
        }
      };
      windowNode = Y.one(window);
      done();
    });
  });

  beforeEach(function() {
    container = Y.namespace('juju-tests.utils').makeContainer(this);
    container.appendChild(Y.Node.create('<div/>'))
      .set('id', 'shortcut-help')
      .setStyle('display', 'none');
    app = new Y.juju.App({
      controllerAPI: controllerAPI,
      env: env,
      container: container,
      viewContainer: container,
      jujuCoreVersion: '2.0.0',
      controllerSocketTemplate: ''
    });
    app.showView(new Y.View());
    app.activateHotkeys();
    app.render();
  });

  afterEach(function() {
    container.remove(true);
    app.destroy({remove: true});
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
