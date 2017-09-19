/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const shapeup = require('shapeup');

const MachineViewHeader = require('./header');
const GenericButton = require('../../generic-button/generic-button');
const MoreMenu = require('../../more-menu/more-menu');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('MachineViewHeader', function() {
  let acl;

  beforeEach(() => {
    acl = shapeup.deepFreeze({isReadOnly: () => false});
  });

  it('can render', function() {
    // The component is wrapped to handle drag and drop, but we just want to
    // test the internal component so we access it via DecoratedComponent.
    const output = jsTestUtils.shallowRender(
      <MachineViewHeader.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        droppable={true}
        isOver={false}
        title="Sandbox"
        type="machine" />);
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
    assert.deepEqual(output, expected);
  });

  it('can render in droppable mode', function() {
    const output = jsTestUtils.shallowRender(
      <MachineViewHeader.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        droppable={true}
        isOver={true}
        title="Sandbox"
        type="machine" />);
    const expected = (
      <div className="machine-view__header machine-view__header--drop">
        {output.props.children}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render in drop mode', function() {
    const output = jsTestUtils.shallowRender(
      <MachineViewHeader.DecoratedComponent
        acl={acl}
        canDrop={true}
        connectDropTarget={jsTestUtils.connectDropTarget}
        droppable={true}
        isOver={false}
        title="Sandbox"
        type="machine" />);
    const expected = (
      <div className="machine-view__header machine-view__header--droppable">
        {output.props.children}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render with a menu', function() {
    const menuItems = [];
    const output = jsTestUtils.shallowRender(
      <MachineViewHeader.DecoratedComponent
        acl={acl}
        activeMenuItem="name"
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        droppable={true}
        isOver={false}
        menuItems={menuItems}
        title="Sandbox"
        type="machine" />);
    const expected = (
      <div className="machine-view__header">
          Sandbox
        <MoreMenu
          activeItem="name"
          items={menuItems} />
        <div className="machine-view__header-drop-target">
          <div className="machine-view__header-drop-message">
              Create new {'machine'}
          </div>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render with a toggle', function() {
    const action = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <MachineViewHeader.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        droppable={true}
        isOver={false}
        toggle={{
          action: action,
          disabled: false,
          toggleOn: true
        }}
        title="Sandbox"
        type="machine" />);
    const expected = (
      <div className="machine-view__header">
          Sandbox
        <GenericButton
          action={action}
          disabled={false}
          type="inline-positive">
          <SvgIcon
            name="close_16_white"
            size="16" />
        </GenericButton>
        <div className="machine-view__header-drop-target">
          <div className="machine-view__header-drop-message">
              Create new {'machine'}
          </div>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });
});
