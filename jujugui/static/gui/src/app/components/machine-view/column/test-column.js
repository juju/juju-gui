/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const shapeup = require('shapeup');

const MachineViewColumn = require('./column');
const MachineViewHeader = require('../header/header');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('MachineViewColumn', function() {
  let acl, sendAnalytics;

  const renderComponent = (options = {}) => enzyme.shallow(
    // The component is wrapped to handle drag and drop, but we just want to
    // test the internal component so we access it via DecoratedComponent.
    <MachineViewColumn.DecoratedComponent
      acl={options.acl || acl}
      activeMenuItem={options.activeMenuItem || 'name'}
      canDrop={options.canDrop === undefined ? false : options.canDrop}
      connectDropTarget={jsTestUtils.connectDropTarget}
      droppable={options.droppable === undefined ? true : options.droppable}
      dropUnit={options.dropUnit || sinon.stub()}
      isOver={options.isOver === undefined ? false : options.isOver}
      menuItems={options.menuItems || []}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      title={options.title || 'Sandbox'}
      toggle={options.toggle || {}}
      type={options.type || 'machine'}>
      {options.children || (<div>contents</div>)}
    </MachineViewColumn.DecoratedComponent>
  );

  beforeEach(() => {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => false}));
    sendAnalytics = sinon.stub();
  });

  it('can render', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="machine-view__column">
        <MachineViewHeader
          acl={acl.reshape(
            MachineViewHeader.DecoratedComponent.propTypes.acl
          )}
          activeMenuItem="name"
          droppable={true}
          dropUnit={sinon.stub()}
          menuItems={[]}
          sendAnalytics={sendAnalytics}
          title="Sandbox"
          toggle={{}}
          type="machine" />
        <div className="machine-view__column-content">
          <div>contents</div>
          <div className="machine-view__column-drop-target">
            <SvgIcon name="add_16"
              size="16" />
          </div>
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render in droppable mode', function() {
    const wrapper = renderComponent({ canDrop: true });
    assert.equal(
      wrapper.prop('className').includes('machine-view__column--droppable'),
      true);
  });

  it('can render in drop mode', function() {
    const wrapper = renderComponent({ isOver: true });
    assert.equal(
      wrapper.prop('className').includes('machine-view__column--drop'),
      true);
  });
});
