/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const AccountCredentials = require('../account/credentials/credentials');
const AccountPayment = require('../account/payment/payment');
const ProfileNavigation = require('./navigation/navigation');
const ProfileHeader = require('./header/header');
const ProfileModelList = require('./model-list/model-list');
const ProfileCharmList = require('./charm-list/charm-list');
const ProfileBundleList = require('./bundle-list/bundle-list');
const Panel = require('../panel/panel');

/** Profile React component used to display user details. */
class Profile extends React.Component {
  constructor(props) {
    super(props);
    const activeUsersProfile = props.controllerUser.split('@')[0] === props.userInfo.profile;
    this.sectionsMap = new Map([
      ['models', {
        label: 'Models',
        getComponent: () => {
          return (
            <ProfileModelList
              acl={this.props.acl}
              addNotification={this.props.addNotification}
              baseURL={this.props.baseURL}
              changeState={this.props.changeState}
              facadesExist={this.props.facadesExist}
              destroyModels={this.props.destroyModels}
              listModelsWithInfo={this.props.listModelsWithInfo}
              switchModel={this.props.switchModel}
              userInfo={this.props.userInfo} />);
        }
      }],
      ['charms', {
        label: 'Charms',
        getComponent: () => {
          const propTypes = ProfileCharmList.propTypes;
          return (
            <ProfileCharmList
              acl={this.props.acl}
              activeUsersProfile={activeUsersProfile}
              addNotification={this.props.addNotification}
              baseURL={this.props.baseURL}
              changeState={this.props.changeState}
              charmstore={shapeup.fromShape(this.props.charmstore, propTypes.charmstore)}
              deployTarget={this.props.deployTarget}
              getModelName={this.props.getModelName}
              user={this.props.userInfo.external} />);
        }
      }],
      ['bundles', {
        label: 'Bundles',
        getComponent: () => {
          const propTypes = ProfileBundleList.propTypes;
          return (
            <ProfileBundleList
              acl={this.props.acl}
              activeUsersProfile={activeUsersProfile}
              addNotification={this.props.addNotification}
              baseURL={this.props.baseURL}
              changeState={this.props.changeState}
              charmstore={shapeup.fromShape(this.props.charmstore, propTypes.charmstore)}
              deployTarget={this.props.deployTarget}
              getModelName={this.props.getModelName}
              user={this.props.userInfo.external} />);
        }
      }],
      ['credentials', {
        label: 'Cloud credentials',
        getComponent: () => {
          return (
            <AccountCredentials
              acl={this.props.acl}
              addNotification={this.props.addNotification}
              controllerAPI={this.props.controllerAPI}
              controllerIsReady={this.props.controllerIsReady}
              initUtils={this.props.initUtils}
              sendAnalytics={this._sendAnalytics.bind(this)}
              username={this.props.controllerUser} />);
        }
      }]
    ]);

    if (this.props.showPay) {
      this.sectionsMap.set('payment', {
        label: 'Payment',
        getComponent: () => {
          return (
            <AccountPayment
              acl={this.props.acl}
              addNotification={this.props.addNotification}
              payment={this.props.payment}
              stripe={this.props.stripe}
              username={this.props.userInfo.profile}
              validateForm={this.props.initUtils.validateForm} />);
        }
      });
    }

    // If viewing a user profile that is not yours then do not show the
    // models or credentials lists.
    if (!activeUsersProfile) {
      this.sectionsMap.delete('models');
      this.sectionsMap.delete('credentials');
      this.sectionsMap.delete('payment');
    }

  }
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
    const sectionsMap = this.sectionsMap;
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
            {section.getComponent()}
          </div>
        </div>
      </Panel>
    );
  }

};

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
  payment: shapeup.shape({
    addAddress: PropTypes.func,
    addBillingAddress: PropTypes.func,
    createPaymentMethod: PropTypes.func,
    createUser: PropTypes.func,
    getCharges: PropTypes.func,
    getCountries: PropTypes.func,
    getReceipt: PropTypes.func,
    getUser: PropTypes.func,
    removeAddress: PropTypes.func,
    removeBillingAddress: PropTypes.func,
    removePaymentMethod: PropTypes.func,
    reshape: shapeup.reshapeFunc,
    updateAddress: PropTypes.func,
    updateBillingAddress: PropTypes.func,
    updatePaymentMethod: PropTypes.func
  }),
  sendAnalytics: PropTypes.func.isRequired,
  showPay: PropTypes.bool,
  stripe: shapeup.shape({
    createCardElement: PropTypes.func,
    createToken: PropTypes.func,
    reshape: shapeup.reshapeFunc
  }),
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
