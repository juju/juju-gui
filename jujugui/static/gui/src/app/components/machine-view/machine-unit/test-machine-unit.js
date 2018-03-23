/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const shapeup = require('shapeup');

const MachineViewMachineUnit = require('./machine-unit');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('MachineViewMachineUnit', function() {
  let acl, service, unit;

  const renderComponent = (options = {}) => enzyme.shallow(
    // The component is wrapped to handle drag and drop, but we just want to
    // test the internal component so we access it via DecoratedComponent.
    <MachineViewMachineUnit.DecoratedComponent
      acl={options.acl || acl}
      canDrag={options.canDrag === undefined ? false : options.canDrag}
      connectDragSource={jsTestUtils.connectDragSource}
      isDragging={options.isDragging === undefined ? false : options.isDragging}
      machineType={options.machineType || 'machine'}
      removeUnit={options.removeUnit || sinon.stub()}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      service={options.service || service}
      unit={options.unit || unit} />
  );

  beforeEach(function() {
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
    const wrapper = renderComponent();
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
    assert.compareJSX(wrapper, expected);
  });

  it('can render a container', function() {
    const wrapper = renderComponent({ machineType: 'container' });
    assert.equal(wrapper.find('ButtonDropdown').length, 1);
  });

  it('can disable the destroy when read only', function() {
    acl = shapeup.deepFreeze({isReadOnly: () => true});
    const wrapper = renderComponent({ machineType: 'container' });
    assert.strictEqual(
      wrapper.find('ButtonDropdown').prop('listItems')[0].action, null);
  });

  it('can display in dragged mode', function() {
    const wrapper = renderComponent({ isDragging: true });
    assert.equal(
      wrapper.prop('className').includes('machine-view__machine-unit--dragged'),
      true);
  });

  it('can display as uncommitted', function() {
    unit.deleted = true;
    const wrapper = renderComponent({ isDragging: true });
    assert.equal(
      wrapper.prop('className').includes('machine-view__machine-unit--uncommitted'),
      true);
  });

  it('can display in draggable mode', function() {
    const wrapper = renderComponent({ canDrag: true });
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
    wrapper.find('ButtonDropdown').prop('listItems')[0].action();
    assert.equal(removeUnit.callCount, 1);
  });
});
