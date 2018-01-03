/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const AccountCredentials = require('../account/credentials/credentials');
const ProfileNavigation = require('./navigation/navigation');
const ProfileHeader = require('./header/header');
const ProfileModelList = require('./model-list/model-list');
const ProfileCharmList = require('./charm-list/charm-list');
const ProfileBundleList = require('./bundle-list/bundle-list');
const Panel = require('../panel/panel');

/** Profile React component used to display user details. */
class Profile extends React.Component {
  /**
    Send profile analytics.
    @param {String} action Some identifiable action.
    @param {String} label Name of the event.
    @param {Object} value An optional single depth object for extra info.
  */
  _sendAnalytics(action, label, value) {
    this.props.sendAnalytics('Profile', action, label, value);
  }

  render() {
    const sectionsMap = Profile.sectionsMap;
    let section = sectionsMap.get(this.props.activeSection);
    let mapEntry;
    if (section === undefined) {
      // Grab the first element in the sectionsMap if the provided
      // activeSection does not exist.
      mapEntry = sectionsMap.entries().next().value;
      // The value of the Map entry.
      section = mapEntry[1];
    }

    return (
      <Panel
        instanceName="profile"
        visible={true}>
        <ProfileHeader
          changeState={this.props.changeState}
          username={this.props.userInfo.profile} />
        <div className="twelve-col">
          <div className="profile__content inner-wrapper">
            <ProfileNavigation
              // Use supplied activeSection or the key from the first map entry.
              activeSection={this.props.activeSection || mapEntry[0]}
              changeState={this.props.changeState}
              sectionsMap={sectionsMap} />
            {section.getComponent.call(this, this)}
          </div>
        </div>
      </Panel>
    );
  }

};

Profile.sectionsMap = new Map([
  ['models', {
    label: 'Models',
    getComponent: component => {
      return (
        <ProfileModelList
          acl={component.props.acl}
          addNotification={component.props.addNotification}
          baseURL={component.props.baseURL}
          changeState={component.props.changeState}
          facadesExist={component.props.facadesExist}
          destroyModels={component.props.destroyModels}
          listModelsWithInfo={component.props.listModelsWithInfo}
          switchModel={component.props.switchModel}
          userInfo={component.props.userInfo} />);
    }
  }],
  ['charms', {
    label: 'Charms',
    getComponent: component => {
      const propTypes = ProfileCharmList.propTypes;
      return (
        <ProfileCharmList
          acl={component.props.acl}
          addNotification={component.props.addNotification}
          baseURL={component.props.baseURL}
          changeState={component.props.changeState}
          charmstore={shapeup.fromShape(component.props.charmstore, propTypes.charmstore)}
          deployTarget={component.props.deployTarget}
          getModelName={component.props.getModelName}
          user={component.props.userInfo.external} />);
    }
  }],
  ['bundles', {
    label: 'Bundles',
    getComponent: component => {
      const propTypes = ProfileBundleList.propTypes;
      return (
        <ProfileBundleList
          acl={component.props.acl}
          addNotification={component.props.addNotification}
          baseURL={component.props.baseURL}
          changeState={component.props.changeState}
          charmstore={shapeup.fromShape(component.props.charmstore, propTypes.charmstore)}
          deployTarget={component.props.deployTarget}
          getModelName={component.props.getModelName}
          user={component.props.userInfo.external} />);
    }
  }],
  ['credentials', {
    label: 'Cloud credentials',
    getComponent: component => {
      return (
        <AccountCredentials
          acl={component.props.acl}
          addNotification={component.props.addNotification}
          controllerAPI={component.props.controllerAPI}
          controllerIsReady={component.props.controllerIsReady}
          initUtils={component.props.initUtils}
          sendAnalytics={component._sendAnalytics.bind(component)}
          username={component.props.controllerUser} />);
    }
  }]
]);

Profile.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired
  }).frozen.isRequired,
  activeSection: PropTypes.string,
  addNotification: PropTypes.func.isRequired,
  baseURL: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstore: PropTypes.object.isRequired,
  controllerAPI: shapeup.shape({
    getCloudCredentialNames: PropTypes.func.isRequired,
    listClouds: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc,
    revokeCloudCredential: PropTypes.func.isRequired,
    updateCloudCredential: PropTypes.func.isRequired
  }).isRequired,
  controllerIsReady: PropTypes.func.isRequired,
  controllerUser: PropTypes.string.isRequired,
  deployTarget: PropTypes.func.isRequired,
  destroyModels: PropTypes.func.isRequired,
  facadesExist: PropTypes.bool.isRequired,
  getModelName: PropTypes.func.isRequired,
  initUtils: shapeup.shape({
    generateCloudCredentialName: PropTypes.func.isRequired,
    getCloudProviderDetails: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc,
    validateForm: PropTypes.func.isRequired
  }).isRequired,
  listModelsWithInfo: PropTypes.func.isRequired,
  sendAnalytics: PropTypes.func.isRequired,
  switchModel: PropTypes.func.isRequired,
  // userInfo must have the following attributes:
  // - external: the external user name to use for retrieving data, for
  //   instance, from the charm store. Might be null if the user is being
  //   displayed for the current user and they are not authenticated to
  //   the charm store;
  // - isCurrent: whether the profile is being displayed for the currently
  //   authenticated user;
  // - profile: the user name for whom profile details must be displayed.
  userInfo: PropTypes.object.isRequired
};

module.exports = Profile;
