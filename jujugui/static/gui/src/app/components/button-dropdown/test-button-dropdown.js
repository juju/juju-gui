/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ButtonDropdown = require('./button-dropdown');
const SvgIcon = require('../svg-icon/svg-icon');

describe('Button Dropdown', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <ButtonDropdown
      activeItem="i4"
      classes={['extra-classes']}
      disableDropdown={options.disableDropdown || false}
      icon={options.icon || 'icon_16'}
      listItems={options.listItems || [{
        action: sinon.stub(),
        label: 'item1'
      }, {
        label: 'item2'
      }, {
        element: (<span>item3</span>)
      }, {
        action: sinon.stub(),
        id: 'i4',
        label: 'item4'
      }]}
      tooltip="more" />
  );


  it('can render closed', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="button-dropdown extra-classes">
        <span aria-controls="headerDropdownMenu"
          aria-expanded="false"
          aria-haspopup="true"
          aria-owns="headerDropdownMenu"
          className="button-dropdown__button"
          onClick={wrapper.find('.button-dropdown__button').prop('onClick')}
          role="button"
          tabIndex="0">
          <SvgIcon className="button-dropdown__icon"
            name="icon_16"
            size="16" />
          <span className="tooltip__tooltip--below">
            <span className="tooltip__inner tooltip__inner--up">
              more
            </span>
          </span>
        </span>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('can render open', () => {
    const wrapper = renderComponent();
    wrapper.find('.button-dropdown__button').simulate('click');
    wrapper.update();
    const menu = wrapper.find('WrappedDropdownMenu');
    const menuItems = wrapper.find('.dropdown-menu__list-item');
    const links = wrapper.find('.dropdown-menu__list-item-link');
    const children = [
      <li className="dropdown-menu__list-item"
        key="item1"
        role="menuitem"
        tabIndex="0">
        <a className="dropdown-menu__list-item-link"
          onClick={links.at(0).prop('onClick')}
          role="button">
          item1
        </a>
      </li>,
      <li className="dropdown-menu__list-item dropdown-menu__list-item--inactive"
        key="item2"
        role="menuitem"
        tabIndex="0">
        item2
      </li>,
      <li className="dropdown-menu__list-item"
        key="item-2"
        role="menuitem"
        tabIndex="0">
        <span>item3</span>
      </li>,
      <li className="dropdown-menu__list-item dropdown-menu__list-item--active"
        key="i4"
        role="menuitem"
        tabIndex="0">
        <a className="dropdown-menu__list-item-link"
          onClick={links.at(1).prop('onClick')}
          role="button">
          item4
        </a>
      </li>
    ];
    assert.equal(menu.length, 1);
    assert.deepEqual(menuItems.length, 4);
    assert.compareJSX(menuItems.at(0), children[0]);
    assert.compareJSX(menuItems.at(1), children[1]);
    assert.compareJSX(menuItems.at(2), children[2]);
    assert.compareJSX(menuItems.at(3), children[3]);
  });

  it('can have a custom icon supplied', () => {
    const icon = <img alt="test-icond" src="" />;
    const wrapper = renderComponent({icon});
    assert.compareJSX(wrapper.find('img'), icon);
  });

  it('can disable the dropdown', () => {
    const wrapper = renderComponent({
      disableDropdown: true
    });
    // We're setting the state to showDropdown but because it is disabled
    // the drop down is not rendered.
    wrapper.find('.button-dropdown__button').simulate('click');
    wrapper.update();
    assert.equal(wrapper.find('DropdownMenu').length, 0);
  });
});
