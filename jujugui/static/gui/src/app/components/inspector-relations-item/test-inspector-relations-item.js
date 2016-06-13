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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('InspectorRelationsItem', function() {
  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-relations-item', function() { done(); });
  });

  it('can render peer relations', function() {
    var relation = {
      far: {
        name: 'db',
        serviceName: 'wordpress'
      }
    };

    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorRelationsItem
          key="unique"
          relation={relation}
          label="relation-name"
          whenChanged={sinon.stub()} />);
    var expected = (<li className="inspector-relations-item"
        onClick={output.props.onClick}
        tabIndex="0" role="button">
        <label htmlFor="">
          <input
            type="checkbox"
            id="relation-name-relation"
            onClick={output.props.children.props.children[0].props.onClick}
            onChange={output.props.children.props.children[0].props.onChange}
            checked={false} />
          <span className="inspector-relations-item__label">
            relation-name
          </span>
        </label>
      </li>);
    assert.deepEqual(output, expected);
  });

  it('navigates to the details when it is clicked', function() {
    var changeState = sinon.stub();
    var index = 0;
    var relation = {
      near: {
        name: 'pgsql',
        role: 'primary'
      },
      far: {
        name: 'django',
        serviceName: 'django'
      },
      interface: 'postgresql',
      scope: 'global'
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorRelationsItem
          changeState={changeState}
          label="relation-name"
          relation={relation}
          index={index}
          whenChanged={sinon.stub()} />);
    output.props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          activeComponent: 'relation',
          unit: '0'
        }}});
  });

  it('calls the supplied whenChanged if supplied', () => {
    var whenChanged = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.InspectorRelationsItem
        key="unique"
        checked={false}
        whenChanged={whenChanged}
        label="relation-name"
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
        <juju.components.InspectorRelationsItem
          key="unique"
          checked={false}
          label="relation-name"
          action={actionStub}
          whenChanged={sinon.stub()} />);
    var checkbox = testUtils.findRenderedDOMComponentWithTag(output, 'input');
    testUtils.Simulate.click(checkbox);
    assert.equal(actionStub.callCount, 0);
  });
});
