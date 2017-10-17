/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const ProfileNavigation = require('./navigation/navigation');
const ProfileHeader = require('./header/header');
const ProfileModelList = require('./model-list/model-list');
const ProfileCharmList = require('./charm-list/charm-list');
const ProfileBundleList = require('./bundle-list/bundle-list');
const Panel = require('../panel/panel');

const shapeup = require('shapeup');

/** Profile React component used to display user details. */
class Profile extends React.Component {

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
        <ProfileHeader />
        <div className="profile__content">
          <ProfileNavigation
            // Use supplied activeSection or the key from the first map entry.
            activeSection={this.props.activeSection || mapEntry[0]}
            changeState={this.props.changeState}
            sectionsMap={sectionsMap}/>
          {section.getComponent.call(this, this)}
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
          addNotification={component.props.addNotification}
          baseURL={component.props.baseURL}
          changeState={component.props.changeState}
          charmstore={shapeup.fromShape(component.props.charmstore, propTypes.charmstore)}
          user={component.props.userInfo.external} />);
    }
  }],
  ['bundles', {
    label: 'Bundles',
    getComponent: component => {
      const propTypes = ProfileBundleList.propTypes;
      return (
        <ProfileBundleList
          addNotification={component.props.addNotification}
          baseURL={component.props.baseURL}
          changeState={component.props.changeState}
          charmstore={shapeup.fromShape(component.props.charmstore, propTypes.charmstore)}
          user={component.props.userInfo.external} />);
    }
  }],
  ['credentials', {
    label: 'Cloud Credentials',
    getComponent: context => 'Cloud Credentials'
  }]
]);

Profile.propTypes = {
  acl: PropTypes.object,
  activeSection: PropTypes.string,
  addNotification: PropTypes.func.isRequired,
  baseURL: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstore: PropTypes.object.isRequired,
  destroyModels: PropTypes.func.isRequired,
  facadesExist: PropTypes.bool.isRequired,
  listModelsWithInfo: PropTypes.func.isRequired,
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
