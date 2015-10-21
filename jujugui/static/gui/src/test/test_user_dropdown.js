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

describe('user dropdown view', function() {

  var userView, views, models, utils, viewNode, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['node',
      'juju-models',
      'juju-views',
      'juju-tests-utils',
      'node-event-simulate',
      'user-dropdown'], function(Y) {

      views = Y.namespace('juju.views');
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');

      done();
    });
  });

  beforeEach(function() {
    viewNode = utils.makeContainer(this, 'user-dropdown');
    userView = new views.UserDropdownView({
      container: viewNode
    });
    userView.render();
  });

  afterEach(function() {
    if (userView) {
      userView.destroy();
    }
  });

  it('can render view', function() {
    assert.equal(viewNode.hasClass('dropdown-menu'), true);
  });
});
