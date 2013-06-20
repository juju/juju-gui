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


describe.only('sharing overlay', function() {
  var container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'browser-sharing-overlay',
      'node',
      'node-event-simulate',
      'juju-tests-utils'
    ], function(Y) {
      done();
    });
  });

  beforeEach(function() {
    var utils = Y.namespace('juju-tests.utils');
    container = utils.makeContainer('charm-container');
  });

  afterEach(function() {
    container.remove(true);
  });

  it('renders invisibly', function() {
    var overlay = new Y.juju.widgets.browser.SharingOverlay({
      button: container
    });
    overlay.render(container);
    assert.isFalse(overlay.get('visible'));
  });

  it('changes visiblity when the button is clicked', function() {
    var overlay = new Y.juju.widgets.browser.SharingOverlay({
      button: container
    });
    overlay.render(container);
    container.simulate('click');
    assert.isTrue(overlay.get('visible'));
    container.simulate('click');
    assert.isFalse(overlay.get('visible'));
  });
});
