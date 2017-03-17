/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('MachineViewMachineUnit', function() {
  var acl, service, unit;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('machine-view-machine-unit', function() { done(); });
  });

  beforeEach(function () {
    acl = {isReadOnly: sinon.stub().returns(false)};
    service = {
      get: function(val) {
        switch (val) {
          case 'icon':
            return 'icon.svg';
            break;
          case 'fade':
            return false;
            break;
          case 'hide':
            return false;
            break;
        }
      }
    };
    unit = {
      agent_state: 'started',
      displayName: 'django/7'
    };
  });

  it('can render a machine', function() {
    var removeUnit = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <juju.components.MachineViewMachineUnit.DecoratedComponent
        acl={acl}
        canDrag={false}
        connectDragSource={jsTestUtils.connectDragSource}
        isDragging={false}
        machineType="machine"
        removeUnit={removeUnit}
        service={service}
        unit={unit} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <li className={'machine-view__machine-unit ' +
        'machine-view__machine-unit--started'}>
        <span className="machine-view__machine-unit-icon">
          <img
            alt="django/7"
            className="machine-view__machine-unit-icon-img"
            src="icon.svg"
            title="django/7" />
        </span>
        {undefined}
        {undefined}
      </li>);
    assert.deepEqual(output, expected);
  });

  it('can render a container', function() {
    var removeUnit = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewMachineUnit.DecoratedComponent
        acl={acl}
        canDrag={false}
        connectDragSource={jsTestUtils.connectDragSource}
        isDragging={false}
        machineType="container"
        removeUnit={removeUnit}
        service={service}
        unit={unit} />);
    var expected = (
      <li className={'machine-view__machine-unit ' +
        'machine-view__machine-unit--started'}>
        <span className="machine-view__machine-unit-icon">
          <img
            alt="django/7"
            className="machine-view__machine-unit-icon-img"
            src="icon.svg"
            title="django/7" />
        </span>
        {'django/7'}
        <juju.components.MoreMenu
          items={[{
            label: 'Destroy',
            action: output.props.children[2].props.items[0].action
          }]} />
      </li>);
    assert.deepEqual(output, expected);
  });

  it('can disable the destroy when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var removeUnit = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewMachineUnit.DecoratedComponent
        acl={acl}
        canDrag={false}
        connectDragSource={jsTestUtils.connectDragSource}
        isDragging={false}
        machineType="container"
        removeUnit={removeUnit}
        service={service}
        unit={unit} />);
    var expected = (
      <juju.components.MoreMenu
        items={[{
          label: 'Destroy',
          action: false
        }]} />);
    assert.deepEqual(output.props.children[2], expected);
  });

  it('can display in dragged mode', function() {
    var removeUnit = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewMachineUnit.DecoratedComponent
        acl={acl}
        canDrag={false}
        connectDragSource={jsTestUtils.connectDragSource}
        isDragging={true}
        machineType="container"
        removeUnit={removeUnit}
        service={service}
        unit={unit} />);
    var expected = (
      <li className={'machine-view__machine-unit ' +
        'machine-view__machine-unit--dragged ' +
        'machine-view__machine-unit--started'}>
        {output.props.children}
      </li>);
    assert.deepEqual(output, expected);
  });

  it('can display as uncommitted', function() {
    unit.deleted = true;
    var removeUnit = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewMachineUnit.DecoratedComponent
        acl={acl}
        canDrag={false}
        connectDragSource={jsTestUtils.connectDragSource}
        isDragging={false}
        machineType="container"
        removeUnit={removeUnit}
        service={service}
        unit={unit} />);
    var expected = (
      <li className={'machine-view__machine-unit ' +
        'machine-view__machine-unit--uncommitted'}>
        {output.props.children}
      </li>);
    assert.deepEqual(output, expected);
  });

  it('can display in draggable mode', function() {
    var removeUnit = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewMachineUnit.DecoratedComponent
        acl={acl}
        connectDragSource={jsTestUtils.connectDragSource}
        canDrag={true}
        isDragging={false}
        machineType="container"
        removeUnit={removeUnit}
        service={service}
        unit={unit} />);
    var expected = (
      <li className={'machine-view__machine-unit ' +
        'machine-view__machine-unit--draggable ' +
        'machine-view__machine-unit--started'}>
        {output.props.children}
      </li>);
    assert.deepEqual(output, expected);
  });

  it('can remove a unit', function() {
    var removeUnit = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.MachineViewMachineUnit.DecoratedComponent
        acl={acl}
        canDrag={false}
        connectDragSource={jsTestUtils.connectDragSource}
        isDragging={false}
        machineType="container"
        removeUnit={removeUnit}
        service={service}
        unit={unit} />);
    output.props.children[2].props.items[0].action();
    assert.equal(removeUnit.callCount, 1);
  });
});
