/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const shapeup = require('shapeup');

const MachineUnit = require('../../shared/machine-unit/machine-unit');
const MachineViewMachineUnit = require('./machine-unit');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('MachineViewMachineUnit', function() {
  let acl, unit;

  const renderComponent = (options = {}) => enzyme.shallow(
    // The component is wrapped to handle drag and drop, but we just want to
    // test the internal component so we access it via DecoratedComponent.
    <MachineViewMachineUnit.DecoratedComponent
      acl={options.acl || acl}
      canDrag={options.canDrag === undefined ? false : options.canDrag}
      connectDragSource={jsTestUtils.connectDragSource}
      icon={options.icon || 'icon.svg'}
      isDragging={options.isDragging === undefined ? false : options.isDragging}
      machineType={options.machineType || 'machine'}
      removeUnit={options.removeUnit || sinon.stub()}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      unit={options.unit || unit} />
  );

  beforeEach(function() {
    acl = shapeup.deepFreeze({isReadOnly: () => false});
    unit = {
      agent_state: 'started',
      displayName: 'django/7'
    };
  });

  it('can render for a machine', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="machine-view__machine-unit">
        <MachineUnit
          icon="icon.svg"
          menuItems={undefined}
          name="django/7"
          status="started" />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render for a container', function() {
    const wrapper = renderComponent({machineType: 'container'});
    const menuItems = wrapper.find('MachineUnit').prop('menuItems');
    assert.deepEqual(menuItems, [{
      label: 'Destroy',
      action: menuItems[0].action
    }]);
  });

  it('can disable the destroy when read only', function() {
    acl = shapeup.deepFreeze({isReadOnly: () => true});
    const wrapper = renderComponent({machineType: 'container'});
    assert.strictEqual(
      wrapper.find('MachineUnit').prop('menuItems')[0].action, null);
  });

  it('can display in dragged mode', function() {
    const wrapper = renderComponent({isDragging: true});
    assert.equal(
      wrapper.prop('className').includes('machine-view__machine-unit--dragged'),
      true);
  });

  it('can display in draggable mode', function() {
    const wrapper = renderComponent({canDrag: true});
    assert.equal(
      wrapper.prop('className').includes('machine-view__machine-unit--draggable'),
      true);
  });

  it('can remove a unit', function() {
    const removeUnit = sinon.stub();
    const wrapper = renderComponent({
      machineType: 'container',
      removeUnit
    });
    wrapper.find('MachineUnit').prop('menuItems')[0].action();
    assert.equal(removeUnit.callCount, 1);
  });
});
