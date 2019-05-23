/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Analytics = require('test/fake-analytics');
const EnvList = require('./list');

describe('EnvList', function() {
  const acl = {canAddModels: sinon.stub().returns(true)};

  const renderComponent = (options = {}) => enzyme.shallow(
    <EnvList
      acl={options.acl || acl}
      analytics={Analytics}
      changeState={options.changeState || sinon.stub()}
      environmentName={options.environmentName || 'model-name-1'}
      envs={options.envs || []}
      handleModelClick={options.handleModelClick || sinon.stub()}
      switchModel={options.switchModel || sinon.stub()}
      user={options.user || {username: 'who@external', displayName: 'who'}} />
  );

  it('renders a list of models', function() {
    const models = [
      {
        uuid: 'model-uuid-1',
        name: 'model-name-1',
        owner: 'who@external',
        provider: 'aws'
      },
      {
        uuid: 'model-uuid-2',
        name: 'model-name-2',
        owner: 'dalek@external',
        provider: 'gce'
      }
    ];
    const wrapper = renderComponent({envs: models});
    expect(wrapper).toMatchSnapshot();
  });

  it('orders the model list, and handles never connected ones', function() {
    const models = [
      {
        uuid: 'model-uuid-1',
        name: 'model-name-1',
        owner: 'who@external',
        provider: 'aws'
      },
      {
        uuid: 'model-uuid-2',
        name: 'model-name-2',
        owner: 'dalek@external',
        provider: 'aws'
      },
      {
        uuid: 'model-uuid-3',
        name: 'model-name-3',
        owner: 'who@external',
        provider: 'gce'
      },
      {
        uuid: 'model-uuid-4',
        name: 'model-name-4',
        owner: 'dalek@external',
        provider: 'gce'
      }
    ];
    const wrapper = renderComponent({envs: models});
    expect(wrapper).toMatchSnapshot();
  });

  it('handles local model owners', function() {
    const models = [
      {
        uuid: 'model-uuid-1',
        name: 'model-name-1',
        owner: 'who',
        provider: 'gce'
      },
      {
        uuid: 'model-uuid-2',
        name: 'model-name-2',
        owner: 'dalek',
        provider: 'aws'
      }
    ];
    const wrapper = renderComponent({envs: models});
    expect(wrapper).toMatchSnapshot();
  });

  it('displays only the create new button if there are no models', function() {
    const wrapper = renderComponent();
    assert.strictEqual(wrapper.find('EnvList').length, 0);
  });

  it('clicking a model calls the handleModelClick prop', function() {
    const models = [{
      uuid: 'abc123',
      name: 'the name',
      owner: 'who@external',
      provider: 'aws'
    }];
    const handleModelClick = sinon.stub();
    const getAttribute = sinon.stub();
    getAttribute.withArgs('data-id').returns('abc123');
    getAttribute.withArgs('data-name').returns('the name');
    getAttribute.withArgs('data-owner').returns('who@external');
    const wrapper = renderComponent({envs: models, handleModelClick});
    wrapper.find('.env-list__environment').simulate('click', {
      currentTarget: {
        getAttribute: getAttribute
      }
    });
    assert.equal(handleModelClick.callCount, 1);
  });

  it('new model call is made when clicking on the createm model button', function() {
    const handleModelClick = sinon.stub();
    const models = [{
      uuid: 'abc123',
      name: 'the name',
      owner: 'who@external',
      provider: 'aws'
    }];
    const wrapper = renderComponent({envs: models, handleModelClick});
    wrapper.find('CreateModelButton').props().action();
    assert.equal(handleModelClick.callCount, 1);
  });

  it('new model is not made when user has incorrect permissions', () => {
    const acl = {canAddModels: sinon.stub().returns(false)};
    const wrapper = renderComponent({acl: acl});
    assert.strictEqual(wrapper.find('CreateModelButton').prop('disabled'), true);
  });
});
