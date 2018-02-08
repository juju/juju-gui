/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');

const ProfileNavigation = require('./navigation/navigation');
const ProfileHeader = require('./header/header');
const ProfileModelList = require('./model-list/model-list');
const Profile = require('./profile');
const Panel = require('../panel/panel');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Profile', function() {

  function renderComponent(options={}) {
    return jsTestUtils.shallowRender(
      <Profile
        acl={options.acl || acl}
        activeSection={options.activeSection || undefined}
        addNotification={sinon.stub()}
        baseURL="/gui/"
        changeState={options.changeState || sinon.stub()}
        charmstore={{
          getDiagramURL: sinon.stub(),
          list: sinon.stub(),
          url: '/charmstore'
        }}
        controllerAPI={controllerAPI}
        controllerIsReady={sinon.stub()}
        controllerIP={'1.2.3.4'}
        controllerUser={options.controllerUser || 'spinach'}
        addToModel={options.addToModel || sinon.stub()}
        facadesExist={true}
        generatePath={options.generatePath || sinon.stub()}
        getModelName={options.getModelName || sinon.stub()}
        getUser={options.getUser || sinon.stub()}
        gisf={true}
        initUtils={initUtils}
        payment={options.payment}
        showPay={options.showPay || false}
        stripe={options.stripe}
        destroyModels={sinon.stub()}
        sendAnalytics={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={{profile: 'spinach'}} />, true);
  }
  let acl, controllerAPI, initUtils;

  beforeEach(() => {
    acl = shapeup.deepFreeze({isReadOnly: () => false});
    controllerAPI = {
      getCloudCredentialNames: sinon.stub(),
      listClouds: sinon.stub(),
      listModelsWithInfo: sinon.stub(),
      reshape: shapeup.reshapeFunc,
      revokeCloudCredential: sinon.stub(),
      updateCloudCredential: sinon.stub()
    };
    initUtils = {
      generateCloudCredentialName: sinon.stub(),
      getCloudProviderDetails: sinon.stub(),
      reshape: shapeup.reshapeFunc,
      validateForm: sinon.stub()
    };
  });

  it('can render', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <Panel
        instanceName="profile"
        visible={true}>
        <ProfileHeader
          changeState={sinon.stub()}
          controllerIP={'1.2.3.4'}
          getUser={sinon.stub()}
          gisf={true}
          username="spinach" />
        <div className="twelve-col">
          <div className="profile__content inner-wrapper">
            <ProfileNavigation
              activeSection={instance.sectionsMap.entries().next().value[0]}
              changeState={instance.props.changeState}
              sectionsMap={instance.sectionsMap} />
            <ProfileModelList
              acl={instance.props.acl}
              addNotification={instance.props.addNotification}
              baseURL={instance.props.baseURL}
              changeState={instance.props.changeState}
              facadesExist={instance.props.facadesExist}
              destroyModels={instance.props.destroyModels}
              listModelsWithInfo={instance.props.controllerAPI.listModelsWithInfo}
              switchModel={instance.props.switchModel}
              userInfo={instance.props.userInfo} />
          </div>
        </div>
      </Panel>
    );
    expect(output).toEqualJSX(expected);
  });

  it('does not show the payments section when the flag is off', () => {
    const renderer = renderComponent();
    const instance = renderer.getMountedInstance();
    assert.isUndefined(instance.sectionsMap.get('payment'));
  });

  it('can show the payments section when the flag is on', () => {
    const renderer = renderComponent({showPay: true});
    const instance = renderer.getMountedInstance();
    assert.isObject(instance.sectionsMap.get('payment'));
  });

  it('hides certain sections when viewing others profile pages', () => {
    const renderer = renderComponent({
      controllerUser: 'foo'
    });
    const instance = renderer.getMountedInstance();
    const allowedKeys = ['charms', 'bundles'];
    assert.deepEqual(Array.from(instance.sectionsMap.keys()), allowedKeys);
  });

  it('correctly parses the URL', () => {
    const renderer = renderComponent({
      activeSection: 'credentials/aws_test'
    });
    const instance = renderer.getMountedInstance();
    assert.deepEqual(instance._getProfileURL(), {
      full: 'credentials/aws_test',
      activeSection: 'credentials',
      subSection: 'aws_test'
    });
  });

  it('correctly parses the URL without a sub section', () => {
    const renderer = renderComponent({
      activeSection: 'credentials'
    });
    const instance = renderer.getMountedInstance();
    assert.deepEqual(instance._getProfileURL(), {
      full: 'credentials',
      activeSection: 'credentials',
      subSection: null
    });
  });

});
