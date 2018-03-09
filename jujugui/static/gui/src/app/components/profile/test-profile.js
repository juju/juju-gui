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
        addToModel={options.addToModel || sinon.stub()}
        bakery={{}}
        baseURL="/gui/"
        changeState={options.changeState || sinon.stub()}
        charmstore={{
          getDiagramURL: sinon.stub(),
          getMacaroon: sinon.stub(),
          list: sinon.stub(),
          url: '/charmstore'
        }}
        controllerAPI={controllerAPI}
        controllerIP={'1.2.3.4'}
        controllerIsReady={sinon.stub()}
        controllerUser={options.controllerUser || 'spinach'}
        destroyModel={sinon.stub()}
        facadesExist={true}
        generatePath={options.generatePath || sinon.stub()}
        getModelName={options.getModelName || sinon.stub()}
        getUser={options.getUser || sinon.stub()}
        gisf={true}
        initUtils={initUtils}
        payment={options.payment}
        sendAnalytics={sinon.stub()}
        showPay={options.showPay || false}
        storeUser={options.storeUser || sinon.stub()}
        stripe={options.stripe}
        switchModel={sinon.stub()}
        userInfo={{
          isCurrent: true,
          profile: 'spinach'
        }} />, true);
  }

  // Return the sectionsMap stored in the given component.
  function getSectionsMap(comp) {
    const navigation = comp.props.children[1].props.children.props.children[0];
    return navigation.props.sectionsMap;
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
          userInfo={instance.props.userInfo} />
        <div className="twelve-col">
          <div className="profile__content inner-wrapper">
            <ProfileNavigation
              activeSection="models"
              changeState={instance.props.changeState}
              sectionsMap={new Map()} />
            <ProfileModelList
              acl={instance.props.acl}
              addNotification={instance.props.addNotification}
              baseURL={instance.props.baseURL}
              changeState={instance.props.changeState}
              destroyModel={instance.props.destroyModel}
              facadesExist={instance.props.facadesExist}
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
    const sectionsMap = getSectionsMap(renderer.getRenderOutput());
    assert.strictEqual(sectionsMap.get('payment'), undefined);
  });

  it('shows the payments section when the flag is on', () => {
    const renderer = renderComponent({showPay: true});
    const sectionsMap = getSectionsMap(renderer.getRenderOutput());
    assert.isObject(sectionsMap.get('payment'));
  });

  it('hides certain sections when viewing others profile pages', () => {
    const renderer = renderComponent({controllerUser: 'foo'});
    const sectionsMap = getSectionsMap(renderer.getRenderOutput());
    const allowedKeys = ['charms', 'bundles'];
    assert.deepEqual(Array.from(sectionsMap.keys()), allowedKeys);
  });

  it('correctly parses the URL', () => {
    const renderer = renderComponent({activeSection: 'credentials/aws_test'});
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
