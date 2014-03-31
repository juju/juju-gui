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


describe('machine view panel view', function() {
  var Y, container, utils, views, view, View;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['machine-view-panel',
                               'juju-views',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {

      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      View = views.MachineViewPanelView;
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'machine-view-panel');
    view = new View({container: container}).render();
  });

  afterEach(function() {
    container.remove(true);
    view.destroy();
  });

  it('should apply the wrapping class to the container', function() {
    assert.equal(container.hasClass('machine-view-panel'), true);
  });

  it('can set whether to be full width', function() {
    assert.equal(container.hasClass('full'), false);
    view.setWidthFull();
    assert.equal(container.hasClass('full'), true);
  });

  it('should render the header widgets', function() {
    assert.equal(container.one('.column .head .title').get('text'),
        'Unplaced units');
  });
});
