/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

describe('UnitListItem', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('unit-list-item', () => { done(); });
  });

  it('renders ui based on props', () => {
    var output = jsTestUtils.shallowRender(
        <juju.components.UnitListItem
          key="unique"
          checked={false}
          label="unit-name"
          unitId="apache/2"
        />);
    assert.deepEqual(output,
        <li className="unit-list-item"
          data-id="apache/2"
          onClick={undefined} tabIndex="0" role="button">
          <label htmlFor="unit-name-unit">
            <input
              type="checkbox"
              id="unit-name-unit"
              onClick={output.props.children.props.children[0].props.onClick}
              onChange={output.props.children.props.children[0].props.onChange}
              checked={false} />
            unit-name
          </label>
        </li>);
  });

  it('does not set a "for" id on the label if it is a nav element', () => {
    var output = jsTestUtils.shallowRender(
        <juju.components.UnitListItem
          key="unique"
          checked={false}
          label="unit-name"
          action="action"
          unitId="apache/2"
        />);
    assert.deepEqual(output.props.children,
        <label htmlFor="">
          <input
            type="checkbox"
            id="unit-name-unit"
            onClick={output.props.children.props.children[0].props.onClick}
            onChange={output.props.children.props.children[0].props.onChange}
            checked={false} />
          unit-name
        </label>);
  });

  it('has a nav class if it is a nav element', () => {
    var output = jsTestUtils.shallowRender(
        <juju.components.UnitListItem
          key="unique"
          checked={false}
          label="unit-name"
          action="action"
          unitId="apache/2"
        />);
    assert.deepEqual(output,
      <li className="unit-list-item unit-list-item--nav"
        data-id="apache/2"
        onClick={output.props.onClick} tabIndex="0" role="button">
        <label htmlFor="">
          <input
            type="checkbox"
            id="unit-name-unit"
            onClick={output.props.children.props.children[0].props.onClick}
            onChange={output.props.children.props.children[0].props.onChange}
            checked={false} />
          unit-name
        </label>
      </li>);
  });

  it('calls the supplied whenChanged if supplied', () => {
    var whenChanged = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.UnitListItem
        key="unique"
        checked={false}
        whenChanged={whenChanged}
        label="unit-name"
      />);
    output.props.children.props.children[0].props.onChange({
      currentTarget: {
        checked: true
      }
    });
    assert.equal(whenChanged.callCount, 1);
    assert.equal(whenChanged.args[0][0], true);
  });

  it('updates the checked status based on updating props', () => {
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.UnitListItem
          key="unique"
          checked={false}
          label="unit-name"
          unitId="apache/2"
        />, true);
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(
      output.props.children.props.children[0],
      <input
        type="checkbox"
        id="unit-name-unit"
        onClick={output.props.children.props.children[0].props.onClick}
        onChange={output.props.children.props.children[0].props.onChange}
        checked={false} />);

    shallowRenderer.render(<juju.components.UnitListItem
      key="unique"
      checked={true}
      label="unit-name"
      unitId="apache/2"
    />);

    output = shallowRenderer.getRenderOutput();
    assert.deepEqual(
      output.props.children.props.children[0],
      <input
        type="checkbox"
        id="unit-name-unit"
        onClick={output.props.children.props.children[0].props.onClick}
        onChange={output.props.children.props.children[0].props.onChange}
        checked={true} />);
  });

  it('does not bubble the click event when clicking a checkbox', () => {
    var actionStub = sinon.stub();
    // Need to render the full component here as shallowRenderer does not yet
    // support simulating click events.
    var output = testUtils.renderIntoDocument(
        <juju.components.UnitListItem
          key="unique"
          checked={false}
          label="unit-name"
          unitId="apache/2"
          action={actionStub}
        />);
    var checkbox = testUtils.findRenderedDOMComponentWithTag(output, 'input');
    testUtils.Simulate.click(checkbox);
    assert.equal(actionStub.callCount, 0);
  });
});
