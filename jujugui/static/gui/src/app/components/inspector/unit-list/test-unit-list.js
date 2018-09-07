'use strict';

const React = require('react');
const enzyme = require('enzyme');

const UnitList = require('./unit-list');
const CheckListItem = require('../../check-list-item/check-list-item');
const OverviewAction = require('../overview-action/overview-action');

describe('UnitList', () => {
  var acl, refs, service, units;

  const renderComponent = (options = {}) => {
    const wrapper = enzyme.shallow(
      <UnitList
        acl={options.acl || acl}
        changeState={options.changeState || sinon.stub()}
        destroyUnits={options.destroyUnits || sinon.stub()}
        envResolved={options.envResolved || sinon.stub()}
        service={options.service || service}
        units={options.units || units}
        unitStatus={options.unitStatus}
        whenChanged={options.whenChanged || sinon.stub()} />
    );
    const instance = wrapper.instance();
    instance.refs = refs;
    return wrapper;
  };

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    service = {
      get: sinon.stub()
    };
    service.get.withArgs('subordinate').returns(false);
    service.get.withArgs('id').returns('mysql');
    units = [{
      displayName: 'mysql/0',
      id: 'mysql/0'
    }, {
      displayName: 'mysql/1',
      id: 'mysql/1'
    }, {
      displayName: 'mysql/2',
      id: 'mysql/2'
    }];
    refs = {
      'select-all': {
        setState: sinon.stub(),
        state: {
          checked: false
        }
      },
      'select-all-0': {
        setState: sinon.stub(),
        state: {
          checked: false
        }
      },
      'CheckListItem-mysql/0': {
        setState: sinon.stub(),
        state: {
          checked: true
        }
      },
      'CheckListItem-mysql/1': {
        setState: sinon.stub(),
        state: {
          checked: false
        }
      },
      'CheckListItem-mysql/2': {
        setState: sinon.stub(),
        state: {
          checked: true
        }
      }
    };
  });

  it('renders if there are no units', () => {
    const wrapper = renderComponent({ units: [] });
    var expected = (
      <div className="unit-list">
        <div className="unit-list__actions">
          <OverviewAction
            action={wrapper.find('OverviewAction').prop('action')}
            icon="plus_box_16"
            title="Scale application" />
        </div>
        <div className="unit-list__message">
          No units for this application. Scale to add units.
        </div>
        {undefined}
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('renders a list of unit components', () => {
    units.pop();
    const wrapper = renderComponent({ units });
    const items = wrapper.find('CheckListItem');
    const expected = (
      <ul className="unit-list__units">
        {[<CheckListItem
          aside="2"
          className="select-all"
          disabled={false}
          key="select-all"
          label="Select all units"
          ref="select-all"
          whenChanged={items.at(0).prop('whenChanged')} />,
        <CheckListItem
          action={items.at(1).prop('action')}
          disabled={false}
          extraInfo={undefined}
          id="mysql/0"
          key={units[0].displayName}
          label={units[0].displayName}
          whenChanged={items.at(1).prop('whenChanged')} />,
        <CheckListItem
          action={items.at(2).prop('action')}
          disabled={false}
          extraInfo={undefined}
          id="mysql/1"
          key={units[1].displayName}
          label={units[1].displayName}
          whenChanged={items.at(2).prop('whenChanged')} />]}
      </ul>);
    assert.compareJSX(wrapper.find('.unit-list__units'), expected);
  });

  it('renders a grouped list of error unit components', () => {
    units.pop();
    units[0].agent_state_info = 'hook failed: install';
    units[1].agent_state_info = 'hook failed: config-changed';
    const wrapper = renderComponent({
      unitStatus: 'error'
    });
    const items = wrapper.find('CheckListItem');
    const expected = (
      <ul className="unit-list__units">
        {[<CheckListItem
          aside="1"
          className="select-all"
          disabled={false}
          key="select-all-0"
          label="hook failed: install"
          whenChanged={items.at(0).prop('whenChanged')} />,
        <CheckListItem
          action={items.at(1).prop('action')}
          disabled={false}
          extraInfo={undefined}
          id="mysql/0"
          key={units[0].displayName}
          label={units[0].displayName}
          whenChanged={items.at(1).prop('whenChanged')} />,
        <CheckListItem
          aside="1"
          className="select-all"
          disabled={false}
          key="select-all-1"
          label="hook failed: config-changed"
          whenChanged={items.at(2).prop('whenChanged')} />,
        <CheckListItem
          action={items.at(3).prop('action')}
          disabled={false}
          extraInfo={undefined}
          id="mysql/1"
          key={units[1].displayName}
          label={units[1].displayName}
          whenChanged={items.at(3).prop('whenChanged')} />]}
      </ul>);
    assert.compareJSX(wrapper.find('.unit-list__units'), expected);
  });

  it('does not show the scaling link when read only', () => {
    acl.isReadOnly.returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.unit-list__actions').length, 0);
  });

  it('renders the Scale Application action component', () => {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.unit-list__actions').length, 1);
  });

  it('does not render the actions when viewing a status list', () => {
    const wrapper = renderComponent({ unitStatus: 'pending' });
    assert.equal(wrapper.find('.unit-list__actions').length, 0);
  });

  it('does not render the actions when viewing a subordinate', () => {
    service.get.withArgs('subordinate').returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.unit-list__actions').length, 0);
  });

  it('propagates select-all to all children', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    // Activate the select all toggle.
    wrapper.find('CheckListItem').at(0).props().whenChanged(true);
    // Now check that they are all checked.
    assert.equal(instance.refs['CheckListItem-mysql/0'].setState.callCount, 1);
    assert.deepEqual(
      instance.refs['CheckListItem-mysql/0'].setState.args[0][0], {checked: true});
    assert.equal(instance.refs['CheckListItem-mysql/1'].setState.callCount, 1);
    assert.deepEqual(
      instance.refs['CheckListItem-mysql/1'].setState.args[0][0], {checked: true});
  });

  it('navigates to the unit when a list item is clicked', function() {
    var changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper.find('CheckListItem').at(1).props().action({
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

  it('only displays a remove button for a non-error list', function() {
    const wrapper = renderComponent();
    const buttonItems = wrapper.find('ButtonRow').prop('buttons');
    var buttons = [{
      title: 'Remove',
      type: 'neutral',
      action: buttonItems[0].action,
      disabled: true
    }];
    assert.deepEqual(buttonItems, buttons);
  });

  it('displays Resolve and Retry buttons for an error list', function() {
    const wrapper = renderComponent({ unitStatus: 'error' });
    const buttonItems = wrapper.find('ButtonRow').prop('buttons');
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
    assert.deepEqual(buttonItems, buttons);
  });

  it('can remove the selected units', function() {
    var destroyUnits = sinon.stub();
    var envResolved = sinon.stub();
    units[0].agent_status = 'running';
    units[1].agent_status = 'running';
    units[2].agent_status = 'running';
    const wrapper = renderComponent({
      destroyUnits,
      envResolved
    });
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    assert.equal(destroyUnits.callCount, 1);
    assert.deepEqual(destroyUnits.args[0][0], [units[0].id, units[2].id]);
    // Make sure we mark the unit as resolved so that we can remove it.
    assert.equal(envResolved.callCount, 2);
  });

  it('does not make an RPC call for pending units', function() {
    const destroyUnits = sinon.stub();
    const envResolved = sinon.stub();
    const wrapper = renderComponent({
      destroyUnits,
      envResolved
    });
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    // Remove is still called to remove from ECS.
    assert.equal(destroyUnits.callCount, 1);
    assert.deepEqual(destroyUnits.args[0][0], [units[0].id, units[2].id]);
    // Make sure we mark the unit as resolved so that we can remove it.
    assert.equal(envResolved.callCount, 0);
  });

  it('deselects all units after removal', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    assert.equal(instance.refs['CheckListItem-mysql/0'].setState.callCount, 1);
    assert.deepEqual(
      instance.refs['CheckListItem-mysql/0'].setState.args[0][0], {checked: false});
  });

  it('deselects select all after removal', function() {
    refs['select-all'].state.checked = true;
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    assert.equal(instance.refs['select-all'].setState.callCount, 1);
    assert.deepEqual(
      instance.refs['select-all'].setState.args[0][0], {checked: false});
  });

  it('can resolve the selected units', function() {
    var envResolved = sinon.stub();
    units[0].agent_status = 'running';
    units[1].agent_status = 'running';
    units[2].agent_status = 'running';
    const wrapper = renderComponent({ envResolved });
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    assert.equal(envResolved.callCount, 2);
    assert.deepEqual(envResolved.args[0][0], units[0].id);
    assert.deepEqual(envResolved.args[0][2], false);
    assert.deepEqual(envResolved.args[1][0], units[2].id);
    assert.deepEqual(envResolved.args[1][2], false);
  });

  it('will not resolve pending units', function() {
    const envResolved = sinon.stub();
    const wrapper = renderComponent({ envResolved });
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    assert.equal(envResolved.callCount, 0);
  });

  it('can retry the selected units', function() {
    var envResolved = sinon.stub();
    units[0].agent_status = 'running';
    units[1].agent_status = 'running';
    units[2].agent_status = 'running';
    const wrapper = renderComponent({
      envResolved,
      unitStatus: 'error'
    });
    wrapper.find('ButtonRow').prop('buttons')[1].action();
    assert.equal(envResolved.callCount, 2);
    assert.deepEqual(envResolved.args[0][0], units[0].id);
    assert.deepEqual(envResolved.args[0][2], true);
    assert.deepEqual(envResolved.args[1][0], units[2].id);
    assert.deepEqual(envResolved.args[1][2], true);
  });

  it('won\'t retry pending units', function() {
    var envResolved = sinon.stub();
    const wrapper = renderComponent({
      envResolved,
      unitStatus: 'error'
    });
    wrapper.find('ButtonRow').prop('buttons')[1].action();
    assert.equal(envResolved.callCount, 0);
  });

  it('can disable controls when read only', () => {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('ButtonRow').prop('buttons')[0].disabled, true);
    wrapper.find('CheckListItem').forEach(item => {
      assert.equal(item.prop('disabled'), true);
    });
  });
});
