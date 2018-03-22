/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const shapeup = require('shapeup');

const MachineViewHeader = require('./header');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('MachineViewHeader', function() {
  let acl, sendAnalytics;

  const renderComponent = (options = {}) => enzyme.shallow(
    // The component is wrapped to handle drag and drop, but we just want to
    // test the internal component so we access it via DecoratedComponent.
    <MachineViewHeader.DecoratedComponent
      acl={options.acl || acl}
      activeMenuItem={options.activeMenuItem}
      canDrop={options.canDrop === undefined ? false : options.canDrop}
      connectDropTarget={jsTestUtils.connectDropTarget}
      droppable={options.droppable === undefined ? true : options.droppable}
      isOver={options.isOver === undefined ? false : options.isOver}
      menuItems={options.menuItems}
      sendAnalytics={options.sendAnalytics || sendAnalytics}
      title={options.title || 'Sandbox'}
      toggle={options.toggle}
      type={options.type || 'machine'} />
  );

  beforeEach(() => {
    acl = shapeup.deepFreeze({isReadOnly: () => false});
    sendAnalytics = sinon.stub();
  });

  it('can render', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="machine-view__header">
          Sandbox
        {undefined}
        <div className="machine-view__header-drop-target">
          <div className="machine-view__header-drop-message">
              Create new {'machine'}
          </div>
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render in droppable mode', function() {
    const wrapper = renderComponent({ canDrop: true });
    assert.equal(
      wrapper.prop('className').includes('machine-view__header--droppable'),
      true);
  });

  it('can render in drop mode', function() {
    const wrapper = renderComponent({ isOver: true });
    assert.equal(
      wrapper.prop('className').includes('machine-view__header--drop'),
      true);
  });

  it('can render with a menu', function() {
    const menuItems = [];
    const wrapper = renderComponent({ menuItems });
    const dropdown = wrapper.find('ButtonDropdown');
    assert.equal(dropdown.length, 1);
    assert.equal(dropdown.prop('listItems'), menuItems);
  });

  it('can render with a toggle', function() {
    const toggle = {
      action: sinon.stub(),
      disabled: false,
      toggleOn: true
    };
    const wrapper = renderComponent({ toggle });
    assert.equal(wrapper.find('GenericButton').length, 1);
  });
});
