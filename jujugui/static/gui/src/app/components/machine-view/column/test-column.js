/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const shapeup = require('shapeup');

const MachineViewColumn = require('./column');
const MachineViewHeader = require('../header/header');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('MachineViewColumn', function() {
  let acl, sendAnalytics;

  beforeEach(() => {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => false}));
    sendAnalytics = sinon.stub();
  });

  it('can render', function() {
    const menuItems = [];
    const toggle = {};
    const dropUnit = sinon.stub();
    // The component is wrapped to handle drag and drop, but we just want to
    // test the internal component so we access it via DecoratedComponent.
    const output = jsTestUtils.shallowRender(
      <MachineViewColumn.DecoratedComponent
        acl={acl}
        activeMenuItem="name"
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        droppable={true}
        dropUnit={dropUnit}
        isOver={false}
        menuItems={menuItems}
        sendAnalytics={sendAnalytics}
        title="Sandbox"
        toggle={toggle}
        type="machine">
        <div>contents</div>
      </MachineViewColumn.DecoratedComponent>);
    const expected = (
      <div className="machine-view__column">
        <MachineViewHeader
          acl={acl.reshape(
            MachineViewHeader.DecoratedComponent.propTypes.acl
          )}
          activeMenuItem="name"
          droppable={true}
          dropUnit={dropUnit}
          menuItems={menuItems}
          sendAnalytics={sendAnalytics}
          title="Sandbox"
          toggle={toggle}
          type="machine" />
        <div className="machine-view__column-content">
          <div>contents</div>
          <div className="machine-view__column-drop-target">
            <SvgIcon name="add_16"
              size="16" />
          </div>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render in droppable mode', function() {
    const output = jsTestUtils.shallowRender(
      <MachineViewColumn.DecoratedComponent
        acl={acl}
        canDrop={false}
        connectDropTarget={jsTestUtils.connectDropTarget}
        droppable={true}
        isOver={true}
        sendAnalytics={sendAnalytics}
        title="Sandbox"
        type="machine" />);
    const expected = (
      <div className="machine-view__column machine-view__column--drop">
        {output.props.children}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render in drop mode', function() {
    const output = jsTestUtils.shallowRender(
      <MachineViewColumn.DecoratedComponent
        acl={acl}
        canDrop={true}
        connectDropTarget={jsTestUtils.connectDropTarget}
        droppable={true}
        isOver={false}
        sendAnalytics={sendAnalytics}
        title="Sandbox"
        type="machine" />);
    const expected = (
      <div className="machine-view__column machine-view__column--droppable">
        {output.props.children}
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
