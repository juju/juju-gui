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


describe('deployer bar view', function() {
  var Y, container, utils, views, view, View;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['deployer-bar',
                               'juju-views',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {

      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      View = views.DeployerBarView;
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'deployer-bar');
    view = new View({container: container}).render();
  });

  afterEach(function() {
    container.remove(true);
    view.destroy();
  });

  it('should apply the wrapping class to the container', function() {
    assert.equal(container.hasClass('deployer-bar'), true);
  });

  it('should commit ECS changes when deploy is clicked', function() {
    // XXX This is just a temporary measure; the deployer bar will have further
    // integration with the app and ECS.
    var stubApp = utils.makeStubMethod(window, 'app');
    stubApp.ecs = {
      commit: utils.makeStubFunction()
    };
    this._cleanups.push(stubApp.reset);

    container.one('.deploy-button').simulate('click');
    assert.isTrue(stubApp.ecs.commit.calledOnce());
  });

});
