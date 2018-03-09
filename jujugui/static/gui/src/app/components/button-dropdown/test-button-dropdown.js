/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const React = require('react');

const ButtonDropdown = require('./button-dropdown');
const SvgIcon = require('../svg-icon/svg-icon');
const DropdownMenu = require('../dropdown-menu/dropdown-menu');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Button Dropdown', function() {

  function renderComponent(options={}) {
    return jsTestUtils.shallowRender(
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
        tooltip="more" />, true);
  }


  it('can render closed', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <div className="button-dropdown extra-classes">
        <span aria-controls="headerDropdownMenu"
          aria-expanded="false"
          aria-haspopup="true"
          aria-owns="headerDropdownMenu"
          className="button-dropdown__button"
          onClick={instance._toggleDropdown}
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
    expect(output).toEqualJSX(expected);
  });

  it('can render open', done => {
    const renderer = renderComponent();
    const instance = renderer.getMountedInstance();
    instance.setState({showDropdown: true}, () => {
      const output = renderer.getRenderOutput();
      const expected = (
        <div className="button-dropdown extra-classes">
          <span aria-controls="headerDropdownMenu"
            aria-expanded="false"
            aria-haspopup="true"
            aria-owns="headerDropdownMenu"
            className="button-dropdown__button button-dropdown__show-menu"
            onClick={instance._toggleDropdown}
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
          <DropdownMenu
            handleClickOutside={output.props.children[1].props.handleClickOutside}>
            {[
              <li className="dropdown-menu__list-item"
                key="item1"
                role="menuitem"
                tabIndex="0">
                <a className="dropdown-menu__list-item-link"
                  onClick={sinon.stub()}
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
                  onClick={sinon.stub()}
                  role="button">
                  item4
                </a>
              </li>
            ]}
          </DropdownMenu>
        </div>
      );
      expect(output).toEqualJSX(expected);
      done();
    });
  });

  it('can have a custom icon supplied', () => {
    const icon = <img alt="test-icond" src="" />;
    const renderer = renderComponent({icon});
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <div className="button-dropdown extra-classes">
        <span aria-controls="headerDropdownMenu"
          aria-expanded="false"
          aria-haspopup="true"
          aria-owns="headerDropdownMenu"
          className="button-dropdown__button"
          onClick={instance._toggleDropdown}
          role="button"
          tabIndex="0">
          {icon}
          <span className="tooltip__tooltip--below">
            <span className="tooltip__inner tooltip__inner--up">
              more
            </span>
          </span>
        </span>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can disable the dropdown', done => {
    const renderer = renderComponent({
      disableDropdown: true
    });
    const classlist = 'button-dropdown__button button-dropdown__show-menu button-dropdown__button-with-text'; //eslint-disable-line max-len
    const instance = renderer.getMountedInstance();
    // We're setting the state to showDropdown but because it is disabled
    // the drop down is not rendered.
    instance.setState({showDropdown: true}, () => {
      const output = renderer.getRenderOutput();
      const expected = (
        <div className="button-dropdown extra-classes">
          <span aria-controls="headerDropdownMenu"
            aria-expanded="false"
            aria-haspopup="true"
            aria-owns="headerDropdownMenu"
            className={classlist}
            onClick={instance._toggleDropdown}
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
      expect(output).toEqualJSX(expected);
      done();
    });
  });
});
