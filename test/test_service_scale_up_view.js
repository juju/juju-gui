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

    view = new View({
      container: container,
      services: new models.ServiceList()
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

  it('can be hidden', function() {
    generateView().render();
    assert.equal(container.hasClass('hidden'), false);
    view.hideScaleUp();
    assert.equal(container.hasClass('hidden'), true);
  });

  it('can be made visible', function() {
    generateView().render();
    view.hideScaleUp();
    assert.equal(container.hasClass('hidden'), true);
    view.showScaleUp();
    assert.equal(container.hasClass('hidden'), false);
  });

  it('it is closed by default', function() {
    generateView().render();
    var container = view.get('container');
    assert.equal(container.hasClass('opened'), false);
  });

  it('shows/hides the service list when clicking the [+]/X/Cancel buttons',
      function() {
        generateView().render();
        var container = view.get('container');
        assert.equal(container.hasClass('opened'), false);
        container.one('button.closed').simulate('click');
        assert.equal(container.hasClass('opened'), true);
        container.one('button.opened').simulate('click');
        assert.equal(container.hasClass('opened'), false);
        container.one('button.closed').simulate('click');
        assert.equal(container.hasClass('opened'), true);
        container.one('button.cancel').simulate('click');
        assert.equal(container.hasClass('opened'), false);
      });

  it('shows a list of the services in the environment', function() {
    generateView().render();
    view.get('services').add({ id: 'foo' });
    container.one('button.closed').simulate('click');
    assert.equal(container.all('li').size(), 1);
  });

  it('closing and opening the view updates the list of services', function() {
    generateView().render();
    view.get('services').add({ id: 'foo' });
    container.one('button.closed').simulate('click');
    assert.equal(container.all('li').size(), 1);
    view.get('services').add({ id: 'foobar' });
    // It should not auto update the list.
    assert.equal(container.all('li').size(), 1);
    // close and open the service list.
    container.one('button.opened').simulate('click');
    container.one('button.closed').simulate('click');
    assert.equal(container.all('li').size(), 2);
  });

  it('fires an addUnit event for scaled up services', function(done) {
    generateView().render();
    view.get('services').add({ id: 'foo' });
    container.one('button.closed').simulate('click');
    var input = container.one('li input[type=text]');
    input.set('value', 5);
    view.on('addUnit', function(e) {
      assert.equal(e.serviceName, 'foo');
      assert.equal(e.unitCount, 5);
      done();
    });
    container.one('button.add-units').simulate('click');
  });

  it('fires an event when the list is opened', function(done) {
    generateView().render();
    view.get('services').add({ id: 'foo' });
    view.on('listOpened', function(e) {
      assert.isObject(e);
      done();
    });
    container.one('button.closed').simulate('click');
  });

  it('fires an event when the list is closed', function(done) {
    generateView().render();
    view.get('services').add({ id: 'foo' });
    container.one('button.closed').simulate('click');
    view.on('listClosed', function(e) {
      assert.isObject(e);
      done();
    });
    container.one('button.opened').simulate('click');
  });

});
