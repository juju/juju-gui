/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const MoreMenu = require('./more-menu');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('MoreMenu', function() {

  it('can render as closed', function() {
    var menuItems = [{
      label: 'Add machine',
      action: sinon.stub()
    }, {
      label: 'Add container'
    }];
    var renderer = jsTestUtils.shallowRender(
      // Have to access the wrapped component as we don't want to test the click
      // outside wrapper.
      <MoreMenu.WrappedComponent
        items={menuItems}
        title="Sandbox" />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="more-menu">
        <span className="more-menu__toggle"
          onClick={instance._handleToggleMenu}
          role="button"
          tabIndex="0">
          <SvgIcon
            name="contextual-menu-16"
            size="16" />
        </span>
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can be opened', function() {
    var menuItems = [{
      label: 'Add machine',
      action: sinon.stub()
    }, {
      label: 'Add container'
    }];
    var renderer = jsTestUtils.shallowRender(
      <MoreMenu.WrappedComponent
        items={menuItems}
        title="Sandbox" />, true);
    var instance = renderer.getMountedInstance();
    instance._handleToggleMenu();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="more-menu more-menu--active">
        <span className="more-menu__toggle"
          onClick={instance._handleToggleMenu}
          role="button"
          tabIndex="0">
          <SvgIcon
            name="contextual-menu-16"
            size="16" />
        </span>
        <ul className="more-menu__menu">
          <li className="more-menu__menu-item"
            key="Add machine"
            onClick={output.props.children[1].props.children[0].props.onClick}
            role="button"
            tabIndex="0">
              Add machine
          </li>
          <li className="more-menu__menu-item more-menu__menu-item--inactive"
            key="Add container"
            onClick={output.props.children[1].props.children[1].props.onClick}
            role="button"
            tabIndex="0">
              Add container
          </li>
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can call the action on an item', function() {
    var action = sinon.stub();
    var menuItems = [{
      label: 'Add machine',
      action: action
    }, {
      label: 'Add container'
    }];
    var renderer = jsTestUtils.shallowRender(
      <MoreMenu.WrappedComponent
        items={menuItems}
        title="Sandbox" />, true);
    var instance = renderer.getMountedInstance();
    instance._handleToggleMenu();
    var output = renderer.getRenderOutput();
    output.props.children[1].props.children[0].props.onClick();
    assert.equal(action.callCount, 1);
  });
});
