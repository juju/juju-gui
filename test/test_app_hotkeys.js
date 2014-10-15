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
  var app, container, env, windowNode, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['juju-gui', 'juju-tests-utils', 'node-event-simulate'], function(Y) {
          env = {
            after: function() {},
            get: function() {},
            on: function() {},
            once: function() {},
            set: function() {}
          };
          windowNode = Y.one(window);
          done();
        });

  });

  beforeEach(function() {
    container = Y.namespace('juju-tests.utils').makeContainer(this);
    var _renderDeployerBarView = Y.namespace('juju-tests.utils').makeStubMethod(
        Y.juju.App.prototype, '_renderDeployerBarView');
    this._cleanups.push(_renderDeployerBarView.reset);
    app = new Y.juju.App({
      env: env,
      container: container,
      viewContainer: container
    });
    app.showView(new Y.View());
    app.activateHotkeys();

    Y.one('#main').append(container);
    app.render();
  });

  afterEach(function(done) {
    container.remove(true);
    app.after('destroy', function() {
      done();
    });
    app.destroy({remove: true});
  });

  it('should listen for "?" events', function() {
    windowNode.simulate('keydown', {
      keyCode: 191, // "/" key.
      shiftKey: true
    });
    var help = Y.one('#shortcut-help');
    assert.equal(help.getStyle('display'), 'block',
                 'Shortcut help not displayed');
    // Is the "S-?" label displayed in the help?
    var bindings = help.all('td.binding'),
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

  it('should listen for ctrl+alt+h events', function() {
    var body = Y.one('body');
    assert.equal(body.hasClass('state-sidebar-hidden'), false);
    windowNode.simulate('keydown', {
      keyCode: 104, // "h" key.
      ctrlKey: true,
      altKey: true
    });
    assert.equal(body.hasClass('state-sidebar-hidden'), true);
  });
});

