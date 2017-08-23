/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('Dropdown Menu', function() {

  beforeAll(done => {
    // By loading this file it adds the component to the juju components.
    YUI().use('dropdown-menu', function() {
      done();
    });
  });

  function renderComponent(options={}) {
    return jsTestUtils.shallowRender(
      <juju.components.DropdownMenu.wrappedComponent
        handleClickOutside={options.handleClickOutside}>
        {options.children}
      </juju.components.DropdownMenu.wrappedComponent>, true);
  }


  it('can render', () => {
    const handleClickOutside = sinon.stub();
    const renderer = renderComponent({
      children: <li>child</li>,
      handleClickOutside: handleClickOutside
    });
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.Panel instanceName="dropdown-menu" visible={true}>
        <ul className="dropdown-menu__list">
          <li>child</li>
        </ul>
      </juju.components.Panel>
    );
    expect(output).toEqualJSX(expected);
  });
});
