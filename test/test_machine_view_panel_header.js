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


describe('machine view panel header view', function() {
  var Y, container, utils, views, view, View;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['machine-view-panel-header',
                               'juju-views',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {

      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      View = views.MachineViewPanelHeaderView;
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'machine-view-panel-header');
    view = new View({
      container: container,
      title: 'test title',
      dropLabel: 'test drop label',
      action: 'test action',
      actionLabel: 'test action label'
    }).render();
  });

  afterEach(function() {
    container.remove(true);
    view.destroy();
  });

  it('should apply the wrapping class to the container', function() {
    assert.equal(container.hasClass('machine-view-panel-header'), true);
  });

  it('should have the correct attributes set', function() {
    assert.equal(container.one('.title').get('text'), 'test title');
    assert.equal(container.one('.action').get('text'), 'test action label');
    assert.equal(container.one('.drop span').get('text'), 'test drop label');
  });

  it('can set the label', function() {
    view.set('labels', [{label: 'label', count: 0}]);
    assert.equal(container.one('.label').get('text').trim(), '0 labels');
    view.set('labels', [{label: 'label', count: 1}]);
    assert.equal(container.one('.label').get('text').trim(), '1 label');
  });

  it('can increment a label', function() {
    view.set('labels', [{label: 'test', count: 0}]);
    assert.equal(container.one('.label').get('text').trim(), '0 tests');
    view.updateLabelCount('test', 1);
    assert.equal(container.one('.label').get('text').trim(), '1 test');
    view.updateLabelCount('test', 1);
    assert.equal(container.one('.label').get('text').trim(), '2 tests');
  });

  it('can decrement a label', function() {
    view.set('labels', [{label: 'test', count: 2}]);
    assert.equal(container.one('.label').get('text').trim(), '2 tests');
    view.updateLabelCount('test', -1);
    assert.equal(container.one('.label').get('text').trim(), '1 test');
    view.updateLabelCount('test', -1);
    assert.equal(container.one('.label').get('text').trim(), '0 tests');
  });

  it('fires an event on tab change', function(done) {
    view.on('actionFired', function(e) {
      assert.isObject(e);
      done();
    });
    container.one('.action').simulate('click');
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
