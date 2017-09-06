/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const React = require('react');

const DropdownMenu = require('./dropdown-menu');
const Panel = require('../panel/panel');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Dropdown Menu', function() {

  function renderComponent(options={}) {
    return jsTestUtils.shallowRender(
      <DropdownMenu.WrappedComponent
        handleClickOutside={options.handleClickOutside}>
        {options.children}
      </DropdownMenu.WrappedComponent>, true);
  }

  it('can render', () => {
    const handleClickOutside = sinon.stub();
    const renderer = renderComponent({
      children: <li>child</li>,
      handleClickOutside: handleClickOutside
    });
    const output = renderer.getRenderOutput();
    const expected = (
      <Panel instanceName="dropdown-menu" visible={true}>
        <ul className="dropdown-menu__list">
          <li>child</li>
        </ul>
      </Panel>
    );
    expect(output).toEqualJSX(expected);
  });
});
