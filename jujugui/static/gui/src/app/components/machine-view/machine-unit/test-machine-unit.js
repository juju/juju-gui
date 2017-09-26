/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const shapeup = require('shapeup');

const MachineViewMachineUnit = require('./machine-unit');
const MoreMenu = require('../../more-menu/more-menu');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('MachineViewMachineUnit', function() {
  let acl, service, unit;

  beforeEach(function () {
    acl = shapeup.deepFreeze({isReadOnly: () => false});
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
    const removeUnit = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewMachineUnit.DecoratedComponent
        acl={acl}
        canDrag={false}
        connectDragSource={jsTestUtils.connectDragSource}
        isDragging={false}
        machineType="machine"
        removeUnit={removeUnit}
        service={service}
        unit={unit} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
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
    const removeUnit = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <MachineViewMachineUnit.DecoratedComponent
        acl={acl}
        canDrag={false}
        connectDragSource={jsTestUtils.connectDragSource}
        isDragging={false}
        machineType="container"
        removeUnit={removeUnit}
        service={service}
        unit={unit} />);
    const expected = (
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
        <MoreMenu
          items={[{
            label: 'Destroy',
            action: output.props.children[2].props.items[0].action
          }]} />
      </li>);
    assert.deepEqual(output, expected);
  });

  it('can disable the destroy when read only', function() {
    acl = shapeup.deepFreeze({isReadOnly: () => true});
    const removeUnit = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <MachineViewMachineUnit.DecoratedComponent
        acl={acl}
        canDrag={false}
        connectDragSource={jsTestUtils.connectDragSource}
        isDragging={false}
        machineType="container"
        removeUnit={removeUnit}
        service={service}
        unit={unit} />);
    const expected = (
      <MoreMenu
        items={[{
          label: 'Destroy',
          action: false
        }]} />);
    assert.deepEqual(output.props.children[2], expected);
  });

  it('can display in dragged mode', function() {
    const removeUnit = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <MachineViewMachineUnit.DecoratedComponent
        acl={acl}
        canDrag={false}
        connectDragSource={jsTestUtils.connectDragSource}
        isDragging={true}
        machineType="container"
        removeUnit={removeUnit}
        service={service}
        unit={unit} />);
    const expected = (
      <li className={'machine-view__machine-unit ' +
        'machine-view__machine-unit--dragged ' +
        'machine-view__machine-unit--started'}>
        {output.props.children}
      </li>);
    assert.deepEqual(output, expected);
  });

  it('can display as uncommitted', function() {
    unit.deleted = true;
    const removeUnit = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <MachineViewMachineUnit.DecoratedComponent
        acl={acl}
        canDrag={false}
        connectDragSource={jsTestUtils.connectDragSource}
        isDragging={false}
        machineType="container"
        removeUnit={removeUnit}
        service={service}
        unit={unit} />);
    const expected = (
      <li className={'machine-view__machine-unit ' +
        'machine-view__machine-unit--uncommitted'}>
        {output.props.children}
      </li>);
    assert.deepEqual(output, expected);
  });

  it('can display in draggable mode', function() {
    const removeUnit = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <MachineViewMachineUnit.DecoratedComponent
        acl={acl}
        connectDragSource={jsTestUtils.connectDragSource}
        canDrag={true}
        isDragging={false}
        machineType="container"
        removeUnit={removeUnit}
        service={service}
        unit={unit} />);
    const expected = (
      <li className={'machine-view__machine-unit ' +
        'machine-view__machine-unit--draggable ' +
        'machine-view__machine-unit--started'}>
        {output.props.children}
      </li>);
    assert.deepEqual(output, expected);
  });

  it('can remove a unit', function() {
    const removeUnit = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <MachineViewMachineUnit.DecoratedComponent
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
