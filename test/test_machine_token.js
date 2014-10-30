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
  var container, machine, utils, views, Y;
  var requirements = [
    'event-simulate',
    'juju-models',
    'juju-tests-utils',
    'juju-views',
    'machine-token',
    'node-event-simulate',
    'node'
  ];

  before(function(done) {
    Y = YUI(GlobalConfig).use(requirements, function(Y) {
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'machine-token');
    machine = {
      id: '0',
      hardware: {
        disk: 1024,
        mem: 1024,
        cpuPower: 1024,
        cpuCores: 1
      },
      units: []
    };
  });

  afterEach(function() {
    container.remove(true);
  });

  // Create and return a machine token view with the given machine.
  var makeView = function(test, machine) {
    var view = new views.MachineToken({
      container: container,
      machine: machine
    }).render();
    test._cleanups.push(function() {
      view.destroy();
    });
    return view;
  };

  it('should apply the wrapping class to the container', function() {
    makeView(this, machine);
    assert.equal(container.hasClass('machine-token'), true);
  });

  it('should set the id on the container', function() {
    makeView(this, machine);
    assert.equal(container.one('.token').getData('id'), '0');
  });

  it('fires the delete event', function(done) {
    var view = makeView(this, machine);
    view.on('deleteToken', function(e) {
      assert.isObject(e);
      assert.equal(e.machineId, machine.id);
      done();
    });
    view.showMoreMenu();
    container.one('.moreMenuItem-0').simulate('click');
  });

  it('fires the select event', function(done) {
    var view = makeView(this, machine);
    view.on('selectToken', function(e) {
      assert.isObject(e);
      done();
    });
    container.one('.token').simulate('click');
  });

  it('does not update the hardware object when formatting', function() {
    var view = makeView(this, machine);
    assert.notEqual(view.get('machine').hardware,
        view.get('machine').formattedHardware);
  });

  it('handles non-number values for hardware when formatting', function() {
    var machine = {id: '0', hardware: {}, units: []};
    var view = makeView(this, machine);
    var hardware = view.get('machine').formattedHardware;
    assert.equal(hardware.disk, null,
                 'Non-number disk should be formatted to null');
    assert.equal(hardware.cpuPower, null,
                 'Non-number CPU should be formatted to null');
    assert.equal(hardware.mem, null,
                 'Non-number memory should be formatted to null');

  });

  it('display a message when no hardware is available', function() {
    var machine = {id: '0', hardware: {}, units: []};
    var view = makeView(this, machine);
    assert.equal(view.get('container').one('.details').get('text').trim(),
                 'Hardware details not available');
  });

  it('shows when a machine is a state server', function() {
    var machine = {id: '0', displayName: '0', isStateServer: true, units: []};
    var view = makeView(this, machine);
    var title = view.get('container').one('.title').get('text');
    assert.include(title, '0 - State service');
  });

  it('shows when a machine is not a state server', function() {
    var machine = {id: '0', isStateServer: false, units: []};
    var view = makeView(this, machine);
    var title = view.get('container').one('.title').get('text');
    assert.notInclude(title, '- State service');
  });

  it('gets one icon for each service deployed on it', function() {
    // We don't need full serviceunits for the test, just enough to show the
    // rendering.
    machine.units = [
      {icon: 'foo/icon.svg', serviceName: 'mongo'},
      {icon: 'bar/icon.svg', serviceName: 'wordpress'}
    ];
    makeView(this, machine);
    var service_icons = container.one('.service-icons');
    assert.isObject(service_icons);
    assert.equal(2, service_icons.all('img').size());
  });

  it('hides the machine if the flag is set', function() {
    machine.hide = true;
    makeView(this, machine);
    assert.equal(container.hasClass('hidden'), true);
  });

  it('shows the machine if not all units are hidden', function() {
    machine.units = [
      {hide: true, serviceName: 'mongo'},
      {hide: false, serviceName: 'django'}
    ];
    makeView(this, machine);
    assert.strictEqual(container.hasClass('hidden'), false);
  });

  it('shows the machine if it does not host any units', function() {
    machine.units = [];
    makeView(this, machine);
    assert.strictEqual(container.hasClass('hidden'), false);
  });

  it('can be set to the droppable state', function() {
    var view = makeView(this, machine);
    view.setDroppable();
    assert.equal(container.hasClass('droppable'), true);
  });

  it('can be set from the droppable state back to the default', function() {
    var view = makeView(this, machine);
    view.setDroppable();
    assert.equal(container.hasClass('droppable'), true);
    view.setNotDroppable();
    assert.equal(container.hasClass('droppable'), false);
  });

  it('can display the more menu', function() {
    var view = makeView(this, machine);
    assert.equal(container.one('.yui3-moremenu'), null);
    view.showMoreMenu();
    assert.equal(container.one('.yui3-moremenu') !== null, true);
  });

  it('disables destroy in the more menu for deleted machines', function() {
    machine.deleted = true;
    var view = makeView(this, machine);
    var stubDisable = utils.makeStubMethod(view._moreMenu, 'setItemDisabled');
    this._cleanups.push(stubDisable);
    view.showMoreMenu();
    assert.equal(stubDisable.calledOnce(), true);
    assert.deepEqual(stubDisable.lastArguments(), ['Destroy', true]);
  });

  it('can show the constraints', function() {
    var view = makeView(this, machine);
    var detailsNode = container.one('.details');
    assert.equal(detailsNode.hasClass('hidden'), true);
    view.showConstraints();
    assert.equal(detailsNode.hasClass('hidden'), false);
  });

  it('can hide the constraints', function() {
    var view = makeView(this, machine);
    var detailsNode = container.one('.details');
    view.showConstraints();
    assert.equal(detailsNode.hasClass('hidden'), false);
    view.hideConstraints();
    assert.equal(detailsNode.hasClass('hidden'), true);
  });
});
