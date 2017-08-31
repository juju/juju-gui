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
        classes={['extra-classes']}
        disableDropdown={options.disableDropdown || false}
        icon={options.icon || 'icon_16'}
        listItems={['item1']}
        tooltip="more"/>, true);
  }


  it('can render closed', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <div className="button-dropdown">
        <span className="button-dropdown__button extra-classes"
          onClick={instance._toggleDropdown}
          role="button"
          tabIndex="0"
          aria-haspopup="true"
          aria-owns="headerDropdownMenu"
          aria-controls="headerDropdownMenu"
          aria-expanded="false">
          <SvgIcon name="icon_16"
            className="button-dropdown__icon"
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
        <div className="button-dropdown">
          <span className="button-dropdown__button extra-classes button-dropdown__show-menu"
            onClick={instance._toggleDropdown}
            role="button"
            tabIndex="0"
            aria-haspopup="true"
            aria-owns="headerDropdownMenu"
            aria-controls="headerDropdownMenu"
            aria-expanded="false">
            <SvgIcon name="icon_16"
              className="button-dropdown__icon"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                more
              </span>
            </span>
          </span>
          <DropdownMenu
            classes={['extra-classes']}
            handleClickOutside={output.props.children[1].props.handleClickOutside}>
            item1
          </DropdownMenu>
        </div>
      );
      expect(output).toEqualJSX(expected);
      done();
    });
  });

  it('can have a custom icon supplied', () => {
    const icon = <img alt="test-icond" src=""/>;
    const renderer = renderComponent({icon});
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <div className="button-dropdown">
        <span className="button-dropdown__button extra-classes"
          onClick={instance._toggleDropdown}
          role="button"
          tabIndex="0"
          aria-haspopup="true"
          aria-owns="headerDropdownMenu"
          aria-controls="headerDropdownMenu"
          aria-expanded="false">
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
    const classlist = 'button-dropdown__button extra-classes button-dropdown__show-menu button-dropdown__button-with-text'; //eslint-disable-line max-len
    const instance = renderer.getMountedInstance();
    // We're setting the state to showDropdown but because it is disabled
    // the drop down is not rendered.
    instance.setState({showDropdown: true}, () => {
      const output = renderer.getRenderOutput();
      const expected = (
        <div className="button-dropdown">
          <span className={classlist}
            onClick={instance._toggleDropdown}
            role="button"
            tabIndex="0"
            aria-haspopup="true"
            aria-owns="headerDropdownMenu"
            aria-controls="headerDropdownMenu"
            aria-expanded="false">
            <SvgIcon name="icon_16"
              className="button-dropdown__icon"
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
