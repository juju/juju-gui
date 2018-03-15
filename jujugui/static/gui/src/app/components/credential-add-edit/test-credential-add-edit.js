/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

const CredentialAddEdit = require('./credential-add-edit');
const DeploymentCloud = require('../deployment-flow/cloud/cloud');
const DeploymentCredentialAdd = require('../deployment-flow/credential/add/add');
const GenericButton = require('../generic-button/generic-button');
const Spinner = require('../spinner/spinner');

describe('CredentialAddEdit', () => {
  let acl, controllerAPI, controllerIsReady, initUtils;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    controllerIsReady = sinon.stub().returns(true);
    const getCloudProviderDetails = sinon.stub();
    getCloudProviderDetails.withArgs('aws').returns({title: 'Amazon'});
    getCloudProviderDetails.withArgs('gce').returns({title: 'Google'});
    controllerAPI = {
      listClouds: sinon.stub().callsArgWith(0, null, {
        aws: {
          cloudType: 'aws'
        },
        gce: {
          cloudType: 'gce'
        },
        guimaas: {
          cloudType: 'maas'
        }
      }),
      reshape: shapeup.reshapeFunc,
      updateCloudCredential: sinon.stub()
    };
    initUtils = {
      generateCloudCredentialName: sinon.stub(),
      getCloudProviderDetails: getCloudProviderDetails,
      reshape: shapeup.reshapeFunc,
      validateForm: sinon.stub()
    };
  });

  const renderComponent = (options = {}) => enzyme.shallow(
    <CredentialAddEdit
      acl={acl}
      addNotification={options.addNotification || sinon.stub()}
      controllerAPI={controllerAPI}
      controllerIsReady={controllerIsReady}
      credential={options.credential}
      credentials={['test1', 'test2']}
      initUtils={initUtils}
      onCancel={options.onCancel || sinon.stub()}
      onCredentialUpdated={options.onCredentialUpdated || sinon.stub()}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      username="spinach@external" />
  );

  it('can show cloud options when adding credentials', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="credential-add-edit">
        <DeploymentCloud
          acl={acl}
          addNotification={sinon.stub()}
          cloud={null}
          controllerIsReady={controllerIsReady}
          getCloudProviderDetails={sinon.stub()}
          key="deployment-cloud"
          listClouds={sinon.stub()}
          setCloud={wrapper.find('DeploymentCloud').prop('setCloud')} />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can show the loading spinner', () => {
    controllerAPI.listClouds = sinon.stub();
    const wrapper = renderComponent();
    const expected = (
      <div className="credential-add-edit">
        <Spinner />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can show the form when adding credentials', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._setCloud({title: 'aws'});
    wrapper.update();
    const expected = (
      <div className="credential-add-edit">
        <div>
          <div className="credential-add-edit__choose-cloud">
            <GenericButton
              action={wrapper.find('GenericButton').prop('action')}
              type="inline-neutral">
              Change cloud
            </GenericButton>
          </div>
          <DeploymentCloud
            acl={acl}
            addNotification={sinon.stub()}
            cloud={{title: 'aws'}}
            controllerIsReady={controllerIsReady}
            getCloudProviderDetails={sinon.stub()}
            key="deployment-cloud"
            listClouds={sinon.stub()}
            setCloud={wrapper.find('DeploymentCloud').prop('setCloud')} />
          <DeploymentCredentialAdd
            acl={acl}
            addNotification={sinon.stub()}
            cloud={{title: 'aws'}}
            credentialName={null}
            credentials={['test1', 'test2']}
            generateCloudCredentialName={sinon.stub()}
            getCloudProviderDetails={sinon.stub()}
            key="deployment-credential-add"
            onCancel={sinon.stub()}
            onCredentialUpdated={sinon.stub()}
            sendAnalytics={sinon.stub()}
            updateCloudCredential={sinon.stub()}
            user="spinach@external"
            validateForm={sinon.stub()} />
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can show the form for updating credentials', () => {
    const wrapper = renderComponent({
      credential: {
        name: 'cred-name',
        cloud: 'aws'
      }
    });
    const expected = (
      <div className="credential-add-edit">
        <DeploymentCredentialAdd
          acl={acl}
          addNotification={sinon.stub()}
          cloud={{cloudType: 'aws'}}
          credentialName="cred-name"
          credentials={['test1', 'test2']}
          generateCloudCredentialName={sinon.stub()}
          getCloudProviderDetails={sinon.stub()}
          key="deployment-credential-add"
          onCancel={sinon.stub()}
          onCredentialUpdated={sinon.stub()}
          sendAnalytics={sinon.stub()}
          updateCloudCredential={sinon.stub()}
          user="spinach@external"
          validateForm={sinon.stub()} />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('does not show the change cloud button when only one cloud', () => {
    controllerAPI.listClouds.callsArgWith(0, null, {
      aws: {
        cloudType: 'aws'
      }
    });
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._setCloud({title: 'aws'});
    assert.equal(wrapper.find('.credential-add-edit__choose-cloud').length, 0);
  });

  it('can handle errors when getting clouds', () => {
    controllerAPI.listClouds.callsArgWith(0, 'Uh oh!', null);
    const addNotification = sinon.stub();
    renderComponent({addNotification: addNotification});
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to list clouds',
      message: 'Unable to list clouds: Uh oh!',
      level: 'error'
    });
  });
});
