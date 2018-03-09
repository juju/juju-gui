/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EnvList = require('./list');


describe('EnvList', function() {
  const humanizeTimestamp = sinon.stub().returns('less than a minute ago');
  const acl = {canAddModels: sinon.stub().returns(true)};

  const renderComponent = (options = {}) => enzyme.shallow(
    <EnvList
      acl={options.acl || acl}
      changeState={options.changeState || sinon.stub()}
      environmentName={options.environmentName || 'model-name-1'}
      envs={options.envs || []}
      handleModelClick={options.handleModelClick || sinon.stub()}
      humanizeTimestamp={options.humanizeTimestamp || humanizeTimestamp}
      switchModel={options.switchModel || sinon.stub()}
      user={options.user || {username: 'who@external', displayName: 'who'}} />
  );

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
    const wrapper = renderComponent({ envs: models });
    const expected = (
      <ul aria-expanded="true"
        aria-hidden="false"
        aria-labelledby="environmentSwitcherToggle"
        className="env-list"
        id="environmentSwitcherMenu"
        role="menubar">
        <li className="env-list__environment"
          data-id={models[1].uuid}
          data-name={models[1].name}
          data-owner={models[1].owner}
          key={models[1].uuid}
          onClick={wrapper.find('.env-list__environment').prop('onClick')}
          role="menuitem"
          tabIndex="0">
          dalek/model-name-2
          <div className="env-list__last-connected">
            Last accessed less than a minute ago
          </div>
        </li>
      </ul>);
    assert.compareJSX(wrapper.find('.env-list'), expected);
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
    const wrapper = renderComponent({ envs: models });
    const expected = (
      <ul aria-expanded="true"
        aria-hidden="false"
        aria-labelledby="environmentSwitcherToggle"
        className="env-list"
        id="environmentSwitcherMenu"
        role="menubar">
        {[<li className="env-list__environment"
          data-id={models[3].uuid}
          data-name={models[3].name}
          data-owner={models[3].owner}
          key={models[3].uuid}
          onClick={wrapper.find('.env-list__environment').at(0).prop('onClick')}
          role="menuitem"
          tabIndex="0">
          {'dalek/model-name-4'}
          <div className="env-list__last-connected">
            {'Never accessed'}
          </div>
        </li>,
        <li className="env-list__environment"
          data-id={models[2].uuid}
          data-name={models[2].name}
          data-owner={models[2].owner}
          key={models[2].uuid}
          onClick={wrapper.find('.env-list__environment').at(1).prop('onClick')}
          role="menuitem"
          tabIndex="0">
          {'model-name-3'}
          <div className="env-list__last-connected">
            {'Last accessed less than a minute ago'}
          </div>
        </li>,
        <li className="env-list__environment"
          data-id={models[1].uuid}
          data-name={models[1].name}
          data-owner={models[1].owner}
          key={models[1].uuid}
          onClick={wrapper.find('.env-list__environment').at(2).prop('onClick')}
          role="menuitem"
          tabIndex="0">
          {'dalek/model-name-2'}
          <div className="env-list__last-connected">
            {'Last accessed less than a minute ago'}
          </div>
        </li>
        ]}
      </ul>);
    assert.compareJSX(wrapper.find('.env-list'), expected);
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
    const wrapper = renderComponent({ envs: models });
    const expected = (
      <li className="env-list__environment"
        data-id={models[1].uuid}
        data-name={models[1].name}
        data-owner={models[1].owner}
        key={models[1].uuid}
        onClick={wrapper.find('.env-list__environment').prop('onClick')}
        role="menuitem"
        tabIndex="0">
        dalek/model-name-2
        <div className="env-list__last-connected">
          Last accessed less than a minute ago
        </div>
      </li>);
    assert.compareJSX(wrapper.find('.env-list__environment'), expected);
  });

  it('displays only the create new button if there are no models', function() {
    const wrapper = renderComponent();
    assert.strictEqual(wrapper.find('EnvList').length, 0);
  });

  it('clicking a model calls the handleModelClick prop', function() {
    const models = [{uuid: 'abc123', name: 'the name', owner: 'who@external'}];
    const handleModelClick = sinon.stub();
    const getAttribute = sinon.stub();
    getAttribute.withArgs('data-id').returns('abc123');
    getAttribute.withArgs('data-name').returns('the name');
    getAttribute.withArgs('data-owner').returns('who@external');
    const wrapper = renderComponent({ envs: models, handleModelClick });
    wrapper.find('.env-list__environment').simulate('click', {
      currentTarget: {
        getAttribute: getAttribute
      }
    });
    assert.equal(handleModelClick.callCount, 1);
  });

  it('new model call is made when clicking on the createm model button', function() {
    const handleModelClick = sinon.stub();
    const models = [{uuid: 'abc123', name: 'the name', owner: 'who@external'}];
    const wrapper = renderComponent({ envs: models, handleModelClick });
    wrapper.find('CreateModelButton').props().action();
    assert.equal(handleModelClick.callCount, 1);
  });

  it('new model is not made when user has incorrect permissions', () => {
    const acl = {canAddModels: sinon.stub().returns(false)};
    const wrapper = renderComponent({ acl: acl });
    assert.strictEqual(wrapper.find('CreateModelButton').prop('disabled'), true);
  });
});
