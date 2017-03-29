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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('EnvList', function() {

  const humanizeTimestamp = sinon.stub().returns('less than a minute ago');
  const acl = {canAddModels: sinon.stub().returns(true)};

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('env-list', function() { done(); });
  });

  it('renders a list of models', function() {
    const models = [
      {
        uuid: 'model-uuid-1',
        name: 'model-name-1',
        owner: 'who@external',
        lastConnection: {a: 0, getTime: function() {}}
      },
      {
        uuid: 'model-uuid-2',
        name: 'model-name-2',
        owner: 'dalek@external',
        lastConnection: {a: 1, getTime: function() {}}
      }
    ];
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EnvList
        acl={acl}
        authDetails={{user: 'who@external', rootUserName: 'who'}}
        changeState={sinon.stub()}
        environmentName="model-name-1"
        envs={models}
        handleModelClick={sinon.stub()}
        humanizeTimestamp={humanizeTimestamp}
        switchModel={sinon.stub()}
      />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expectedOutput = [
      <li className="env-list__environment"
        role="menuitem"
        tabIndex="0"
        data-id={models[1].uuid}
        data-name={models[1].name}
        data-owner={models[1].owner}
        onClick={instance._handleModelClick}
        key={models[1].uuid}>
        {'dalek/model-name-2'}
        <div className="env-list__last-connected">
          {'Last accessed less than a minute ago'}
        </div>
      </li>
    ];
    assert.deepEqual(output.props.children[0].props.children, expectedOutput);
  });

  it('orders the model list, and handles never connected ones', function() {
    const models = [
      {
        uuid: 'model-uuid-1',
        name: 'model-name-1',
        owner: 'who@external',
        lastConnection: {a: 0, getTime: () => 0}
      },
      {
        uuid: 'model-uuid-2',
        name: 'model-name-2',
        owner: 'dalek@external',
        lastConnection: {a: 1, getTime: () => 1}
      },
      {
        uuid: 'model-uuid-3',
        name: 'model-name-3',
        owner: 'who@external',
        lastConnection: {a: 2, getTime: () => 2}
      },
      {
        uuid: 'model-uuid-4',
        name: 'model-name-4',
        owner: 'dalek@external',
      }
    ];
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EnvList
        acl={acl}
        authDetails={{user: 'who@external', rootUserName: 'who'}}
        changeState={sinon.stub()}
        environmentName="model-name-1"
        envs={models}
        handleModelClick={sinon.stub()}
        humanizeTimestamp={humanizeTimestamp}
        switchModel={sinon.stub()}
      />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expectedOutput = [
      <li className="env-list__environment"
        role="menuitem"
        tabIndex="0"
        data-id={models[3].uuid}
        data-name={models[3].name}
        data-owner={models[3].owner}
        onClick={instance._handleModelClick}
        key={models[3].uuid}>
        {'dalek/model-name-4'}
        <div className="env-list__last-connected">
          {'Never accessed'}
        </div>
      </li>,
      <li className="env-list__environment"
        role="menuitem"
        tabIndex="0"
        data-id={models[2].uuid}
        data-name={models[2].name}
        data-owner={models[2].owner}
        onClick={instance._handleModelClick}
        key={models[2].uuid}>
        {'model-name-3'}
        <div className="env-list__last-connected">
          {'Last accessed less than a minute ago'}
        </div>
      </li>,
      <li className="env-list__environment"
        role="menuitem"
        tabIndex="0"
        data-id={models[1].uuid}
        data-name={models[1].name}
        data-owner={models[1].owner}
        onClick={instance._handleModelClick}
        key={models[1].uuid}>
        {'dalek/model-name-2'}
        <div className="env-list__last-connected">
          {'Last accessed less than a minute ago'}
        </div>
      </li>
    ];
    assert.deepEqual(output.props.children[0].props.children, expectedOutput);
  });

  it('handles local model owners', function() {
    const models = [
      {
        uuid: 'model-uuid-1',
        name: 'model-name-1',
        owner: 'who',
        lastConnection: {a: 0, getTime: function() {}}
      },
      {
        uuid: 'model-uuid-2',
        name: 'model-name-2',
        owner: 'dalek',
        lastConnection: {a: 1, getTime: function() {}}
      }
    ];
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EnvList
        acl={acl}
        authDetails={{user: 'who@local', rootUserName: 'who'}}
        changeState={sinon.stub()}
        environmentName="model-name-1"
        envs={models}
        handleModelClick={sinon.stub()}
        humanizeTimestamp={humanizeTimestamp}
        switchModel={sinon.stub()}
      />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children[0].props.children, [
      <li className="env-list__environment"
        role="menuitem"
        tabIndex="0"
        data-id={models[1].uuid}
        data-name={models[1].name}
        data-owner={models[1].owner}
        onClick={instance._handleModelClick}
        key={models[1].uuid}>
        {'dalek/model-name-2'}
        <div className="env-list__last-connected">
          {'Last accessed less than a minute ago'}
        </div>
      </li>
    ]);
  });

  it('displays only the create new button if there are no models', function() {
    const output = jsTestUtils.shallowRender(
      <juju.components.EnvList
        acl={acl}
        authDetails={{user: 'who@external', rootUserName: 'who'}}
        envs={[]}
        humanizeTimestamp={humanizeTimestamp}
        handleModelClick={sinon.stub()} />);
    assert.deepEqual(output.props.children[0].props.children, false);
  });

  it('clicking a model calls the handleModelClick prop', function() {
    const models = [{uuid: 'abc123', name: 'the name', owner: 'who@external'}];
    const handleModelClick = sinon.stub();
    const getAttribute = sinon.stub();
    getAttribute.withArgs('data-id').returns('abc123');
    getAttribute.withArgs('data-name').returns('the name');
    getAttribute.withArgs('data-owner').returns('who@external');
    const output = jsTestUtils.shallowRender(
      <juju.components.EnvList
        acl={acl}
        authDetails={{user: 'who@external', rootUserName: 'who'}}
        envs={models}
        humanizeTimestamp={humanizeTimestamp}
        handleModelClick={handleModelClick} />);
    output.props.children[0].props.children[0].props.onClick({
      currentTarget: {
        getAttribute: getAttribute
      }
    });
    assert.equal(handleModelClick.callCount, 1);
  });

  it('new model call is made when clicking on buttonRow button', function() {
    const switchModel = sinon.stub();
    const models = [{uuid: 'abc123', name: 'the name', owner: 'who@external'}];
    const component = testUtils.renderIntoDocument(
      <juju.components.EnvList
        acl={acl}
        authDetails={{user: 'who@external', rootUserName: 'who'}}
        changeState={sinon.stub()}
        envs={models}
        humanizeTimestamp={humanizeTimestamp}
        handleModelClick={sinon.stub()}
        switchModel={switchModel} />);
    testUtils.Simulate.click(
        ReactDOM.findDOMNode(component)
                .querySelector('.button--neutral'));
    assert.equal(switchModel.callCount, 1);
  });

  it('new model is not made when user has incorrect permissions', () => {
    const switchModel = sinon.stub();
    const models = [{uuid: 'abc123', name: 'the name', owner: 'who@external'}];
    const _acl = {canAddModels: sinon.stub().returns(false)};
    const component = testUtils.renderIntoDocument(
      <juju.components.EnvList
        acl={_acl}
        authDetails={{user: 'who@external', rootUserName: 'who'}}
        changeState={sinon.stub()}
        envs={models}
        humanizeTimestamp={humanizeTimestamp}
        handleModelClick={sinon.stub()}
        switchModel={switchModel} />);
    testUtils.Simulate.click(
        ReactDOM.findDOMNode(component)
                .querySelector('.button--neutral'));
    assert.equal(switchModel.callCount, 0);
  });
});
