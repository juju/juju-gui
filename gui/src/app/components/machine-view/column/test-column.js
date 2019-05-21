/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');
const shapeup = require('shapeup');

const Analytics = require('test/fake-analytics');
const MachineViewColumn = require('./column');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('MachineViewColumn', function() {
  let acl;

  const renderComponent = (options = {}) => enzyme.shallow(
    // The component is wrapped to handle drag and drop, but we just want to
    // test the internal component so we access it via DecoratedComponent.
    <MachineViewColumn.DecoratedComponent
      acl={options.acl || acl}
      activeMenuItem={options.activeMenuItem || 'name'}
      analytics={Analytics}
      canDrop={options.canDrop === undefined ? false : options.canDrop}
      connectDropTarget={jsTestUtils.connectDropTarget}
      droppable={options.droppable === undefined ? true : options.droppable}
      dropUnit={options.dropUnit || sinon.stub()}
      isOver={options.isOver === undefined ? false : options.isOver}
      menuItems={options.menuItems || []}
      title={options.title || 'Sandbox'}
      toggle={options.toggle || {}}
      type={options.type || 'machine'}>
      {options.children || (<div>contents</div>)}
    </MachineViewColumn.DecoratedComponent>
  );

  beforeEach(() => {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => false}));
  });

  it('can render', function() {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can render in droppable mode', function() {
    const wrapper = renderComponent({canDrop: true});
    assert.equal(
      wrapper.prop('className').includes('machine-view__column--droppable'),
      true);
  });

  it('can render in drop mode', function() {
    const wrapper = renderComponent({isOver: true});
    assert.equal(
      wrapper.prop('className').includes('machine-view__column--drop'),
      true);
  });
});
