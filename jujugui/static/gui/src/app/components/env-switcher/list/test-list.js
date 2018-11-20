/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EnvList = require('./list');

const jujulibTestHelper = require('@canonical/jujulib/api/test-helpers');
const jujulibModelManager = require('@canonical/jujulib/api/facades/model-manager-v4.js');
const modelResponse = require('@canonical/jujulib/tests/data/modelmanager-response');

describe('EnvList', function() {
  const acl = {canAddModels: sinon.stub().returns(true)};

  let jujuConnection = null;
  let jujuWebsocket = null;

  beforeEach(done => {
    const options = {
      facades: [
        jujulibModelManager
      ]
    };

    const loginResponse = {
      facades: [{name: 'ModelManager', versions: [4]}]
    };

    jujulibTestHelper.makeConnectionWithResponse(
      assert, options, loginResponse, (conn, ws) => {
        jujuConnection = conn;
        jujuWebsocket = ws;
        done();
      });
  });

  const renderComponent = (options = {}) => enzyme.shallow(
    <EnvList
      acl={options.acl || acl}
      changeState={options.changeState || sinon.stub()}
      environmentName={options.environmentName || 'model-name-1'}
      envs={options.envs || []}
      handleModelClick={options.handleModelClick || sinon.stub()}
      switchModel={options.switchModel || sinon.stub()}
      user={options.user || {username: 'who@external', displayName: 'who'}} />
  );

  const getModelsStub = () => {
    jujuWebsocket.queueResponses(new Map([
      [2, modelResponse.listModelSummaries]
    ]));
    return jujuConnection.facades.modelManager.listModelSummaries();
  };

  it('renders a list of models', async function() {
    const models = await getModelsStub();
    const wrapper = renderComponent({envs: models.results});
    expect(wrapper).toMatchSnapshot();
  });

  it('orders the model list, and handles never connected ones', async function() {
    const response = modelResponse.listModelSummaries;
    const results = response.response.results;
    results[0].result['last-connection'] = new Date('July 20, 69 00:20:18 GMT+00:00');
    results[1].result['last-connection'] = new Date('July 20, 69 00:00:18 GMT+00:00');
    results[2].result['last-connection'] = new Date('July 20, 69 00:10:18 GMT+00:00');
    jujuWebsocket.queueResponses(new Map([
      [2, response]
    ]));
    const models = await jujuConnection.facades.modelManager.listModelSummaries();
    const wrapper = renderComponent({envs: models.results});
    expect(wrapper).toMatchSnapshot();
  });

  it('displays only the create new button if there are no models', function() {
    const wrapper = renderComponent();
    assert.strictEqual(wrapper.find('EnvList').length, 0);
  });

  it('clicking a model calls the handleModelClick prop', async function() {
    const models = await getModelsStub();
    const handleModelClick = sinon.stub();
    const getAttribute = sinon.stub();
    getAttribute.withArgs('data-id').returns('abc123');
    getAttribute.withArgs('data-name').returns('the name');
    getAttribute.withArgs('data-owner').returns('who@external');
    const wrapper = renderComponent({envs: models.results, handleModelClick});
    wrapper.find('.env-list__environment').at(0).simulate('click', {
      currentTarget: {
        getAttribute: getAttribute
      }
    });
    assert.equal(handleModelClick.callCount, 1);
  });

  it('new model call is made when clicking on the create model button', async function() {
    const models = await getModelsStub();
    const handleModelClick = sinon.stub();
    const wrapper = renderComponent({envs: models.results, handleModelClick});
    wrapper.find('CreateModelButton').props().action();
    assert.equal(handleModelClick.callCount, 1);
  });

  it('new model is not made when user has incorrect permissions', () => {
    const acl = {canAddModels: sinon.stub().returns(false)};
    const wrapper = renderComponent({acl: acl});
    assert.strictEqual(wrapper.find('CreateModelButton').prop('disabled'), true);
  });
});
