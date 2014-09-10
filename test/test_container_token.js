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


describe('container token view', function() {
  var Y, container, machine, models, utils, views, view, View;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['container-token',
                               'juju-models',
                               'juju-views',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {

      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      View = views.ContainerToken;
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'container-token');
    machine = {
      displayDelete: true,
      title: 'test title',
      units: [{id: 'test/1'}]
    };
    view = new View({
      containerParent: container,
      container: utils.makeContainer(this, 'container'),
      machine: machine
    }).render();
  });

  afterEach(function() {
    view.destroy();
    container.remove(true);
  });

  it('should apply the wrapping class to the container', function() {
    assert.equal(view.get('container').hasClass('container-token'), true);
  });

  it('does not have a delete button if it is not supposed to', function() {
    container = utils.makeContainer(this, 'container-token');
    machine.displayDelete = false;
    view = new View({
      containerParent: container,
      container: utils.makeContainer(this, 'container'),
      machine: machine
    }).render();
    assert.equal(container.one('.delete'), null);
  });

  it('fires the delete event', function(done) {
    view.on('deleteToken', function(e) {
      assert.isObject(e);
      done();
    });
    view.showMoreMenu();
    container.one('.moreMenuItem-0').simulate('click');
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

  it('mixes in the DropTargetViewExtension', function() {
    assert.equal(typeof view._attachDragEvents, 'function');
  });

  it('attaches the drag events on init', function() {
    var attachDragStub = utils.makeStubMethod(view, '_attachDragEvents');
    this._cleanups.push(attachDragStub.reset);
    view.init();
    assert.equal(attachDragStub.calledOnce(), true);
  });

  it('can be set to the droppable state', function() {
    view.setDroppable();
    assert.equal(view.get('container').hasClass('droppable'), true);
  });

  it('can be set from the droppable state back to the default', function() {
    var viewContainer = view.get('container');
    view.setDroppable();
    assert.equal(viewContainer.hasClass('droppable'), true);
    view.setNotDroppable();
    assert.equal(viewContainer.hasClass('droppable'), false);
  });

  it('can display the more menu', function() {
    assert.equal(container.one('.yui3-moremenu'), null);
    view.showMoreMenu();
    assert.equal(container.one('.yui3-moremenu') !== null, true);
  });

  it('disables destroy in the more menu for deleted machines', function() {
    machine.deleted = true;
    var stubDisable = utils.makeStubMethod(view._moreMenu, 'setItemDisabled');
    this._cleanups.push(stubDisable);
    view.showMoreMenu();
    assert.equal(stubDisable.calledOnce(), true);
    assert.deepEqual(stubDisable.lastArguments(), ['Destroy', true]);
  });

  it('can display the more menu for units', function() {
    assert.equal(container.one('.unit .yui3-moremenu'), null);
    view.showUnitMoreMenu({halt: utils.makeStubFunction()}, 'test/1');
    assert.equal(container.one('.unit .yui3-moremenu') !== null, true);
  });

  it('can set a class on deleted commited units', function() {
    assert.equal(container.one('.unit').hasClass('deleted'), false);
    view.setUnitDeleted({id: 'test/1', agent_state: 'started'});
    assert.equal(container.one('.unit').hasClass('deleted'), true);
  });

  it('can removed deleted uncommited units', function() {
    assert.equal(container.one('.unit') !== null, true);
    view.setUnitDeleted({id: 'test/1'});
    assert.equal(container.one('.unit'), null);
  });
});
