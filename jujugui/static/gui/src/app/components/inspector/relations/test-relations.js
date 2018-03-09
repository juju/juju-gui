/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorRelations = require('./relations');
const CheckListItem = require('../../check-list-item/check-list-item');
const ButtonRow = require('../../button-row/button-row');
const OverviewAction = require('../overview-action/overview-action');

const jsTestUtils = require('../../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('InspectorRelations', function() {
  var acl, service;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    service = {get: sinon.stub().withArgs('id').returns('ghost')};
  });

  it('can render the relations list', function() {
    var changeState = sinon.stub();
    var relations = [{
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
    var renderer = jsTestUtils.shallowRender(
      <InspectorRelations
        acl={acl}
        changeState={changeState}
        destroyRelations={sinon.stub()}
        service={service}
        serviceRelations={relations} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var buttons = [];
    buttons.push({
      title: 'Remove',
      type: 'neutral',
      action: instance._handleRemoveRelation,
      disabled: true
    });
    var expected = (<div className="inspector-relations">
      <div className="inspector-relations__actions">
        <OverviewAction
          action={output.props.children[0].props.children.props.action}
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
          whenChanged={
            output.props.children[1].props.children[0].props.whenChanged
          } />
        <CheckListItem
          action={output.props.children[1].props.children[1].props.action}
          disabled={false}
          key={relations[0].id}
          label={'django:django'}
          ref='CheckListItem-mysql'
          whenChanged={instance._updateActiveCount} />
        <CheckListItem
          action={output.props.children[1].props.children[2].props.action}
          disabled={false}
          key={relations[1].id}
          label={'django:django'}
          ref='CheckListItem-postgresql'
          whenChanged={instance._updateActiveCount} />
      </ul>
      <ButtonRow
        buttons={buttons} />
    </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can show relation details on click', function() {
    var changeState = sinon.stub();
    var relations = [{
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
    }];
    var renderer = jsTestUtils.shallowRender(
      <InspectorRelations
        acl={acl}
        changeState={changeState}
        destroyRelations={sinon.stub()}
        service={service}
        serviceRelations={relations} />, true);
    var output = renderer.getRenderOutput();
    output.props.children[1].props.children[1].props.action();
    assert.deepEqual(changeState.args[0][0].gui.inspector, {
      activeComponent: 'relation',
      relation: '0'
    });
  });

  it('can disable the controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var changeState = sinon.stub();
    var relations = [
      {id: 'mysql',
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
      },
      {id: 'postgresql',
        near: {
          name: 'pgsql',
          role: 'primary'
        },
        far: {
          name: 'django',
          serviceName: 'django'
        },
        interface: 'postgresql',
        scope: 'global'}
    ];
    var renderer = jsTestUtils.shallowRender(
      <InspectorRelations
        acl={acl}
        changeState={changeState}
        destroyRelations={sinon.stub()}
        service={service}
        serviceRelations={relations} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var buttons = [];
    buttons.push({
      title: 'Remove',
      type: 'neutral',
      action: instance._handleRemoveRelation,
      disabled: true
    });
    var expected = (<div className="inspector-relations">
      <div className="inspector-relations__actions">
        <OverviewAction
          action={output.props.children[0].props.children.props.action}
          icon="plus_box_16"
          title="Build a relation" />
      </div>
      <ul className="inspector-relations__list">
        <CheckListItem
          className='select-all'
          disabled={true}
          key='select-all1'
          label='Select all relations'
          ref='select-all'
          whenChanged={
            output.props.children[1].props.children[0].props.whenChanged
          } />
        <CheckListItem
          action={output.props.children[1].props.children[1].props.action}
          disabled={true}
          key={relations[0].id}
          label={'django:django'}
          ref='CheckListItem-mysql'
          whenChanged={instance._updateActiveCount} />
        <CheckListItem
          action={output.props.children[1].props.children[2].props.action}
          disabled={true}
          key={relations[1].id}
          label={'django:django'}
          ref='CheckListItem-postgresql'
          whenChanged={instance._updateActiveCount} />
      </ul>
      <ButtonRow
        buttons={buttons} />
    </div>);
    expect(output).toEqualJSX(expected);
  });

  it('renders if there are no relations', () => {
    var output = jsTestUtils.shallowRender(
      <InspectorRelations
        acl={acl}
        changeState={sinon.stub()}
        destroyRelations={sinon.stub()}
        service={service}
        serviceRelations={[]} />);
    var expected = (<li className="inspector-relations__message">
            No active relations for this application.
    </li>);
    assert.deepEqual(output.props.children[1].props.children,
      expected);
  });

  it('propagates select-all to all relations', () => {
    var relations = [
      {id: 'mysql',
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
      },
      {id: 'postgresql',
        near: {
          name: 'pgsql',
          role: 'primary'
        },
        far: {
          name: 'django',
          serviceName: 'django'
        },
        interface: 'postgresql',
        scope: 'global'}
    ];
    // shallowRenderer doesn't support state so need to render it.
    var component = testUtils.renderIntoDocument(
      <InspectorRelations
        acl={acl}
        changeState={sinon.stub()}
        destroyRelations={sinon.stub()}
        service={service}
        serviceRelations={relations} />);
    var refs = component.refs;
    // We want to make sure that they are not checked first.
    assert.deepEqual(refs['CheckListItem-mysql'].state,
      {checked: false});
    assert.deepEqual(refs['CheckListItem-postgresql'].state,
      {checked: false});
    // Activate the select all toggle.
    refs['select-all'].props.whenChanged(true);
    // Now check that they are all checked.
    assert.deepEqual(refs['CheckListItem-mysql'].state,
      {checked: true});
    assert.deepEqual(refs['CheckListItem-postgresql'].state,
      {checked: true});
  });

  it('displays a disabled remove button when none selected', function() {
    var relations = [
      {id: 'mysql',
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
      }
    ];
    var output = jsTestUtils.shallowRender(
      <InspectorRelations
        acl={acl}
        changeState={sinon.stub()}
        destroyRelations={sinon.stub()}
        service={service}
        serviceRelations={relations} />);
    var buttonItems = output.props.children[2].props.buttons;
    var buttons = [{
      title: 'Remove',
      type: 'neutral',
      action: buttonItems[0].action,
      disabled: true
    }];
    assert.deepEqual(output.props.children[2],
      <ButtonRow
        buttons={buttons} />);
    assert.equal(buttonItems.length, 1);
  });

  it('can remove the selected relations', function() {
    var destroyRelations = sinon.stub();
    var changeState = sinon.stub();
    var relations = [
      {id: 'mysql',
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
      },
      {id: 'postgresql',
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
      },
      {id: 'apache2',
        near: {
          name: 'apache',
          role: 'primary'
        },
        far: {
          name: 'wordpress',
          serviceName: 'website'
        },
        interface: 'none',
        scope: 'global'}
    ];
    // Have to use renderIntoDocument here as shallowRenderer does not support
    // refs.
    var output = testUtils.renderIntoDocument(
      <InspectorRelations
        acl={acl}
        changeState={changeState}
        destroyRelations={destroyRelations}
        service={service}
        serviceRelations={relations} />);
    var checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[1].checked = true;
    testUtils.Simulate.change(checkboxes[1]);
    checkboxes[3].checked = true;
    testUtils.Simulate.change(checkboxes[3]);
    var button = testUtils.findRenderedDOMComponentWithClass(
      output, 'button--neutral');
    testUtils.Simulate.click(button);
    assert.equal(destroyRelations.callCount, 1);
    assert.deepEqual(destroyRelations.args[0][0],
      [relations[0].id, relations[2].id]);
  });

  it('deselects all relations after removal', function() {
    var destroyRelations = sinon.stub();
    var changeState = sinon.stub();
    var relations = [
      {id: 'mysql',
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
      }
    ];
    // Have to use renderIntoDocument here as shallowRenderer does not support
    // refs.
    var output = testUtils.renderIntoDocument(
      <InspectorRelations
        acl={acl}
        changeState={changeState}
        destroyRelations={destroyRelations}
        service={service}
        serviceRelations={relations} />);
    var checkboxes = testUtils.scryRenderedDOMComponentsWithTag(
      output, 'input');
    checkboxes[1].checked = true;
    testUtils.Simulate.change(checkboxes[1]);
    var button = testUtils.findRenderedDOMComponentWithClass(
      output, 'button--neutral');
    testUtils.Simulate.click(button);
    assert.isFalse(
      output.refs['CheckListItem-' + relations[0].id].state.checked
    );
  });

  it('navigates to show build relation on build-relation click', function() {
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <InspectorRelations
        acl={acl}
        changeState={changeState}
        destroyRelations={sinon.stub()}
        service={service}
        serviceRelations={[]} />);
    // Call the action for the create realtion button.
    output.props.children[0].props.children.props.action();
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'ghost',
          activeComponent: 'relate-to'
        }}});
  });

});
