/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const InspectorRelations = require('./relations');
const CheckListItem = require('../../check-list-item/check-list-item');
const ButtonRow = require('../../button-row/button-row');
const OverviewAction = require('../overview-action/overview-action');

describe('InspectorRelations', function() {
  var acl, service, serviceRelations;

  const renderComponent = (options = {}) => enzyme.shallow(
    <InspectorRelations
      acl={options.acl || acl}
      changeState={options.changeState || sinon.stub()}
      destroyRelations={options.destroyRelations || sinon.stub()}
      service={options.service || service}
      serviceRelations={options.serviceRelations || serviceRelations} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    service = {get: sinon.stub().withArgs('id').returns('ghost')};
    serviceRelations = [{
      id: 'mysql',
      near: {
        name: 'mysql',
        role: 'primary'
      },
      far: {
        name: 'django',
        serviceName: 'django'
      },
      interface: 'postgresql',
      scope: 'global'
    }, {
      id: 'postgresql',
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
    }, {
      id: 'peer-relation',
      near: {
        name: 'self',
        serviceName: 'referential',
        role: 'peer'
      },
      interface: 'some-interface',
      scope: 'global'
    }];
  });

  it('can render the relations list', function() {
    const wrapper = renderComponent();
    var buttons = [];
    buttons.push({
      title: 'Remove',
      type: 'neutral',
      action: wrapper.find('ButtonRow').prop('buttons')[0].action,
      disabled: true
    });
    const items = wrapper.find('CheckListItem');
    var expected = (<div className="inspector-relations">
      <div className="inspector-relations__actions">
        <OverviewAction
          action={wrapper.find('OverviewAction').prop('action')}
          icon="plus_box_16"
          title="Build a relation" />
      </div>
      <ul className="inspector-relations__list">
        <CheckListItem
          className='select-all'
          disabled={false}
          key='select-all1'
          label='Select all relations'
          ref='select-all'
          whenChanged={items.at(0).prop('whenChanged')} />
        <CheckListItem
          action={items.at(1).prop('action')}
          disabled={false}
          key={serviceRelations[0].id}
          label={'django:django'}
          ref='CheckListItem-mysql'
          whenChanged={items.at(1).prop('whenChanged')} />
        <CheckListItem
          action={items.at(2).prop('action')}
          disabled={false}
          key={serviceRelations[1].id}
          label={'django:django'}
          ref='CheckListItem-postgresql'
          whenChanged={items.at(2).prop('whenChanged')} />
      </ul>
      <ButtonRow
        buttons={buttons} />
    </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can show relation details on click', function() {
    var changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper.find('CheckListItem').at(1).props().action();
    assert.deepEqual(changeState.args[0][0].gui.inspector, {
      activeComponent: 'relation',
      relation: '0'
    });
  });

  it('can disable the controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('ButtonRow').prop('buttons')[0].disabled, true);
    wrapper.find('CheckListItem').forEach(item => {
      assert.equal(item.prop('disabled'), true);
    });
  });

  it('renders if there are no relations', () => {
    const wrapper = renderComponent({ serviceRelations: [] });
    assert.equal(
      wrapper.find('.inspector-relations__message').text(),
      'No active relations for this application.');
  });

  it('propagates select-all to all relations', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = {
      'CheckListItem-mysql': {
        setState: sinon.stub()
      },
      'CheckListItem-postgresql': {
        setState: sinon.stub()
      }
    };
    // Activate the select all toggle.
    wrapper.find('CheckListItem').at(0).props().whenChanged(true);
    // Now check that they are all checked.
    assert.equal(instance.refs['CheckListItem-mysql'].setState.callCount, 1);
    assert.deepEqual(instance.refs['CheckListItem-mysql'].setState.args[0][0],
      {checked: true});
    assert.equal(instance.refs['CheckListItem-postgresql'].setState.callCount, 1);
    assert.deepEqual(instance.refs['CheckListItem-postgresql'].setState.args[0][0],
      {checked: true});
  });

  it('displays a disabled remove button when none selected', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('ButtonRow').prop('buttons')[0].disabled, true);
  });

  it('can remove the selected relations', function() {
    var destroyRelations = sinon.stub();
    const wrapper = renderComponent({ destroyRelations });
    const instance = wrapper.instance();
    instance.refs = {
      'CheckListItem-mysql': {
        setState: sinon.stub(),
        state: {
          checked: true
        }
      },
      'CheckListItem-peer-relation': {
        setState: sinon.stub(),
        state: {
          checked: true
        }
      }
    };
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    assert.equal(destroyRelations.callCount, 1);
    assert.deepEqual(destroyRelations.args[0][0],
      [serviceRelations[0].id, serviceRelations[2].id]);
  });

  it('deselects all relations after removal', function() {
    var destroyRelations = sinon.stub();
    const wrapper = renderComponent({ destroyRelations });
    const instance = wrapper.instance();
    instance.refs = {
      'CheckListItem-mysql': {
        setState: sinon.stub(),
        state: {
          checked: true
        }
      },
      'CheckListItem-peer-relation': {
        setState: sinon.stub(),
        state: {
          checked: true
        }
      }
    };
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    assert.equal(instance.refs['CheckListItem-mysql'].setState.callCount, 1);
    assert.deepEqual(instance.refs['CheckListItem-mysql'].setState.args[0][0],
      {checked: false});
    assert.equal(instance.refs['CheckListItem-peer-relation'].setState.callCount, 1);
    assert.deepEqual(instance.refs['CheckListItem-peer-relation'].setState.args[0][0],
      {checked: false});
  });

  it('navigates to show build relation on build-relation click', function() {
    var changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    // Call the action for the create relation button.
    wrapper.find('OverviewAction').props().action();
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'ghost',
          activeComponent: 'relate-to'
        }}});
  });

});
