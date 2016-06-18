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

var juju = {components: {}}; // eslint-disable-line no-unused-vars
var testUtils = React.addons.TestUtils;

describe('CheckListItem', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('check-list-item', () => { done(); });
  });

  it('renders ui based on props', () => {
    var output = jsTestUtils.shallowRender(
        <juju.components.CheckListItem
          key="unique"
          checked={false}
          disabled={false}
          label="a-label"
          id="apache/2"
          className="select-all"
          aside="3"
          whenChanged={sinon.stub()}
        />);
    assert.deepEqual(output,
        <li className="check-list-item check-list-item--select-all"
          data-id="apache/2"
          onClick={undefined} tabIndex="0" role="button">
          <label htmlFor="a-label-item">
            <input
              disabled={false}
              type="checkbox"
              id="a-label-item"
              onClick={output.props.children.props.children[0].props.onClick}
              onChange={output.props.children.props.children[0].props.onChange}
              checked={false} />
            <span className="check-list-item__label">
              a-label
            </span>
            <span className="check-list-item__aside">
              3
            </span>
          </label>
        </li>);
  });

  it('does not set a "for" id on the label if it is a nav element', () => {
    var output = jsTestUtils.shallowRender(
        <juju.components.CheckListItem
          key="unique"
          checked={false}
          disabled={false}
          label="a-label"
          action={sinon.stub()}
          id="apache/2"
          whenChanged={sinon.stub()}
        />);
    assert.equal(output.props.children.props.htmlFor, '');
  });

  it('has a nav class if it is a nav element', () => {
    var output = jsTestUtils.shallowRender(
        <juju.components.CheckListItem
          key="unique"
          checked={false}
          disabled={false}
          label="a-label"
          action={sinon.stub()}
          id="apache/2"
          whenChanged={sinon.stub()}
        />);
    assert.isTrue(output.props.className.indexOf(
        'check-list-item--nav') > -1);
  });

  it('calls the supplied whenChanged if supplied', () => {
    var whenChanged = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.CheckListItem
        key="unique"
        checked={false}
        disabled={false}
        whenChanged={whenChanged}
        label="a-label"
      />);
    output.props.children.props.children[0].props.onChange({
      currentTarget: {
        checked: true
      }
    });
    assert.equal(whenChanged.callCount, 1);
    assert.equal(whenChanged.args[0][0], true);
  });

  it('does not bubble the click event when clicking a checkbox', () => {
    var actionStub = sinon.stub();
    // Need to render the full component here as shallowRenderer does not yet
    // support simulating click events.
    var output = testUtils.renderIntoDocument(
        <juju.components.CheckListItem
          key="unique"
          checked={false}
          disabled={false}
          label="a-label"
          id="apache/2"
          action={actionStub}
          whenChanged={sinon.stub()}
        />);
    var checkbox = testUtils.findRenderedDOMComponentWithTag(output, 'input');
    testUtils.Simulate.click(checkbox);
    assert.equal(actionStub.callCount, 0);
  });

  it('can have a disabled checkbox', () => {
    var output = jsTestUtils.shallowRender(
        <juju.components.CheckListItem
          key="unique"
          checked={false}
          disabled={true}
          label="a-label"
          id="apache/2"
          className="select-all"
          aside="3"
          whenChanged={sinon.stub()}
        />);
    var expected = (
      <input
        disabled={true}
        type="checkbox"
        id="a-label-item"
        onClick={output.props.children.props.children[0].props.onClick}
        onChange={output.props.children.props.children[0].props.onChange}
        checked={false} />);
    assert.deepEqual(output.props.children.props.children[0], expected);
  });
});
