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


describe('environment header view', function() {
  var Y, container, utils, views, view, View;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['environment-header',
                               'juju-views',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {

      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      View = views.EnvironmentHeaderView;
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'environment-header');
    view = new View({container: container}).render();
  });

  afterEach(function() {
    container.remove(true);
    view.destroy();
  });

  it('should apply the wrapping class to the container', function() {
    assert.equal(container.hasClass('environment-header'), true);
  });

  it('can set whether to be full width', function() {
    assert.equal(container.hasClass('full'), false);
    view.setWidthFull();
    assert.equal(container.hasClass('full'), true);
  });

  it('fires an event on tab change', function(done) {
    view.on('changeEnvironmentView', function(e) {
      assert.equal(e.environment, 'serviceView');
      done();
    });
    container.one('.tab a').simulate('click');
  });
});
