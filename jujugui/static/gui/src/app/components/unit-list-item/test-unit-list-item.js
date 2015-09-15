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
        />);
    assert.deepEqual(output.props.children, [
        <input
          type="checkbox"
          id="unit-name-unit"
          onChange={output.props.children[0].props.onChange}
          checked={false} />,
        <label htmlFor="unit-name-unit">unit-name</label>]);
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
    output.props.children[0].props.onChange({
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
        />, true);
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(
      output.props.children[0],
      <input
        type="checkbox"
        id="unit-name-unit"
        onChange={output.props.children[0].props.onChange}
        checked={false} />);

    shallowRenderer.render(<juju.components.UnitListItem
      key="unique"
      checked={true}
      label="unit-name"
    />);

    output = shallowRenderer.getRenderOutput();
    assert.deepEqual(
      output.props.children[0],
      <input
        type="checkbox"
        id="unit-name-unit"
        onChange={output.props.children[0].props.onChange}
        checked={true} />);
  });
});
