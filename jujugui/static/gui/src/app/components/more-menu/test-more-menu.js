/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const MoreMenu = require('./more-menu');
const ButtonDropdown = require('../button-dropdown/button-dropdown');

const jsTestUtils = require('../../utils/component-test-utils');

describe('MoreMenu', function() {

  it('can render', function() {
    const menuItems = [{
      label: 'Add machine',
      action: sinon.stub()
    }, {
      label: 'Add container'
    }];
    const renderer = jsTestUtils.shallowRender(
      <MoreMenu
        items={menuItems}
        title="Sandbox" />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <ButtonDropdown
        classes={['more-menu']}
        icon="contextual-menu-16"
        listItems={[
          <li className="more-menu__menu-item dropdown-menu__list-item"
            key="Add machine"
            role="menuitem"
            tabIndex="0">
            <a className="dropdown-menu__list-item-link"
              role="button"
              onClick={sinon.stub()}>
              Add machine
            </a>
          </li>,
          <li className="more-menu__menu-item dropdown-menu__list-item more-menu__menu-item--inactive" //eslint-disable-line max-len
            key="Add container"
            role="menuitem"
            tabIndex="0">
            Add container
          </li>
        ]}
        ref="buttonDropdown" />);
    expect(output).toEqualJSX(expected);
  });

  it('can call the action on an item', function() {
    const action = sinon.stub();
    const menuItems = [{
      label: 'Add machine',
      action: action
    }, {
      label: 'Add container'
    }];
    const renderer = jsTestUtils.shallowRender(
      <MoreMenu
        items={menuItems}
        title="Sandbox" />, true);
    const instance = renderer.getMountedInstance();
    const _toggleDropdown = sinon.stub();
    instance.refs = {
      buttonDropdown: {
        _toggleDropdown
      }
    };
    const output = renderer.getRenderOutput();
    output.props.listItems[0].props.children.props.onClick();
    assert.equal(action.callCount, 1);
    assert.equal(_toggleDropdown.callCount, 1);
  });
});
