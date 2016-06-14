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

describe('InspectorRelations', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-relations', function() { done(); });
  });

  it('can render the relations list', function() {
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
        <juju.components.InspectorRelations
          changeState={changeState}
          destroyRelations={sinon.stub()}
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
      <ul className="inspector-relations__list">
        <juju.components.CheckListItem
          className='select-all'
          key='select-all1'
          ref='select-all'
          label='Select all relations'
          whenChanged={
            output.props.children[0].props.children[0].props.whenChanged
          }/>
        <juju.components.CheckListItem
          action={output.props.children[0].props.children[1].props.action}
          label={'django:django'}
          key={relations[0].id}
          ref='CheckListItem-mysql'
          relation={relations[0]}
          changeState={changeState}
          whenChanged={instance._updateActiveCount} />
        <juju.components.CheckListItem
          action={output.props.children[0].props.children[2].props.action}
          label={'django:django'}
          key={relations[1].id}
          ref='CheckListItem-postgresql'
          relation={relations[1]}
          changeState={changeState}
          whenChanged={instance._updateActiveCount} />
      </ul>
      <juju.components.ButtonRow
        buttons={buttons} />
    </div>);
    assert.deepEqual(output, expected);
  });

  it('renders if there are no relations', () => {
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorRelations
          changeState={sinon.stub()}
          destroyRelations={sinon.stub()}
          serviceRelations={[]} />);
    var expected = (<li className="inspector-relations__message">
            No active relations for this application.
          </li>);
    assert.deepEqual(output.props.children[0].props.children,
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
      <juju.components.InspectorRelations
        changeState={sinon.stub()}
        destroyRelations={sinon.stub()}
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
        <juju.components.InspectorRelations
          changeState={sinon.stub()}
          destroyRelations={sinon.stub()}
          serviceRelations={relations} />);
    var buttonItems = output.props.children[1].props.buttons;
    var buttons = [{
      title: 'Remove',
      type: 'neutral',
      action: buttonItems[0].action,
      disabled: true
    }];
    assert.deepEqual(output.props.children[1],
      <juju.components.ButtonRow
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
        <juju.components.InspectorRelations
          destroyRelations={destroyRelations}
          serviceRelations={relations}
          changeState={changeState} />);
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
      <juju.components.InspectorRelations
        destroyRelations={destroyRelations}
        serviceRelations={relations}
        changeState={changeState} />);
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

});
