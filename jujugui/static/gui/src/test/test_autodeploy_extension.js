/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2013 Canonical Ltd.

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

describe('Autodeploy Extension', function() {

  var Y, juju, reviveStub, setAttrsStub, widget, Widget;

  before(function(done) {
    var requires = ['base', 'base-build', 'autodeploy-extension'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
      juju = Y.namespace('juju');
      done();
    });
  });

  beforeEach(function() {
    Widget = Y.Base.create(
        'autodeployer', Y.Base, [juju.widgets.AutodeployExtension], {});
    widget = new Widget();
    setAttrsStub = sinon.stub();
    reviveStub = sinon.stub().returns({
      set: sinon.stub(),
      setAttrs: setAttrsStub
    });
    widget.set('db', {
      fire: sinon.stub(),
      machines: {
        updateModelId: sinon.stub(),
        revive: reviveStub,
        free: sinon.stub(),
        _createMachine: sinon.stub()
      },
      services: {
        getById: function() {
          return {
            get: function() { return 'xenial'; }
          };
        }
      }
    });
    widget.set('env', {});
  });

  afterEach(function() {
    widget.destroy();
  });

  it('assigns each unplaced unit to a new machine', function() {
    var db = widget.get('db'),
        env = widget.get('env'),
        id = '0';
    var units = [
      {id: 'foo'},
      {id: 'bar'}
    ];
    var filterStub = sinon.stub().returns(units),
        createStub = sinon.stub(widget, '_createMachine').returns({id: id}),
        placeStub = sinon.stub();
    env.placeUnit = placeStub;
    db.units = {
      filterByMachine: filterStub
    };
    widget._autoPlaceUnits();
    assert.equal(filterStub.called, true,
                 'did not query DB for unplaced units');
    assert.equal(createStub.callCount, units.length,
                 'did not create a machine for each unit');
    assert.deepEqual(createStub.lastCall.args, [null, null, 'xenial', null]);
    assert.equal(placeStub.callCount, units.length,
                 'did not place each unit');
    var allArgs = placeStub.args;
    units.forEach(function(expectedUnit, index) {
      var actualUnit = allArgs[index][0],
          actualId = allArgs[index][1];
      assert.equal(expectedUnit, actualUnit, 'expected unit not placed');
      assert.equal(id, actualId, 'unit placed on the wrong machine id');
    });
  });

  it('creates a ghost for every new machine', function() {
    var db = widget.get('db'),
        env = widget.get('env');
    var ghostStub = sinon.stub().returns({id: '0'});
    db.machines.addGhost = ghostStub;
    env.addMachines = sinon.stub();
    widget._createMachine();
    assert.equal(ghostStub.calledOnce, true, 'ghost not added');
  });

  it('adds each new machine to the environment', function() {
    var db = widget.get('db'),
        env = widget.get('env'),
        id = '0';
    var ghostStub = sinon.stub().returns({id: id});
    db.machines.addGhost = ghostStub;
    var addStub = sinon.stub();
    env.addMachines = addStub;
    widget._createMachine();
    assert.equal(addStub.calledOnce, true,
                 'machine not added');
    assert.deepEqual(addStub.lastCall.args[2], {modelId: id},
                     'incorrect machine ID');
  });

  it('handles response errors when creating new machines', function() {
    var db = widget.get('db'),
        message = 'test error';
    var response = {
      err: message,
      machines: [{name: 'test'}]
    };
    var notifyStub = sinon.stub(),
        removeStub = sinon.stub();
    db.machines.remove = removeStub;
    db.notifications = {add: notifyStub};
    widget._onMachineCreated({}, response);
    assert.equal(notifyStub.calledOnce, true,
                 'error notification not added to the DB');
    var notification = notifyStub.lastCall.args[0];
    assert.equal(notification.title, 'Error creating the new machine',
                 'unexpected error title');
    assert.equal(notification.message.indexOf(message) > 0, true,
                 'unexpected error message');
    assert.equal(removeStub.calledOnce, true,
                 'did not remove machine');
  });

  it('handles machine errors when creating new machines', function() {
    var db = widget.get('db'),
        message = 'test error';
    var response = {
      machines: [{name: 'test', err: message}]
    };
    var notifyStub = sinon.stub(),
        removeStub = sinon.stub();
    db.machines.remove = removeStub;
    db.notifications = {add: notifyStub};
    widget._onMachineCreated({}, response);
    assert.equal(notifyStub.calledOnce, true,
                 'error notification not added to the DB');
    var notification = notifyStub.lastCall.args[0];
    assert.equal(notification.title.indexOf('Error creating machine') === 0,
                 true, 'unexpected error title');
    assert.equal(notification.message.indexOf(message) > 0, true,
                 'unexpected error message');
    assert.equal(removeStub.calledOnce, true,
                 'did not remove machine');
  });

  it('properly sets up the model when creating new machine', function() {
    var db = widget.get('db');
    var response = {
      machines: [{name: 'test/lxc/0'}]
    };
    widget._onMachineCreated({}, response);
    assert.equal(db.machines.updateModelId.callCount, 1);
    assert.deepEqual(
        db.machines.updateModelId.lastCall.args,
        [{}, 'test/lxc/0', true]);
    assert.equal(setAttrsStub.callCount, 1);
    assert.deepEqual(
      setAttrsStub.lastCall.args,
      [{
        displayName: 'test/lxc/0',
        parentId: 'test'
      }]);
  });
});
