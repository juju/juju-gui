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

  var Y, juju, utils, widget, Widget;

  before(function(done) {
    var requires = ['base', 'base-build', 'autodeploy-extension',
      'juju-tests-utils'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          juju = Y.namespace('juju');
          utils = Y.namespace('juju-tests.utils');
          done();
        });
  });

  beforeEach(function() {
    Widget = Y.Base.create(
        'autodeployer', Y.Base, [juju.widgets.AutodeployExtension], {});
    widget = new Widget();
    widget.set('db', {
      machines: {
        updateModelId: utils.makeStubFunction(),
        revive: utils.makeStubFunction({ set: utils.makeStubFunction() }),
        free: utils.makeStubFunction()
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
    db.units = {};
    var units = [
      {id: 'foo'},
      {id: 'bar'}
    ];
    var filterStub = utils.makeStubMethod(db.units, 'filterByMachine', units),
        createStub = utils.makeStubMethod(widget, '_createMachine', {id: id}),
        placeStub = utils.makeStubMethod(env, 'placeUnit');
    widget._autoPlaceUnits();
    assert.equal(filterStub.called(), true,
                 'did not query DB for unplaced units');
    assert.equal(createStub.callCount(), units.length,
                 'did not create a machine for each unit');
    assert.equal(placeStub.callCount(), units.length,
                 'did not place each unit');
    var allArgs = placeStub.allArguments();
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
    var ghostStub = utils.makeStubMethod(db.machines, 'addGhost', {id: '0'});
    utils.makeStubMethod(env, 'addMachines');
    widget._createMachine();
    assert.equal(ghostStub.calledOnce(), true, 'ghost not added');
  });

  it('adds each new machine to the environment', function() {
    var db = widget.get('db'),
        env = widget.get('env'),
        id = '0';
    utils.makeStubMethod(db.machines, 'addGhost', {id: id});
    var addStub = utils.makeStubMethod(env, 'addMachines');
    widget._createMachine();
    assert.equal(addStub.calledOnce(), true,
                 'machine not added');
    assert.deepEqual(addStub.lastArguments()[2], {modelId: id},
                     'incorrect machine ID');
  });

  it('handles response errors when creating new machines', function() {
    var db = widget.get('db'),
        message = 'test error';
    var response = {
      err: message,
      machines: [{name: 'test'}]
    };
    db.notifications = {};
    var notifyStub = utils.makeStubMethod(db.notifications, 'add'),
        removeStub = utils.makeStubMethod(db.machines, 'remove');
    widget._onMachineCreated({}, response);
    assert.equal(notifyStub.calledOnce(), true,
                 'error notification not added to the DB');
    var notification = notifyStub.lastArguments()[0];
    assert.equal(notification.title, 'Error creating the new machine',
                 'unexpected error title');
    assert.equal(notification.message.indexOf(message) > 0, true,
                 'unexpected error message');
    assert.equal(removeStub.calledOnce(), true,
                 'did not remove machine');
  });

  it('handles machine errors when creating new machines', function() {
    var db = widget.get('db'),
        message = 'test error';
    var response = {
      machines: [{name: 'test', err: message}]
    };
    db.notifications = {};
    var notifyStub = utils.makeStubMethod(db.notifications, 'add'),
        removeStub = utils.makeStubMethod(db.machines, 'remove');
    widget._onMachineCreated({}, response);
    assert.equal(notifyStub.calledOnce(), true,
                 'error notification not added to the DB');
    var notification = notifyStub.lastArguments()[0];
    assert.equal(notification.title.indexOf('Error creating machine') === 0,
                 true, 'unexpected error title');
    assert.equal(notification.message.indexOf(message) > 0, true,
                 'unexpected error message');
    assert.equal(removeStub.calledOnce(), true,
                 'did not remove machine');
  });
});
