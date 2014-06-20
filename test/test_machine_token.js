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


describe('machine token view', function() {
  var Y, container, machine, models, utils, views, view, View;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['machine-token',
                               'juju-models',
                               'juju-views',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {

      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      View = views.MachineToken;
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'machine-token');
    machine = {
      id: 0,
      hardware: {
        disk: 1024,
        mem: 1024,
        cpuPower: 1024,
        cpuCores: 1
      }
    };
    view = new View({
      container: container,
      machine: machine
    }).render();
  });

  afterEach(function() {
    view.destroy();
    container.remove(true);
  });

  it('should apply the wrapping class to the container', function() {
    assert.equal(container.hasClass('machine-token'), true);
  });

  it('should set the id on the container', function() {
    assert.equal(container.one('.token').getData('id'), '0');
  });

  it('fires the delete event', function(done) {
    view.on('deleteToken', function(e) {
      assert.isObject(e);
      done();
    });
    container.one('.delete').simulate('click');
  });

  it('fires the select event', function(done) {
    view.on('selectToken', function(e) {
      assert.isObject(e);
      done();
    });
    container.one('.token').simulate('click');
  });

  it('does not update the hardware object when formatting', function() {
    assert.notEqual(view.get('machine').hardware,
        view.get('machine').formattedHardware);
  });

  it('can be marked as uncommitted', function() {
    view.setUncommitted();
    assert.equal(view.get('container').one('.token').hasClass('uncommitted'),
        true);
    assert.equal(view.get('committed'), false);
  });

  it('can be marked as committed', function() {
    view.setUncommitted();
    assert.equal(view.get('container').one('.token').hasClass('uncommitted'),
        true);
    assert.equal(view.get('committed'), false);
    view.setCommitted();
    assert.equal(view.get('container').one('.token').hasClass('uncommitted'),
        false);
    assert.equal(view.get('committed'), true);
  });

  it('handles non-number values for hardware when formatting', function() {
    var machine = {
      id: 0,
      hardware: {}
    };
    var view = new View({
      container: container,
      machine: machine
    }).render();
    var hardware = view.get('machine').formattedHardware;
    assert.equal(hardware.disk, null,
                 'Non-number disk should be formatted to null');
    assert.equal(hardware.cpuPower, null,
                 'Non-number CPU should be formatted to null');
    assert.equal(hardware.mem, null,
                 'Non-number memory should be formatted to null');

  });

  it('display a message when no hardware is available', function() {
    var machine = {
      id: 0,
      hardware: {}
    };
    var view = new View({
      container: container,
      machine: machine
    }).render();
    assert.equal(view.get('container').one('.details').get('text').trim(),
                 'Hardware details not available');
  });

  it('gets one icon for each service deployed on it', function() {
    // We don't need full serviceunits for the test, just enough to show the
    // rendering.
    machine.units = [
      {icon: 'foo/icon.svg', serviceName: 'mongo'},
      {icon: 'bar/icon.svg', serviceName: 'wordpress'}
    ];
    view = new View({
      container: container,
      machine: machine
    }).render();
    var service_icons = container.one('.service-icons');
    assert.isObject(service_icons);
    assert.equal(2, service_icons.all('img').size());
  });

  it('can be set to the droppable state', function() {
    view.setDroppable();
    assert.equal(container.hasClass('droppable'), true);
  });

  it('can be set from the droppable state back to the default', function() {
    view.setDroppable();
    assert.equal(container.hasClass('droppable'), true);
    view.setNotDroppable();
    assert.equal(container.hasClass('droppable'), false);
  });
});
