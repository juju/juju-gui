/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const EnvList = require('./list');

const jsTestUtils = require('../../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('EnvList', function() {

  const humanizeTimestamp = sinon.stub().returns('less than a minute ago');
  const acl = {canAddModels: sinon.stub().returns(true)};

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
      <EnvList
        acl={acl}
        changeState={sinon.stub()}
        environmentName="model-name-1"
        envs={models}
        handleModelClick={sinon.stub()}
        humanizeTimestamp={humanizeTimestamp}
        switchModel={sinon.stub()}
        user={{username: 'who@external', displayName: 'who'}}
      />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expectedOutput = (
      <ul className="env-list"
        role="menubar"
        id="environmentSwitcherMenu"
        aria-expanded="true"
        aria-hidden="false"
        aria-labelledby="environmentSwitcherToggle">
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
      </ul>);
    expect(output.props.children[0]).toEqualJSX(expectedOutput);
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
        owner: 'dalek@external'
      }
    ];
    const renderer = jsTestUtils.shallowRender(
      <EnvList
        acl={acl}
        changeState={sinon.stub()}
        environmentName="model-name-1"
        envs={models}
        handleModelClick={sinon.stub()}
        humanizeTimestamp={humanizeTimestamp}
        switchModel={sinon.stub()}
        user={{username: 'who@external', displayName: 'who'}}
      />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expectedOutput = (
      <ul className="env-list"
        role="menubar"
        id="environmentSwitcherMenu"
        aria-expanded="true"
        aria-hidden="false"
        aria-labelledby="environmentSwitcherToggle">
        {[<li className="env-list__environment"
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
        ]}
      </ul>);
    expect(output.props.children[0]).toEqualJSX(expectedOutput);
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
      <EnvList
        acl={acl}
        changeState={sinon.stub()}
        environmentName="model-name-1"
        envs={models}
        handleModelClick={sinon.stub()}
        humanizeTimestamp={humanizeTimestamp}
        switchModel={sinon.stub()}
        user={{username: 'who@local', displayName: 'who'}}
      />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <ul className="env-list"
        role="menubar"
        id="environmentSwitcherMenu"
        aria-expanded="true"
        aria-hidden="false"
        aria-labelledby="environmentSwitcherToggle">
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
      </ul>);
    expect(output.props.children[0]).toEqualJSX(expected);
  });

  it('displays only the create new button if there are no models', function() {
    const output = jsTestUtils.shallowRender(
      <EnvList
        acl={acl}
        changeState={sinon.stub()}
        envs={[]}
        humanizeTimestamp={humanizeTimestamp}
        handleModelClick={sinon.stub()}
        switchModel={sinon.stub()}
        user={{username: 'who@local', displayName: 'who'}} />);
    assert.strictEqual(output.props.children[0].props.children, false);
  });

  it('clicking a model calls the handleModelClick prop', function() {
    const models = [{uuid: 'abc123', name: 'the name', owner: 'who@external'}];
    const handleModelClick = sinon.stub();
    const getAttribute = sinon.stub();
    getAttribute.withArgs('data-id').returns('abc123');
    getAttribute.withArgs('data-name').returns('the name');
    getAttribute.withArgs('data-owner').returns('who@external');
    const output = jsTestUtils.shallowRender(
      <EnvList
        acl={acl}
        changeState={sinon.stub()}
        envs={models}
        humanizeTimestamp={humanizeTimestamp}
        handleModelClick={handleModelClick}
        switchModel={sinon.stub()}
        user={{username: 'who@local', displayName: 'who'}} />);
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
      <EnvList
        acl={acl}
        changeState={sinon.stub()}
        envs={models}
        humanizeTimestamp={humanizeTimestamp}
        handleModelClick={sinon.stub()}
        switchModel={switchModel}
        user={{username: 'who@local', displayName: 'who'}} />);
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
      <EnvList
        acl={_acl}
        changeState={sinon.stub()}
        envs={models}
        humanizeTimestamp={humanizeTimestamp}
        handleModelClick={sinon.stub()}
        switchModel={switchModel}
        user={{username: 'who@local', displayName: 'who'}} />);
    testUtils.Simulate.click(
      ReactDOM.findDOMNode(component)
        .querySelector('.button--neutral'));
    assert.equal(switchModel.callCount, 0);
  });
});
