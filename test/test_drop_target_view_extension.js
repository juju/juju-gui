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

describe('Drop target view extension', function() {

  var Y, juju, utils, view, View;

  before(function(done) {
    var requires = ['base', 'base-build', 'event', 'drop-target-view-extension',
      'juju-tests-utils'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          juju = Y.namespace('juju');
          utils = Y.namespace('juju-tests.utils');
          done();
        });
  });

  beforeEach(function() {
    View = Y.Base.create(
        'deployer', Y.Base, [juju.views.DropTargetViewExtension], {});
    view = new View();
  });

  afterEach(function() {
    view.destroy();
  });

  it('attaches the drag events to the container', function() {
    view.set('container', {
      delegate: utils.makeStubFunction()
    });
    view._attachDragEvents();
    var delegate = view.get('container').delegate;
    assert.equal(delegate.callCount(), 3);
    var delArgs = delegate.allArguments();
    assert.equal(delArgs[0][0], 'drop');
    assert.deepEqual(delArgs[0][1], view._unitDropHandler);
    assert.equal(delArgs[0][2], '.token');
    assert.equal(delArgs[1][0], 'dragenter');
    assert.deepEqual(delArgs[1][1], view._ignore);
    assert.equal(delArgs[1][2], '.token');
    assert.equal(delArgs[2][0], 'dragover');
    assert.deepEqual(delArgs[2][1], view._ignore);
    assert.equal(delArgs[2][2], '.token');
  });

  it('fires unit-token-drop in its drop handler', function() {
    var eventData = {
      _event: {
        dataTransfer: {
          getData: utils.makeStubFunction('{"id":"foo"}')
        }}};
    var fireStub = utils.makeStubMethod(view, 'fire');
    this._cleanups.push(fireStub.reset);
    view.set('machine', 'machineObj');
    view._unitDropHandler(eventData);
    assert.equal(fireStub.calledOnce(), true);
    assert.equal(fireStub.lastArguments()[0], 'unit-token-drop');
    assert.deepEqual(fireStub.lastArguments()[1], {
      unit: 'foo',
      machine: 'machineObj'
    });
  });

});
