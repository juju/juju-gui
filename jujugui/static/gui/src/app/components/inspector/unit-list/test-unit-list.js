/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const UnitList = require('./unit-list');
const ButtonRow = require('../../button-row/button-row');
const CheckListItem = require('../../check-list-item/check-list-item');
const OverviewAction = require('../overview-action/overview-action');

const jsTestUtils = require('../../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('UnitList', () => {
  var acl, service;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
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
      <UnitList
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        service={service}
        units={[]}
        whenChanged={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="unit-list">
        <div className="unit-list__actions">
          <OverviewAction
            action={instance._navigate}
            icon="plus_box_16"
            title="Scale application" />
        </div>
        <div className="unit-list__message">
          No units for this application. Scale to add units.
        </div>
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
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
      <UnitList
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        service={service}
        units={units}
        whenChanged={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var children = output.props.children[1].props.children;
    var refs = [
      'CheckListItem-' + units[0].id,
      'CheckListItem-' + units[1].id
    ];
    const expected = (
      <ul className="unit-list__units">
        {[<CheckListItem
          aside="2"
          className="select-all"
          disabled={false}
          key="select-all"
          label="Select all units"
          ref="select-all"
          whenChanged={children[0].props.whenChanged} />,
        <CheckListItem
          action={children[1].props.action}
          disabled={false}
          extraInfo={undefined}
          id="mysql/0"
          key={units[0].displayName}
          label={units[0].displayName}
          ref={refs[0]}
          whenChanged={instance._updateActiveCount} />,
        <CheckListItem
          action={children[2].props.action}
          disabled={false}
          extraInfo={undefined}
          id="mysql/1"
          key={units[1].displayName}
          label={units[1].displayName}
          ref={refs[1]}
          whenChanged={instance._updateActiveCount} />]}
      </ul>);
    expect(output.props.children[1]).toEqualJSX(expected);
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
      <UnitList
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        service={{}}
        units={units}
        unitStatus='error'
        whenChanged={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var children = output.props.children[1].props.children;
    var refs = [
      'CheckListItem-' + units[0].id,
      'CheckListItem-' + units[1].id
    ];
    const expected = (
      <ul className="unit-list__units">
        {[<CheckListItem
          aside="1"
          className="select-all"
          disabled={false}
          key="select-all-0"
          label="hook failed: install"
          ref="select-all-0"
          whenChanged={children[0].props.whenChanged} />,
        <CheckListItem
          action={children[1].props.action}
          disabled={false}
          extraInfo={undefined}
          id="mysql/0"
          key={units[0].displayName}
          label={units[0].displayName}
          ref={refs[0]}
          whenChanged={instance._updateActiveCount} />,
        <CheckListItem
          aside="1"
          className="select-all"
          disabled={false}
          key="select-all-1"
          label="hook failed: config-changed"
          ref="select-all-1"
          whenChanged={children[2].props.whenChanged} />,
        <CheckListItem
          action={children[3].props.action}
          disabled={false}
          extraInfo={undefined}
          id="mysql/1"
          key={units[1].displayName}
          label={units[1].displayName}
          ref={refs[1]}
          whenChanged={instance._updateActiveCount} />]}
      </ul>);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('displays the provided count', function() {
    const renderer = jsTestUtils.shallowRender(
      <CheckListItem
        aside="5"
        label="label"
        whenChanged={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    assert.equal(output.props.children.props.children[3].props.children, '5');
  });

  it('does not show the scaling link when read only', () => {
    acl.isReadOnly.returns(true);
    const units = [{
      displayName: 'mysql/0'
    }];
    const output = jsTestUtils.shallowRender(
      <UnitList
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        service={service}
        units={units}
        whenChanged={sinon.stub()} />);
    const scaling = output.props.children[0];
    assert.equal(scaling, null);
  });

  it('renders the Scale Application action component', () => {
    var units = [{
      displayName: 'mysql/0'
    }];

    var output = jsTestUtils.shallowRender(
      <UnitList
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        service={service}
        units={units}
        whenChanged={sinon.stub()} />);
    var child = output.props.children[0].props.children;
    const expected = (
      <OverviewAction
        action={child.props.action}
        icon="plus_box_16"
        title="Scale application" />);
    expect(child).toEqualJSX(expected);
  });

  it('does not render the actions when viewing a status list', () => {
    var units = [{
      displayName: 'mysql/0'
    }];
    var output = jsTestUtils.shallowRender(
      <UnitList
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        service={service}
        units={units}
        unitStatus="pending"
        whenChanged={sinon.stub()} />);
    const expected = (
      <div className="unit-list">
        {undefined}
        {output.props.children[1]}
        {output.props.children[2]}
      </div>);
    expect(output).toEqualJSX(expected);
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
      <UnitList
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        service={service}
        units={units}
        whenChanged={sinon.stub()} />);
    const expected = (
      <div className="unit-list">
        {undefined}
        {output.props.children[1]}
        {output.props.children[2]}
      </div>);
    expect(output).toEqualJSX(expected);
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
      <UnitList
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        service={service}
        units={units}
        whenChanged={sinon.stub()} />);
    var refs = component.refs;
    // We want to make sure that they are not checked first.
    assert.deepEqual(refs['CheckListItem-mysql/0'].state, {checked: false});
    assert.deepEqual(refs['CheckListItem-mysql/1'].state, {checked: false});
    // Activate the select all toggle.
    refs['select-all'].props.whenChanged(true);
    // Now check that they are all checked.
    assert.deepEqual(refs['CheckListItem-mysql/0'].state, {checked: true});
    assert.deepEqual(refs['CheckListItem-mysql/1'].state, {checked: true});
  });

  it('navigates to the unit when a list item is clicked', function() {
    var units = [{
      displayName: 'mysql/5',
      id: 'mysql/5'
    }];
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <UnitList
        acl={acl}
        changeState={changeState}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        service={service}
        units={units}
        unitStatus={null}
        whenChanged={sinon.stub()} />);
    output.props.children[1].props.children[1].props.action({
      currentTarget: {
        getAttribute: function() {
          return 'mysql/5';
        }
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
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
      <UnitList
        acl={acl}
        changeState={changeState}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        service={service}
        units={units}
        unitStatus={null}
        whenChanged={sinon.stub()} />);
    output.props.children[1].props.children[1].props.action({
      currentTarget: {
        getAttribute: function() {
          return 'wordpress/5';
        }
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
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
      <UnitList
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        service={service}
        units={units}
        whenChanged={sinon.stub()} />);
    var buttonItems = output.props.children[2].props.buttons;
    var buttons = [{
      title: 'Remove',
      type: 'neutral',
      action: buttonItems[0].action,
      disabled: true
    }];
    const expected = (
      <ButtonRow
        buttons={buttons} />);
    expect(output.props.children[2]).toEqualJSX(expected);
  });

  it('displays Resolve and Retry buttons for an error list', function() {
    var units = [{
      displayName: 'mysql/0'
    }];
    var output = jsTestUtils.shallowRender(
      <UnitList
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        service={{}}
        units={units}
        unitStatus='error'
        whenChanged={sinon.stub()} />);
    var buttonItems = output.props.children[2].props.buttons;
    var buttons = [{
      title: 'Resolve',
      type: 'neutral',
      action: buttonItems[0].action,
      disabled: true
    }, {
      title: 'Retry',
      type: 'neutral',
      action: buttonItems[1].action,
      disabled: true
    }, {
      title: 'Remove',
      type: 'neutral',
      action: buttonItems[2].action,
      disabled: true
    }];
    const expected = (
      <ButtonRow
        buttons={buttons} />);
    expect(output.props.children[2]).toEqualJSX(expected);
  });

  it('can remove the selected units', function() {
    var destroyUnits = sinon.stub();
    var changeState = sinon.stub();
    var envResolved = sinon.stub();
    var units = [{
      displayName: 'mysql/0',
      id: 'mysql/0',
      agent_status: 'running'
    }, {
      displayName: 'mysql/1',
      id: 'mysql/1',
      agent_status: 'running'
    }, {
      displayName: 'mysql/2',
      id: 'mysql/2',
      agent_status: 'running'
    }];
    // Have to use renderIntoDocument here as shallowRenderer does not support
    // refs.
    var output = testUtils.renderIntoDocument(
      <UnitList
        acl={acl}
        changeState={changeState}
        destroyUnits={destroyUnits}
        envResolved={envResolved}
        service={service}
        units={units}
        whenChanged={sinon.stub()} />);
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

  it('does not make an RPC call for pending units', function() {
    const destroyUnits = sinon.stub();
    const changeState = sinon.stub();
    const envResolved = sinon.stub();
    const units = [{
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
      <UnitList
        acl={acl}
        changeState={changeState}
        destroyUnits={destroyUnits}
        envResolved={envResolved}
        service={service}
        units={units}
        whenChanged={sinon.stub()} />);
    const checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[1].checked = true;
    testUtils.Simulate.change(checkboxes[1]);
    checkboxes[3].checked = true;
    testUtils.Simulate.change(checkboxes[3]);
    const button = testUtils.findRenderedDOMComponentWithClass(
      output, 'button--neutral');
    testUtils.Simulate.click(button);
    // Remove is still called to remove from ECS.
    assert.equal(destroyUnits.callCount, 1);
    assert.deepEqual(destroyUnits.args[0][0], [units[0].id, units[2].id]);
    // Make sure we mark the unit as resolved so that we can remove it.
    assert.equal(envResolved.callCount, 0);
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
      <UnitList
        acl={acl}
        changeState={changeState}
        destroyUnits={destroyUnits}
        envResolved={sinon.stub()}
        service={service}
        units={units}
        whenChanged={sinon.stub()} />);
    var checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[1].checked = true;
    testUtils.Simulate.change(checkboxes[1]);
    var button = testUtils.findRenderedDOMComponentWithClass(
      output, 'button--neutral');
    testUtils.Simulate.click(button);
    assert.isFalse(output.refs['CheckListItem-' + units[0].id].state.checked);
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
      <UnitList
        acl={acl}
        changeState={changeState}
        destroyUnits={destroyUnits}
        envResolved={sinon.stub()}
        service={service}
        units={units}
        whenChanged={sinon.stub()} />);
    var checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[0].checked = true;
    testUtils.Simulate.change(checkboxes[0]);
    assert.isTrue(output.refs['select-all'].state.checked);
    var button = testUtils.findRenderedDOMComponentWithClass(
      output, 'button--neutral');
    testUtils.Simulate.click(button);
    assert.isFalse(output.refs['CheckListItem-' + units[0].id].state.checked);
    assert.isFalse(output.refs['select-all'].state.checked);
  });

  it('can resolve the selected units', function() {
    var changeState = sinon.stub();
    var envResolved = sinon.stub();
    var units = [{
      displayName: 'mysql/0',
      agent_status: 'running',
      id: 'mysql/0'
    }, {
      displayName: 'mysql/1',
      agent_status: 'running',
      id: 'mysql/1'
    }, {
      displayName: 'mysql/2',
      agent_status: 'running',
      id: 'mysql/2'
    }];
    // Have to use renderIntoDocument here as shallowRenderer does not support
    // refs.
    var output = testUtils.renderIntoDocument(
      <UnitList
        acl={acl}
        changeState={changeState}
        destroyUnits={sinon.stub()}
        envResolved={envResolved}
        service={service}
        units={units}
        unitStatus='error'
        whenChanged={sinon.stub()} />);
    var checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[1].checked = true;
    testUtils.Simulate.change(checkboxes[1]);
    checkboxes[2].checked = true;
    testUtils.Simulate.change(checkboxes[2]);
    var button = testUtils.scryRenderedDOMComponentsWithClass(
      output, 'button--neutral')[0];
    testUtils.Simulate.click(button);
    assert.equal(envResolved.callCount, 2);
    assert.deepEqual(envResolved.args[0][0], units[0].id);
    assert.deepEqual(envResolved.args[0][2], false);
    assert.deepEqual(envResolved.args[1][0], units[1].id);
    assert.deepEqual(envResolved.args[1][2], false);
  });

  it('will not resolve pending units', function() {
    const changeState = sinon.stub();
    const envResolved = sinon.stub();
    const units = [{
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
    const output = testUtils.renderIntoDocument(
      <UnitList
        acl={acl}
        changeState={changeState}
        destroyUnits={sinon.stub()}
        envResolved={envResolved}
        service={service}
        units={units}
        unitStatus='error'
        whenChanged={sinon.stub()} />);
    const checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[1].checked = true;
    testUtils.Simulate.change(checkboxes[1]);
    checkboxes[2].checked = true;
    testUtils.Simulate.change(checkboxes[2]);
    const button = testUtils.scryRenderedDOMComponentsWithClass(
      output, 'button--neutral')[0];
    testUtils.Simulate.click(button);
    assert.equal(envResolved.callCount, 0);
  });

  it('can retry the selected units', function() {
    var changeState = sinon.stub();
    var envResolved = sinon.stub();
    var units = [{
      displayName: 'mysql/0',
      agent_status: 'running',
      id: 'mysql/0'
    }, {
      displayName: 'mysql/1',
      agent_status: 'running',
      id: 'mysql/1'
    }, {
      displayName: 'mysql/2',
      agent_status: 'running',
      id: 'mysql/2'
    }];
    // Have to use renderIntoDocument here as shallowRenderer does not support
    // refs.
    var output = testUtils.renderIntoDocument(
      <UnitList
        acl={acl}
        changeState={changeState}
        destroyUnits={sinon.stub()}
        envResolved={envResolved}
        service={service}
        units={units}
        unitStatus='error'
        whenChanged={sinon.stub()} />);
    var checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[1].checked = true;
    testUtils.Simulate.change(checkboxes[1]);
    checkboxes[2].checked = true;
    testUtils.Simulate.change(checkboxes[2]);
    var button = testUtils.scryRenderedDOMComponentsWithClass(
      output, 'button--neutral')[1];
    testUtils.Simulate.click(button);
    assert.equal(envResolved.callCount, 2);
    assert.deepEqual(envResolved.args[0][0], units[0].id);
    assert.deepEqual(envResolved.args[0][2], true);
    assert.deepEqual(envResolved.args[1][0], units[1].id);
    assert.deepEqual(envResolved.args[1][2], true);
  });

  it('won\'t retry pending units', function() {
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
      agent_status: 'running',
      id: 'mysql/2'
    }];
    // Have to use renderIntoDocument here as shallowRenderer does not support
    // refs.
    var output = testUtils.renderIntoDocument(
      <UnitList
        acl={acl}
        changeState={changeState}
        destroyUnits={sinon.stub()}
        envResolved={envResolved}
        service={service}
        units={units}
        unitStatus='error'
        whenChanged={sinon.stub()} />);
    var checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[1].checked = true;
    testUtils.Simulate.change(checkboxes[1]);
    checkboxes[2].checked = true;
    testUtils.Simulate.change(checkboxes[2]);
    var button = testUtils.scryRenderedDOMComponentsWithClass(
      output, 'button--neutral')[1];
    testUtils.Simulate.click(button);
    assert.equal(envResolved.callCount, 0);
  });

  it('can disable controls when read only', () => {
    acl.isReadOnly = sinon.stub().returns(true);
    var units = [{
      displayName: 'mysql/0',
      id: 'mysql/0'
    }, {
      displayName: 'mysql/1',
      id: 'mysql/1'
    }];
    var renderer = jsTestUtils.shallowRender(
      <UnitList
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        service={service}
        units={units}
        whenChanged={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var children = output.props.children[1].props.children;
    var refs = [
      'CheckListItem-' + units[0].id,
      'CheckListItem-' + units[1].id
    ];
    const list = (
      <ul className="unit-list__units">
        {[<CheckListItem
          aside="2"
          className="select-all"
          disabled={true}
          key="select-all"
          label="Select all units"
          ref="select-all"
          whenChanged={children[0].props.whenChanged} />,
        <CheckListItem
          action={children[1].props.action}
          disabled={true}
          extraInfo={undefined}
          id="mysql/0"
          key={units[0].displayName}
          label={units[0].displayName}
          ref={refs[0]}
          whenChanged={instance._updateActiveCount} />,
        <CheckListItem
          action={children[2].props.action}
          disabled={true}
          extraInfo={undefined}
          id="mysql/1"
          key={units[1].displayName}
          label={units[1].displayName}
          ref={refs[1]}
          whenChanged={instance._updateActiveCount} />]}
      </ul>);
    expect(output.props.children[1]).toEqualJSX(list);
    var buttonItems = output.props.children[2].props.buttons;
    var buttons = [{
      disabled: true,
      title: 'Remove',
      type: 'neutral',
      action: buttonItems[0].action,
      disabled: true
    }];
    const expected = (
      <ButtonRow
        buttons={buttons} />);
    expect(output.props.children[2]).toEqualJSX(expected);
  });
});
