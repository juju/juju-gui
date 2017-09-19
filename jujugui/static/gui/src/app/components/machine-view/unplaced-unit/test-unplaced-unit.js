/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const shapeup = require('shapeup');

const MachineViewUnplacedUnit = require('./unplaced-unit');
const MoreMenu = require('../../more-menu/more-menu');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('MachineViewUnplacedUnit', function() {
  let acl;

  beforeEach(() => {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => false}));
  });

  it('can render', function() {
    const removeUnit = sinon.stub();
    const unit = {displayName: 'django/7'};
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewUnplacedUnit.DecoratedComponent
        acl={acl}
        connectDragSource={jsTestUtils.connectDragSource}
        dbAPI={{
          machines: {}
        }}
        isDragging={false}
        modelAPI={{
          createMachine: sinon.stub(),
          placeUnit: sinon.stub()
        }}
        unitAPI={{
          icon: 'icon.svg',
          removeUnit: removeUnit,
          selectMachine: sinon.stub(),
          unit: unit
        }}
      />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <li className="machine-view__unplaced-unit">
        <img src="icon.svg" alt="django/7"
          className="machine-view__unplaced-unit-icon" />
        django/7
        <MoreMenu
          items={[{
            label: 'Deploy to...',
            action: instance._togglePlaceUnit
          }, {
            label: 'Destroy',
            action: output.props.children[2].props.items[1].action
          }]} />
        {undefined}
        <div className="machine-view__unplaced-unit-drag-state"></div>
      </li>);
    expect(output).toEqualJSX(expected);
  });

  it('can display in dragged mode', function() {
    const removeUnit = sinon.stub();
    const unit = {displayName: 'django/7'};
    const output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewUnplacedUnit.DecoratedComponent
        acl={acl}
        connectDragSource={jsTestUtils.connectDragSource}
        dbAPI={{
          machines: {}
        }}
        isDragging={true}
        modelAPI={{
          createMachine: sinon.stub(),
          placeUnit: sinon.stub()
        }}
        unitAPI={{
          icon: 'icon.svg',
          removeUnit: removeUnit,
          selectMachine: sinon.stub(),
          unit: unit
        }}
      />);
    const expected = (
      <li className={'machine-view__unplaced-unit ' +
        'machine-view__unplaced-unit--dragged'}>
        {output.props.children}
      </li>);
    expect(output).toEqualJSX(expected);
  });

  it('can remove a unit', function() {
    const removeUnit = sinon.stub();
    const unit = {displayName: 'django/7', id: 'django/7'};
    const output = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewUnplacedUnit.DecoratedComponent
        acl={acl}
        connectDragSource={jsTestUtils.connectDragSource}
        dbAPI={{
          machines: {}
        }}
        isDragging={false}
        modelAPI={{
          createMachine: sinon.stub(),
          placeUnit: sinon.stub()
        }}
        unitAPI={{
          icon: 'icon.svg',
          removeUnit: removeUnit,
          selectMachine: sinon.stub(),
          unit: unit
        }}
      />);
    output.props.children[2].props.items[1].action();
    assert.equal(removeUnit.callCount, 1);
    assert.equal(removeUnit.args[0][0], 'django/7');
  });

  it('disables the menu items when read only', function() {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => true}));
    const removeUnit = sinon.stub();
    const unit = {displayName: 'django/7'};
    const renderer = jsTestUtils.shallowRender(
      // The component is wrapped to handle drag and drop, but we just want to
      // test the internal component so we access it via DecoratedComponent.
      <MachineViewUnplacedUnit.DecoratedComponent
        acl={acl}
        connectDragSource={jsTestUtils.connectDragSource}
        dbAPI={{
          machines: {}
        }}
        isDragging={false}
        modelAPI={{
          createMachine: sinon.stub(),
          placeUnit: sinon.stub()
        }}
        unitAPI={{
          icon: 'icon.svg',
          removeUnit: removeUnit,
          selectMachine: sinon.stub(),
          unit: unit
        }}
      />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <MoreMenu
        items={[{
          label: 'Deploy to...',
          action: false
        }, {
          label: 'Destroy',
          action: false
        }]} />);
    expect(output.props.children[2]).toEqualJSX(expected);
  });
});
