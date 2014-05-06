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


describe('service scale up view', function() {
  var Y, container, models, utils, views, view, View;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['service-scale-up-view',
                               'juju-models',
                               'juju-views',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {

      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      View = views.ServiceScaleUpView;
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'service-scale-up-view');
  });

  afterEach(function() {
    view.destroy();
    container.remove(true);
  });

  function generateView(db) {
    db = db || { services: new models.ServiceList() };
    view = new View({
      container: container,
      db: db
    });
    return view;
  }

  it('should apply the wrapping class to the container', function() {
    generateView().render();
    assert.equal(container.hasClass('service-scale-up-view'), true);
  });

  it('removes the class from the container when destroyed', function() {
    generateView().render();
    assert.equal(container.hasClass('service-scale-up-view'), true);
    view.destroy();
    assert.equal(container.hasClass('service-scale-up-view'), false);
  });

  it('binds to the services change events', function() {
    var db = { services: new models.ServiceList() };
    var onStub = utils.makeStubMethod(db.services, 'on');
    generateView(db);
    this._cleanups.push(onStub.reset);
    assert.equal(onStub.calledOnce(), true);
    var args = onStub.lastArguments();
    assert.deepEqual(args[0], ['*:add', '*:remove', '*:change']);
  });

  it('updates the serviceList when the service db changes', function(done) {
    generateView();
    var updateServiceList = utils.makeStubMethod(view, '_updateServiceList');
    this._cleanups.push(updateServiceList.reset);
    var updateUI = utils.makeStubMethod(view, '_updateUI');
    this._cleanups.push(updateUI.reset);
    view.render();
    view.get('db').services.after('*:change', function() {
      // updateServiceList is stubbed after instantiation so we only see it
      // being called once.
      assert.equal(updateServiceList.callCount(), 1, 'updateServiceList');
      updateServiceList.passThroughToOriginalMethod();
      assert.equal(updateUI.callCount(), 2);
      done();
    });
    view.get('db').services.fire('foo:change');
  });

});
