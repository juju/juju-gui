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

describe('UnitList', () => {
  var service;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('unit-list', () => { done(); });
  });

  beforeEach(() => {
    service = {
      get: function(val) {
        if (val === 'subordinate') {
          return false;
        }
        return 'mysql';
      }
    };
  });

  it('renders if there are no units', () => {
    var renderer = jsTestUtils.shallowRender(
        <juju.components.UnitList
          service={service}
          units={[]} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="unit-list">
        <div className="unit-list__actions">
          <juju.components.OverviewAction
            action={instance._navigate}
            icon="plus_box_16"
            title="Scale service" />
        </div>
        <div className="unit-list__message">
          No units for this service. Scale to add units.
        </div>
        {undefined}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('renders a list of unit components', () => {
    var units = [{
      displayName: 'mysql/0',
      id: 'mysql/0'
    }, {
      displayName: 'mysql/1',
      id: 'mysql/1'
    }];
    var renderer = jsTestUtils.shallowRender(
        <juju.components.UnitList
          service={service}
          units={units} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var children = output.props.children[1].props.children;
    var refs = [
      'UnitListItem-' + units[0].id,
      'UnitListItem-' + units[1].id
    ];
    assert.deepEqual(children, [
      <juju.components.UnitListItem
        ref="select-all"
        key="select-all"
        className="select-all"
        label="Select all units"
        count={2}
        whenChanged={children[0].props.whenChanged}/>,
      <juju.components.UnitListItem
        key={units[0].displayName}
        ref={refs[0]}
        label={units[0].displayName}
        action={children[1].props.action}
        unitId="mysql/0"
        whenChanged={instance._updateActiveCount} />,
      <juju.components.UnitListItem
        key={units[1].displayName}
        ref={refs[1]}
        label={units[1].displayName}
        action={children[2].props.action}
        unitId="mysql/1"
        whenChanged={instance._updateActiveCount} />
    ]);
  });

  it('renders a grouped list of error unit components', () => {
    var units = [{
      displayName: 'mysql/0',
      id: 'mysql/0',
      agent_state_info: 'hook failed: install'
    }, {
      displayName: 'mysql/1',
      id: 'mysql/1',
      agent_state_info: 'hook failed: config-changed'
    }];
    var renderer = jsTestUtils.shallowRender(
        <juju.components.UnitList
          unitStatus='error'
          units={units} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var children = output.props.children[1].props.children;
    var refs = [
      'UnitListItem-' + units[0].id,
      'UnitListItem-' + units[1].id
    ];
    assert.deepEqual(children, [
      <juju.components.UnitListItem
        ref="select-all-0"
        key="select-all-0"
        className="select-all"
        label="hook failed: install"
        count={1}
        whenChanged={children[0].props.whenChanged}/>,
      <juju.components.UnitListItem
        key={units[0].displayName}
        ref={refs[0]}
        label={units[0].displayName}
        action={children[1].props.action}
        unitId="mysql/0"
        whenChanged={instance._updateActiveCount} />,
      <juju.components.UnitListItem
        ref="select-all-1"
        key="select-all-1"
        className="select-all"
        label="hook failed: config-changed"
        count={1}
        whenChanged={children[2].props.whenChanged}/>,
      <juju.components.UnitListItem
        key={units[1].displayName}
        ref={refs[1]}
        label={units[1].displayName}
        action={children[3].props.action}
        unitId="mysql/1"
        whenChanged={instance._updateActiveCount} />
    ]);
  });

  it('displays the provided count', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <juju.components.UnitListItem
        count={5}/>);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.children.props.children[2].props.children, 5);
  });

  it('renders the Scale Service action component', () => {
    var units = [{
      displayName: 'mysql/0'
    }];

    var output = jsTestUtils.shallowRender(
        <juju.components.UnitList
          service={service}
          units={units} />);
    var child = output.props.children[0].props.children;
    assert.deepEqual(child,
      <juju.components.OverviewAction
        action={child.props.action}
        icon="plus_box_16"
        title="Scale service"/>);
  });

  it('does not render the actions when viewing a status list', () => {
    var units = [{
      displayName: 'mysql/0'
    }];
    var output = jsTestUtils.shallowRender(
        <juju.components.UnitList
          service={service}
          unitStatus="pending"
          units={units} />);
    assert.deepEqual(output,
      <div className="unit-list">
        {undefined}
        {output.props.children[1]}
        {output.props.children[2]}
      </div>);
  });

  it('does not render the actions when viewing a subordinate', () => {
    var units = [{
      displayName: 'mysql/0'
    }];
    service = {
      get: function(val) {
        if (val === 'subordinate') {
          return true;
        }
        return 'mysql';
      }
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.UnitList
          service={service}
          units={units} />);
    assert.deepEqual(output,
      <div className="unit-list">
        {undefined}
        {output.props.children[1]}
        {output.props.children[2]}
      </div>);
  });

  it('propagates select-all to all children', () => {
    var units = [{
      displayName: 'mysql/0',
      id: 'mysql/0'
    }, {
      displayName: 'mysql/1',
      id: 'mysql/1'
    }];
    // shallowRenderer doesn't support state so need to render it.
    var component = testUtils.renderIntoDocument(
      <juju.components.UnitList
        service={service}
        units={units} />);
    var refs = component.refs;
    // We want to make sure that they are not checked first.
    assert.deepEqual(refs['UnitListItem-mysql/0'].state, {checked: false});
    assert.deepEqual(refs['UnitListItem-mysql/1'].state, {checked: false});
    // Activate the select all toggle.
    refs['select-all'].props.whenChanged(true);
    // Now check that they are all checked.
    assert.deepEqual(refs['UnitListItem-mysql/0'].state, {checked: true});
    assert.deepEqual(refs['UnitListItem-mysql/1'].state, {checked: true});
  });

  it('navigates to the unit when a list item is clicked', function() {
    var units = [{
      displayName: 'mysql/5',
      id: 'mysql/5'
    }];
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.UnitList
          changeState={changeState}
          service={service}
          unitStatus={null}
          units={units} />);
    output.props.children[1].props.children[1].props.action({
      currentTarget: {
        getAttribute: function() {
          return 'mysql/5';
        }
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          id: 'mysql',
          unit: '5',
          activeComponent: 'unit'
        }
      }
    });
  });

  it('navigates to the remote service unit when a list item is clicked', () => {
    // A subordinate shows the remote service unit.
    var units = [{
      displayName: 'wordpress/5',
      id: 'wordpress/5'
    }];
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.UnitList
          changeState={changeState}
          service={service}
          unitStatus={null}
          units={units} />);
    output.props.children[1].props.children[1].props.action({
      currentTarget: {
        getAttribute: function() {
          return 'wordpress/5';
        }
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          id: 'wordpress',
          unit: '5',
          activeComponent: 'unit'
        }
      }
    });
  });

  it('only displays a remove button for a non-error list', function() {
    var units = [{
      displayName: 'mysql/0'
    }];
    var output = jsTestUtils.shallowRender(
        <juju.components.UnitList
          service={service}
          units={units} />);
    var buttonItems = output.props.children[2].props.buttons;
    var buttons = [{
      title: 'Remove',
      type: 'neutral',
      action: buttonItems[0].action,
      disabled: true
    }];
    assert.deepEqual(output.props.children[2],
      <juju.components.ButtonRow
        buttons={buttons} />);
    assert.equal(buttonItems.length, 1);
  });

  it('displays Resolve and Retry buttons for an error list', function() {
    var units = [{
      displayName: 'mysql/0'
    }];
    var output = jsTestUtils.shallowRender(
        <juju.components.UnitList
          unitStatus='error'
          units={units} />);
    var buttonItems = output.props.children[2].props.buttons;
    var buttons = [{
      title: 'Resolve',
      type: 'base',
      action: buttonItems[0].action,
      disabled: true
    }, {
      title: 'Retry',
      type: 'base',
      action: buttonItems[1].action,
      disabled: true
    }, {
      title: 'Remove',
      type: 'neutral',
      action: buttonItems[2].action,
      disabled: true
    }];
    assert.deepEqual(output.props.children[2],
      <juju.components.ButtonRow
        buttons={buttons} />);
    assert.equal(buttonItems.length, 3);
  });

  it('can remove the selected units', function() {
    var destroyUnits = sinon.stub();
    var changeState = sinon.stub();
    var envResolved = sinon.stub();
    var units = [{
      displayName: 'mysql/0',
      id: 'mysql/0'
    }, {
      displayName: 'mysql/1',
      id: 'mysql/1'
    }, {
      displayName: 'mysql/2',
      id: 'mysql/2'
    }];
    // Have to use renderIntoDocument here as shallowRenderer does not support
    // refs.
    var output = testUtils.renderIntoDocument(
        <juju.components.UnitList
          destroyUnits={destroyUnits}
          changeState={changeState}
          envResolved={envResolved}
          service={service}
          units={units} />);
    var checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[1].checked = true;
    testUtils.Simulate.change(checkboxes[1]);
    checkboxes[3].checked = true;
    testUtils.Simulate.change(checkboxes[3]);
    var button = testUtils.findRenderedDOMComponentWithClass(
        output, 'button--neutral');
    testUtils.Simulate.click(button);
    assert.equal(destroyUnits.callCount, 1);
    assert.deepEqual(destroyUnits.args[0][0], [units[0].id, units[2].id]);
    // Make sure we mark the unit as resolved so that we can remove it.
    assert.equal(envResolved.callCount, 2);
  });

  it('deselects all units after removal', function() {
    var destroyUnits = sinon.stub();
    var changeState = sinon.stub();
    var units = [{
      displayName: 'mysql/0',
      id: 'mysql/0'
    }];
    // Have to use renderIntoDocument here as shallowRenderer does not support
    // refs.
    var output = testUtils.renderIntoDocument(
        <juju.components.UnitList
          destroyUnits={destroyUnits}
          changeState={changeState}
          envResolved={sinon.stub()}
          service={service}
          units={units} />);
    var checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[1].checked = true;
    testUtils.Simulate.change(checkboxes[1]);
    var button = testUtils.findRenderedDOMComponentWithClass(
        output, 'button--neutral');
    testUtils.Simulate.click(button);
    assert.isFalse(output.refs['UnitListItem-' + units[0].id].state.checked);
  });

  it('deselects select all after removal', function() {
    var destroyUnits = sinon.stub();
    var changeState = sinon.stub();
    var units = [{
      displayName: 'mysql/0',
      id: 'mysql/0'
    }];
    // Have to use renderIntoDocument here as shallowRenderer does not support
    // refs.
    var output = testUtils.renderIntoDocument(
        <juju.components.UnitList
          destroyUnits={destroyUnits}
          changeState={changeState}
          envResolved={sinon.stub()}
          service={service}
          units={units} />);
    var checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[0].checked = true;
    testUtils.Simulate.change(checkboxes[0]);
    assert.isTrue(output.refs['select-all'].state.checked);
    var button = testUtils.findRenderedDOMComponentWithClass(
        output, 'button--neutral');
    testUtils.Simulate.click(button);
    assert.isFalse(output.refs['UnitListItem-' + units[0].id].state.checked);
    assert.isFalse(output.refs['select-all'].state.checked);
  });

  it('can resolve the selected units', function() {
    var changeState = sinon.stub();
    var envResolved = sinon.stub();
    var units = [{
      displayName: 'mysql/0',
      id: 'mysql/0'
    }, {
      displayName: 'mysql/1',
      id: 'mysql/1'
    }, {
      displayName: 'mysql/2',
      id: 'mysql/2'
    }];
    // Have to use renderIntoDocument here as shallowRenderer does not support
    // refs.
    var output = testUtils.renderIntoDocument(
        <juju.components.UnitList
          unitStatus='error'
          envResolved={envResolved}
          changeState={changeState}
          service={service}
          units={units} />);
    var checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[1].checked = true;
    testUtils.Simulate.change(checkboxes[1]);
    checkboxes[2].checked = true;
    testUtils.Simulate.change(checkboxes[2]);
    var button = testUtils.scryRenderedDOMComponentsWithClass(
        output, 'button--base')[0];
    testUtils.Simulate.click(button);
    assert.equal(envResolved.callCount, 2);
    assert.deepEqual(envResolved.args[0][0], units[0].id);
    assert.deepEqual(envResolved.args[0][2], false);
    assert.deepEqual(envResolved.args[1][0], units[1].id);
    assert.deepEqual(envResolved.args[1][2], false);
  });

  it('can retry the selected units', function() {
    var changeState = sinon.stub();
    var envResolved = sinon.stub();
    var units = [{
      displayName: 'mysql/0',
      id: 'mysql/0'
    }, {
      displayName: 'mysql/1',
      id: 'mysql/1'
    }, {
      displayName: 'mysql/2',
      id: 'mysql/2'
    }];
    // Have to use renderIntoDocument here as shallowRenderer does not support
    // refs.
    var output = testUtils.renderIntoDocument(
        <juju.components.UnitList
          unitStatus='error'
          envResolved={envResolved}
          changeState={changeState}
          service={service}
          units={units} />);
    var checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[1].checked = true;
    testUtils.Simulate.change(checkboxes[1]);
    checkboxes[2].checked = true;
    testUtils.Simulate.change(checkboxes[2]);
    var button = testUtils.scryRenderedDOMComponentsWithClass(
        output, 'button--base')[1];
    testUtils.Simulate.click(button);
    assert.equal(envResolved.callCount, 2);
    assert.deepEqual(envResolved.args[0][0], units[0].id);
    assert.deepEqual(envResolved.args[0][2], true);
    assert.deepEqual(envResolved.args[1][0], units[1].id);
    assert.deepEqual(envResolved.args[1][2], true);
  });
});
