/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');
const deepmerge = require('deepmerge');

const ProfileModelList = require('./model-list');

const jujulibTestHelper = require('jujulib/api/test-helpers');
const jujulibModelManager = require('jujulib/api/facades/model-manager-v4.js');
const modelResponse = require('jujulib/tests/data/modelmanager-response');

describe('Profile Model List', function() {

  let jujuConnection = null;
  let jujuWebsocket = null;

  beforeEach(done => {
    const options = {
      facades: [
        jujulibModelManager
      ]
    };

    jujulibTestHelper.makeConnection(assert, options, (conn, ws) => {
      jujuConnection = conn;
      jujuWebsocket = ws;
      done();
    });

  });

  const renderComponent = (options = {}) =>
    enzyme.shallow(
      <ProfileModelList
        addNotification={options.addNotification || sinon.stub()}
        baseURL="/gui/"
        changeState={options.changeState || sinon.stub()}
        modelManager={options.modelManager || jujuConnection.facades.modelManager}
        switchModel={options.switchModel || sinon.stub()}
        userName={options.userName || 'thedr'} />
    );

  function setupDefaultReplies() {
    jujuWebsocket.queueReplies(new Map([
      [2, modelResponse.listModelSummaries]
    ]));
  }

  it('can render', () => {
    setupDefaultReplies();
    const component = renderComponent({gisf: true});
    expect(component).toMatchSnapshot();
  });

  it('does not break for superusers', () => {
    // Users with access to all models but no models of their own, or shared with them.
    const updatedModelSummaries = deepmerge({}, modelResponse.listModelSummaries);
    const newModel = {
      'name': 'super-tester',
      'uuid': '57650e3c-815f-4520-89df-81fd5d30b7ef',
      'type': '',
      'controller-uuid': 'a030379b-940f-4760-9fcf-3062b41a04e7',
      'provider-type': 'gce',
      'default-series': 'bionic',
      'cloud-tag': 'cloud-google',
      'cloud-region': 'us-central1',
      'cloud-credential-tag': 'cloudcred-google_thedr@external_admin',
      'owner-tag': 'user-employee@external',
      'life': 'alive',
      'status': {
        'status': 'available',
        'info': '',
        'since': '2018-11-07T05:02:42.436Z'
      },
      'user-access': 'superuser',
      'last-connection': null,
      'counts': [{
        'entity': 'machines',
        'count': 0
      }, {
        'entity': 'cores',
        'count': 0
      }],
      'sla': null,
      'agent-version': '2.4.5'
    };
    updatedModelSummaries.response.results.push({result: newModel});
    jujuWebsocket.queueReplies(new Map([
      [2, updatedModelSummaries]
    ]));

    const component = renderComponent({
      userName: 'somesuperuser'
    });

    // It should only show the single model that they explicitly own.
    assert.equal(
      component.find('.profile__title-count').html().includes('(5)'),
      true);
  });

  it('can render without any models', () => {
    const updatedModelSummaries = deepmerge({}, modelResponse.listModelSummaries);
    updatedModelSummaries.response.results = [];
    jujuWebsocket.queueReplies(new Map([
      [2, updatedModelSummaries]
    ]));
    const component = renderComponent();
    assert.equal(component.find('.profile__title-count').html().includes('(0)'), true);
    assert.equal(component.find('BasicTable').length, 0);
  });

  it('does not break with model data in an unexpected format', () => {
    jujuWebsocket.queueReplies(new Map([
      [2, {}]
    ]));
    const component = renderComponent();
    assert.equal(component.find('.profile__title-count').html().includes('(0)'), true);
    assert.equal(component.find('BasicTable').length, 0);
  });

  it('does not show models that are being destroyed', () => {
    const updatedModelSummaries = deepmerge({}, modelResponse.listModelSummaries);
    updatedModelSummaries.response.results[0].result.life = 'dying';
    jujuWebsocket.queueReplies(new Map([
      [2, updatedModelSummaries]
    ]));
    const component = renderComponent();
    assert.equal(component.find('.profile__title-count').html().includes('(4)'), true);
  });

  it('displays an error when destroying a model fails', () => {
    jujuWebsocket.queueReplies(new Map([
      [2, modelResponse.listModelSummaries],
      [3, modelResponse.destroyModelsError],
      [4, modelResponse.listModelSummaries]
    ]));
    const addNotification = sinon.stub();
    const component = renderComponent({
      addNotification: addNotification
    });
    component.instance()._confirmDestroy('test');
    assert.equal(addNotification.callCount, 1);
  });

  it('displays a spinner when loading', () => {
    const component = renderComponent();
    expect(component).toMatchSnapshot();
  });

  it('switches to a model that has been clicked on', () => {
    const switchModel = sinon.stub();
    const changeState = sinon.stub();
    const e = {
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub()
    };
    setupDefaultReplies();
    const component = renderComponent({
      switchModel: switchModel,
      changeState: changeState
    });
    component.update();
    const link = component.find('BasicTable').prop('rows')[0].columns[0].content;
    link.props.onClick(e);
    assert.equal(e.preventDefault.callCount, 1);
    assert.equal(e.stopPropagation.callCount, 1);
    assert.equal(changeState.callCount, 1, 'changeState not called');
    assert.deepEqual(changeState.args[0], [{profile: null}]);
    assert.equal(switchModel.callCount, 1, 'switchModel not called');
    expect(switchModel.args[0]).toMatchSnapshot();
  });
});
