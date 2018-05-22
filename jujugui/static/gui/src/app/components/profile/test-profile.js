/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

const ProfileNavigation = require('./navigation/navigation');
const ProfileHeader = require('./header/header');
const ProfileModelList = require('./model-list/model-list');
const Profile = require('./profile');
const Panel = require('../panel/panel');

describe('Profile', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
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
      payment={options.payment}
      sendAnalytics={sinon.stub()}
      showPay={options.showPay || false}
      storeUser={options.storeUser || sinon.stub()}
      stripe={options.stripe}
      switchModel={sinon.stub()}
      userInfo={options.userInfo || userInfo} />
  );

  // Return the sectionsMap stored in the given component.
  function getSectionsMap(wrapper) {
    return wrapper.find('ProfileNavigation').prop('sectionsMap');
    // const navigation = comp.props.children[1].props.children.props.children[0];
    // return navigation.props.sectionsMap;
  }

  let acl, controllerAPI, userInfo;

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
    userInfo = {
      isCurrent: true,
      profile: 'spinach'
    };
  });

  it('can render', () => {
    const wrapper = renderComponent();
    const expected = (
      <div>
        <Panel
          instanceName="profile"
          visible={true}>
          <ProfileHeader
            changeState={sinon.stub()}
            controllerIP={'1.2.3.4'}
            getUser={sinon.stub()}
            gisf={true}
            userInfo={userInfo} />
          <div className="twelve-col">
            <div className="profile__content inner-wrapper">
              <ProfileNavigation
                activeSection="models"
                changeState={sinon.stub()}
                sectionsMap={new Map()} />
              <ProfileModelList
                acl={acl}
                addNotification={sinon.stub()}
                baseURL="/gui/"
                changeState={sinon.stub()}
                destroyModel={sinon.stub()}
                facadesExist={true}
                listModelsWithInfo={sinon.stub()}
                switchModel={sinon.stub()}
                userInfo={userInfo} />
            </div>
          </div>
        </Panel>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('does not show the payments section when the flag is off', () => {
    const wrapper = renderComponent();
    const sectionsMap = getSectionsMap(wrapper);
    assert.strictEqual(sectionsMap.get('payment'), undefined);
  });

  it('shows the payments section when the flag is on', () => {
    const wrapper = renderComponent({showPay: true});
    const sectionsMap = getSectionsMap(wrapper);
    assert.isObject(sectionsMap.get('payment'));
  });

  it('hides certain sections when viewing others profile pages', () => {
    const wrapper = renderComponent({controllerUser: 'foo'});
    const sectionsMap = getSectionsMap(wrapper);
    const allowedKeys = ['charms', 'bundles'];
    assert.deepEqual(Array.from(sectionsMap.keys()), allowedKeys);
  });

  it('correctly parses the URL', () => {
    const wrapper = renderComponent({activeSection: 'credentials/aws_test'});
    const instance = wrapper.instance();
    assert.deepEqual(instance._getSectionInfo(), {
      full: 'credentials/aws_test',
      active: 'credentials',
      sub: 'aws_test'
    });
  });

  it('correctly parses the URL without a sub section', () => {
    const wrapper = renderComponent({
      activeSection: 'credentials'
    });
    const instance = wrapper.instance();
    assert.deepEqual(instance._getSectionInfo(), {
      full: 'credentials',
      active: 'credentials',
      sub: null
    });
  });

});
