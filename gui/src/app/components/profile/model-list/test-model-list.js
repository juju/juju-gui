/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ProfileModelList = require('./model-list');
const Spinner = require('../../spinner/spinner');

describe('Profile Model List', function() {
  // JSON dump of a test listModelsWithInfo call.
  // The first two records are owned by 'tester'.
  // The last two are shared with 'tester'.
  const rawModelData = `[{
    "id": "2f929db7-08a1-4a75-8733-3a0352a6e9f5",
    "name": "mymodel",
    "series": "xenial",
    "provider": "ec2",
    "uuid": "2f929db7-08a1-4a75-8733-3a0352a6e9f5",
    "agentVersion": "",
    "sla": "",
    "slaOwner": "",
    "status": "available",
    "statusInfo": "",
    "controllerUUID": "a030379a-940f-4760-8fce-3062b41a04e9",
    "owner": "tester@external",
    "credential": "aws_tester@external_base",
    "credentialName": "base",
    "region": "eu-west-1",
    "cloud": "aws",
    "numMachines": 0,
    "users": [{
      "name": "tester@external",
      "displayName": "tester",
      "domain": "Ubuntu SSO",
      "lastConnection": "2017-07-06T14:47:03.000Z",
      "access": "admin"
    }, {
      "name": "tester2@external",
      "displayName": "tester2",
      "domain": "Ubuntu SSO",
      "lastConnection": "2017-05-25T18:53:35.000Z",
      "access": "read"
    }],
    "life": "alive",
    "isAlive": true,
    "isController": false,
    "lastConnection": "2017-07-06T14:47:03.000Z"
  }, {
    "id": "f507b811-d706-427e-8f01-d485fgc90a67",
    "name": "mymodel2",
    "series": "xenial",
    "provider": "gce",
    "uuid": "f507b811-d706-427e-8f01-d485fgc90a67",
    "agentVersion": "",
    "sla": "",
    "slaOwner": "",
    "status": "available",
    "statusInfo": "",
    "controllerUUID": "a030379a-940f-4760-8fce-3062b41a04e9",
    "owner": "tester@external",
    "credential": "google_tester@external_admin",
    "credentialName": "admin",
    "region": "us-central1",
    "cloud": "google",
    "numMachines": 0,
    "users": [{
      "name": "tester@external",
      "displayName": "tester",
      "domain": "Ubuntu SSO",
      "lastConnection": "2017-07-06T16:26:47.000Z",
      "access": "admin"
    }],
    "life": "alive",
    "isAlive": true,
    "isController": false,
    "lastConnection": "2017-07-06T16:26:47.000Z"
  }, {
    "id": "06b11eb5-abd6-48f3-8910-b54cf5945e60",
    "name": "test-db",
    "series": "xenial",
    "provider": "gce",
    "uuid": "06b11eb5-abd6-48f3-8910-b54cf5945e60",
    "agentVersion": "",
    "sla": "",
    "slaOwner": "",
    "status": "available",
    "statusInfo": "",
    "controllerUUID": "a030379a-940f-4760-8fce-3062b41a04e9",
    "owner": "tester2@external",
    "credential": "google_tester2@external_google-dbtest",
    "credentialName": "google-dbtest",
    "region": "us-east1",
    "cloud": "google",
    "numMachines": 2,
    "users": [{
      "name": "tester@external",
      "displayName": "tester",
      "domain": "Ubuntu SSO",
      "lastConnection": null,
      "access": "read"
    }, {
      "name": "tester2@external",
      "displayName": "tester2",
      "domain": "Ubuntu SSO",
      "lastConnection": null,
      "access": "admin"
    }],
    "life": "alive",
    "isAlive": true,
    "isController": false,
    "lastConnection": null
  }, {
    "id": "509f6e4c-4da4-49c8-8f19-537c33b4d3a0",
    "name": "website",
    "series": "xenial",
    "provider": "gce",
    "uuid": "509f6e4c-4da4-49c8-8f19-537c33b4d3a0",
    "agentVersion": "",
    "sla": "",
    "slaOwner": "",
    "status": "available",
    "statusInfo": "",
    "controllerUUID": "a030379a-940f-4760-8fce-3062b41a04e9",
    "owner": "tester3@external",
    "credential": "google_tester3@external_gce",
    "credentialName": "gce",
    "region": "us-east1",
    "cloud": "google",
    "numMachines": 25,
    "users": [{
      "name": "tester4@external",
      "displayName": "tester4",
      "domain": "Ubuntu SSO",
      "lastConnection": "2017-06-09T16:24:28.000Z",
      "access": "read"
    }, {
      "name": "tester@external",
      "displayName": "tester",
      "domain": "Ubuntu SSO",
      "lastConnection": "2017-07-05T01:42:05.000Z",
      "access": "admin"
    }],
    "life": "alive",
    "isAlive": true,
    "isController": false,
    "lastConnection": "2017-07-05T01:42:05.000Z"
  }]`;

  const renderComponent = (options = {}) =>
    enzyme.shallow(
      <ProfileModelList
        acl={{}}
        addNotification={options.addNotification || sinon.stub()}
        baseURL="/gui/"
        changeState={options.changeState || sinon.stub()}
        destroyModel={options.destroyModel || sinon.stub()}
        facadesExist={true}
        listModelsWithInfo={
          options.listModelsWithInfo ||
          sinon.stub().callsArgWith(0, null, JSON.parse(rawModelData))
        }
        switchModel={options.switchModel || sinon.stub()}
        userInfo={options.userInfo || {profile: 'tester'}} />
    );

  it('can render', () => {
    const wrapper = renderComponent({gisf: true});
    expect(wrapper).toMatchSnapshot();
  });

  it('does not break for superusers', () => {
    // Users with access to all models but no models of their own, or shared with them.
    const models = JSON.parse(rawModelData);
    models.push(JSON.parse(`{
      "id": "2f929db7-08a1-4a75-8733-3a0352a6e9f5",
      "name": "mymodel-foo",
      "series": "xenial",
      "provider": "ec2",
      "uuid": "2f929db7-08a1-4a75-8733-3a0352a6e9f5",
      "agentVersion": "",
      "sla": "",
      "slaOwner": "",
      "status": "available",
      "statusInfo": "",
      "controllerUUID": "a030379a-940f-4760-8fce-3062b41a04e9",
      "owner": "'somesuperuser'@external",
      "credential": "aws_tester@external_base",
      "credentialName": "base",
      "region": "eu-west-1",
      "cloud": "aws",
      "numMachines": 0,
      "users": [{
        "name": "somesuperuser@external",
        "displayName": "somesuperuser",
        "domain": "Ubuntu SSO",
        "lastConnection": "2017-07-06T14:47:03.000Z",
        "access": "admin"
      }],
      "life": "alive",
      "isAlive": true,
      "isController": false,
      "lastConnection": "2017-07-06T14:47:03.000Z"
    }`));
    const wrapper = renderComponent({
      listModelsWithInfo: sinon.stub().callsArgWith(0, null, models),
      userInfo: {profile: 'somesuperuser'}
    });
    // It should only show the single model that they explicitly own.
    assert.equal(wrapper.find('.profile__title-count').html().includes('(1)'), true);
  });

  it('can render without any models', () => {
    const wrapper = renderComponent({
      listModelsWithInfo: sinon.stub().callsArgWith(0, null, null)
    });
    assert.equal(wrapper.find('.profile__title-count').html().includes('(0)'), true);
    assert.equal(wrapper.find('BasicTable').length, 0);
  });

  it('does not break with model data in an unexpected format', () => {
    const wrapper = renderComponent({
      listModelsWithInfo: sinon.stub().callsArgWith(0, null, [''])
    });
    assert.equal(wrapper.find('.profile__title-count').html().includes('(0)'), true);
    assert.equal(wrapper.find('BasicTable').length, 0);
  });

  it('does not show the trash icon for controller models', () => {
    const models = JSON.parse(rawModelData).slice(0, 1);
    models[0].isController = true;
    const wrapper = renderComponent({
      listModelsWithInfo: sinon.stub().callsArgWith(0, null, models)
    });
    assert.strictEqual(
      wrapper.find('BasicTable').prop('rows')[0].columns[5].content, null);
  });

  it('does not show models that are being destroyed', () => {
    const models = [{isAlive: false}];
    models.push(JSON.parse(`{
      "id": "2f929db7-08a1-4a75-8733-3a0352a6e9f5",
      "name": "mymodel",
      "series": "xenial",
      "provider": "ec2",
      "uuid": "2f929db7-08a1-4a75-8733-3a0352a6e9f5",
      "agentVersion": "",
      "sla": "",
      "slaOwner": "",
      "status": "available",
      "statusInfo": "",
      "controllerUUID": "a030379a-940f-4760-8fce-3062b41a04e9",
      "owner": "tester@external",
      "credential": "aws_tester@external_base",
      "credentialName": "base",
      "region": "eu-west-1",
      "cloud": "aws",
      "numMachines": 0,
      "users": [{
        "name": "tester@external",
        "displayName": "tester",
        "domain": "Ubuntu SSO",
        "lastConnection": "2017-07-06T14:47:03.000Z",
        "access": "admin"
      }, {
        "name": "tester2@external",
        "displayName": "tester2",
        "domain": "Ubuntu SSO",
        "lastConnection": "2017-05-25T18:53:35.000Z",
        "access": "read"
      }],
      "life": "alive",
      "isAlive": true,
      "isController": false,
      "lastConnection": "2017-07-06T14:47:03.000Z"
    }`));
    const wrapper = renderComponent({
      listModelsWithInfo: sinon.stub().callsArgWith(0, null, models)
    });
    assert.equal(wrapper.find('.profile__title-count').html().includes('(1)'), true);
  });

  it('displays an error when destroying a model fails', () => {
    const addNotification = sinon.stub();
    const wrapper = renderComponent({
      addNotification: addNotification,
      destroyModel: (modelUUID, callback) => {
        callback(['Error 1', 'Error 2'], {});
      }
    });
    wrapper.instance()._confirmDestroy('test');
    assert.equal(addNotification.callCount, 2);
  });

  it('displays a spinner when loading', () => {
    const wrapper = renderComponent({
      listModelsWithInfo: sinon.stub()
    });
    wrapper.update();
    const expected = (
      <div className="profile-model-list">
        <Spinner />
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('switches to a model that has been clicked on', () => {
    const switchModel = sinon.stub();
    const changeState = sinon.stub();
    const e = {
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub()
    };
    const wrapper = renderComponent({
      switchModel: switchModel,
      changeState: changeState
    });
    wrapper.update();
    const link = wrapper.find('BasicTable').prop('rows')[0].columns[0].content;
    link.props.onClick(e);
    assert.equal(e.preventDefault.callCount, 1);
    assert.equal(e.stopPropagation.callCount, 1);
    assert.equal(changeState.callCount, 1, 'changeState not called');
    assert.deepEqual(changeState.args[0], [{profile: null}]);
    assert.equal(switchModel.callCount, 1, 'switchModel not called');
    assert.deepEqual(switchModel.args[0], [{
      name: 'mymodel',
      id: '2f929db7-08a1-4a75-8733-3a0352a6e9f5',
      owner: 'tester'
    }]);
  });
});
