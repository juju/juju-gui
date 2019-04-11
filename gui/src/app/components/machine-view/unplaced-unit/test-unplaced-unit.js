/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const shapeup = require('shapeup');

const MachineViewUnplacedUnit = require('./unplaced-unit');
const ButtonDropdown = require('../../button-dropdown/button-dropdown');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('MachineViewUnplacedUnit', function() {
  let acl, dbAPI, modelAPI, unitAPI;

  const renderComponent = (options = {}) => enzyme.shallow(
    // The component is wrapped to handle drag and drop, but we just want to
    // test the internal component so we access it via DecoratedComponent.
    <MachineViewUnplacedUnit.DecoratedComponent
      acl={options.acl || acl}
      connectDragSource={jsTestUtils.connectDragSource}
      dbAPI={options.dbAPI || dbAPI}
      isDragging={options.isDragging === undefined ? false : options.isDragging}
      modelAPI={options.modelAPI || modelAPI}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      unitAPI={options.unitAPI || unitAPI} />
  );

  beforeEach(() => {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => false}));
    dbAPI = {
      machines: {}
    };
    modelAPI = {
      createMachine: sinon.stub(),
      placeUnit: sinon.stub()
    };
    unitAPI = {
      icon: 'icon.svg',
      removeUnit: sinon.stub(),
      selectMachine: sinon.stub(),
      unit: {
        displayName: 'django/7',
        id: 'django/7'
      }
    };
  });

  it('can render', function() {
    const wrapper = renderComponent();
    const items = wrapper.find('ButtonDropdown').prop('listItems');
    const expected = (
      <li className="machine-view__unplaced-unit">
        <img
          alt="django/7"
          className="machine-view__unplaced-unit-icon"
          src="icon.svg" />
        django/7
        <ButtonDropdown
          classes={['machine-view__unplaced-unit-dropdown']}
          listItems={[{
            label: 'Deploy to...',
            action: items[0].action
          }, {
            label: 'Destroy',
            action: items[1].action
          }]} />
        {undefined}
        <div className="machine-view__unplaced-unit-drag-state"></div>
      </li>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display in dragged mode', function() {
    const wrapper = renderComponent({isDragging: true});
    assert.equal(
      wrapper.prop('className').includes('machine-view__unplaced-unit--dragged'),
      true);
  });

  it('can remove a unit', function() {
    const wrapper = renderComponent();
    wrapper.find('ButtonDropdown').prop('listItems')[1].action();
    const removeUnit = unitAPI.removeUnit;
    assert.equal(removeUnit.callCount, 1);
    assert.equal(removeUnit.args[0][0], 'django/7');
  });

  it('disables the menu items when read only', function() {
    acl = shapeup.deepFreeze(shapeup.addReshape({isReadOnly: () => true}));
    const wrapper = renderComponent();
    wrapper.find('ButtonDropdown').prop('listItems').forEach(item => {
      assert.strictEqual(item.action, null);
    });
  });
});
