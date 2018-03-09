/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');

const CredentialAddEdit = require('./credential-add-edit');
const DeploymentCloud = require('../deployment-flow/cloud/cloud');
const DeploymentCredentialAdd = require('../deployment-flow/credential/add/add');
const GenericButton = require('../generic-button/generic-button');
const Spinner = require('../spinner/spinner');

const jsTestUtils = require('../../utils/component-test-utils');

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

  function renderComponent(options={}) {
    const renderer = jsTestUtils.shallowRender(
      <CredentialAddEdit
        acl={acl}
        addNotification={options.addNotification || sinon.stub()}
        controllerAPI={controllerAPI}
        controllerIsReady={controllerIsReady}
        credential={options.credential}
        credentials={['test1', 'test2']}
        initUtils={initUtils}
        onCancel={sinon.stub()}
        onCredentialUpdated={sinon.stub()}
        sendAnalytics={options.sendAnalytics || sinon.stub()}
        username="spinach@external" />, true);
    return {
      renderer,
      output: renderer.getRenderOutput(),
      instance: renderer.getMountedInstance()
    };
  }

  it('can show cloud options when adding credentials', () => {
    const comp = renderComponent();
    const expected = (
      <div className="credential-add-edit">
        <DeploymentCloud
          acl={acl}
          addNotification={sinon.stub()}
          cloud={null}
          controllerIsReady={sinon.stub()}
          getCloudProviderDetails={sinon.stub()}
          key="deployment-cloud"
          listClouds={sinon.stub()}
          setCloud={sinon.stub()} />
      </div>);
    expect(comp.output).toEqualJSX(expected);
  });

  it('can show the loading spinner', () => {
    controllerAPI.listClouds = sinon.stub();
    const comp = renderComponent();
    const expected = (
      <div className="credential-add-edit">
        <Spinner />
      </div>);
    expect(comp.output).toEqualJSX(expected);
  });

  it('can show the form when adding credentials', () => {
    const comp = renderComponent();
    const instance = comp.instance;
    instance._setCloud({title: 'aws'});
    const output = comp.renderer.getRenderOutput();
    const expected = (
      <div className="credential-add-edit">
        <div>
          <div className="credential-add-edit__choose-cloud">
            <GenericButton
              action={sinon.stub()}
              type="inline-neutral">
              Change cloud
            </GenericButton>
          </div>
          <DeploymentCloud
            acl={acl}
            addNotification={sinon.stub()}
            cloud={{title: 'aws'}}
            controllerIsReady={sinon.stub()}
            getCloudProviderDetails={sinon.stub()}
            key="deployment-cloud"
            listClouds={sinon.stub()}
            setCloud={sinon.stub()} />
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
    expect(output).toEqualJSX(expected);
  });

  it('can show the form for updating credentials', () => {
    const comp = renderComponent({
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
    expect(comp.output).toEqualJSX(expected);
  });

  it('does not show the change cloud button when only one cloud', () => {
    controllerAPI.listClouds.callsArgWith(0, null, {
      aws: {
        cloudType: 'aws'
      }
    });
    const comp = renderComponent();
    const instance = comp.instance;
    instance._setCloud({title: 'aws'});
    const output = comp.renderer.getRenderOutput();
    const expected = (
      <div className="credential-add-edit">
        <div>
          {null}
          <DeploymentCloud
            acl={acl}
            addNotification={sinon.stub()}
            cloud={{title: 'aws'}}
            controllerIsReady={sinon.stub()}
            getCloudProviderDetails={sinon.stub()}
            key="deployment-cloud"
            listClouds={sinon.stub()}
            setCloud={sinon.stub()} />
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
    expect(output).toEqualJSX(expected);
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
