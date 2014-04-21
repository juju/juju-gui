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

describe('Service unit token', function() {
  var container, utils, models, views, view, id, title, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-serviceunit-token',
                               'juju-tests-utils',
                               'node-event-simulate'], function(Y) {
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
      utils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'container');
    id = 'test/0';
    title = 'test';
    view = new views.ServiceUnitToken({
      container: container,
      id: 'test/0',
      title: 'test'
    }).render();
  });

  afterEach(function() {
    view.destroy();
  });

  it('renders to initial, undeployed state', function() {
    var selector = '.unit[data-id="' + id + '"]';
    assert.notEqual(container.one(selector), null,
                    'DOM element not found');
    assert.equal(container.one(selector + ' .title').get('text').trim(),
                 title, 'display names do not match');
  });

  it('walks through machine and container selections', function() {
    // Make sure initally shows name and move icon
    var name = container.one('.title'),
        icons = container.one('.icons');
    assert.notEqual(name.getStyle('display'), 'none',
                    'name was not displayed');
    assert.notEqual(icons.getStyle('display'), 'none',
                    'icons were not displayed');

    // test initial move icon click
    assert.equal(container.one('.unit .machines').getStyle('display'),
                 'none', 'machine dropdown prematurely displayed');
    icons.one('.token-move').simulate('click');
    assert.notEqual(container.one('.unit .machines').getStyle('display'),
                    'none', 'machine dropdown not displayed');
    assert.equal(icons.getStyle('display'), 'none',
                 'icons were not hidden');

    // test selecting a machine in the list
    var containers = container.one('.unit .containers'),
        actions = container.one('.unit .actions'),
        machinesSelect = container.one('.unit .machines select');
    assert.equal(containers.getStyle('display'), 'none',
                 'container dropdown prematurely displayed');
    assert.equal(actions.getStyle('display'), 'none',
                 'container actions prematurely displayed');
    machinesSelect.set('selectedIndex', 1);
    machinesSelect.simulate('change');
    assert.notEqual(containers.getStyle('display'), 'none',
                    'container dropdown not displayed');
    assert.equal(actions.getStyle('display'), 'block',
                 'container actions not displayed');

    // test the final click on the move button
    actions.one('.move').simulate('click');
    assert.notEqual(name.getStyle('display'), 'none',
                    'name was not displayed in final state');
    assert.notEqual(icons.getStyle('display'), 'none',
                    'icons were not displayed in final state');
  });
});
