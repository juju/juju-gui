/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const Payment = require('../payment/payment');
const ProfileNavigation = require('./navigation/navigation');
const ProfileHeader = require('./header/header');
const ProfileModelList = require('./model-list/model-list');
const ProfileCharmList = require('./charm-list/charm-list');
const ProfileBundleList = require('./bundle-list/bundle-list');
const ProfileCredentialList = require('./credential-list/credential-list');
const ProfileInvoiceList = require('./invoice-list/invoice-list');
const Invoice = require('../invoice/invoice');
const Panel = require('../shared/panel/panel');
const RevenueStatement = require('../revenue-statement/revenue-statement');
const Link = require('../link/link');
const ErrorBoundary = require('../error-boundary/error-boundary');

require('./_profile.scss');

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

  /**
    Get the base path for the active section e.g. "credentials/aws_prod" would
    return "credentials".
    @returns {String} The active base section of the path.
  */
  _getSectionInfo() {
    const path = this.props.activeSection || '';
    const parts = path.split('/');
    return {
      full: path,
      active: parts[0],
      sub: parts.length > 1 ? parts.slice(1, parts.length).join('/') : null
    };
  }

  /**
  Handle deploying an entity.
  @param entityId {String} A charm or bundle id.
  */
  _handleDeploy(e, entityId, props) {
    e.stopPropagation();
    props.addToModel(entityId);
    props.changeState({
      hash: null,
      profile: null
    });
  }

  /**
    Generate a list of permissions.
    @param permissions {Array} The list of permissions.
    @returns {Object} The list as JSX.
  */
  _generatePermissions(permissions, props) {
    let items = permissions.map((username, i) => {
      let content;
      if (username === 'everyone') {
        content = username;
      } else {
        content = (
          <Link
            changeState={props.changeState}
            clickState={{
              hash: null,
              profile: username
            }}
            generatePath={props.generatePath}>
            {username}
          </Link>);
      }
      return (
        <span
          key={username + i}>
          {content}
        </span>);
    });
    if (items.length === 0) {
      items = (
        <span
          key="none">
          None
        </span>);
    }
    return (
      <span>
        {items}
      </span>);
  }

  render() {
    const props = this.props;
    const profileUrl = this._getSectionInfo();
    const isActiveUsersProfile = props.isActiveUsersProfile;
    const controllerConnection = props.controllerConnection;
    const sectionsMap = new Map();
    const sectionInfo = this._getSectionInfo();
    let cloudFacade = null;
    let modelManager = null;
    let userName = null;
    if (controllerConnection) {
      cloudFacade = controllerConnection.facades.cloud;
      modelManager = controllerConnection.facades.modelManager;
      userName = controllerConnection.info.user.displayName;
    }

    if (profileUrl.full === 'revenue-statement') {
      return (
        <Panel
          instanceName="revenue-statement"
          visible={true}>
          <ErrorBoundary>
            <RevenueStatement />
          </ErrorBoundary>
        </Panel>
      );
    }

    if (sectionInfo.active === 'invoices' && sectionInfo.sub !== null) {
      return (
        <Panel
          instanceName="invoice"
          visible={true}>
          <ErrorBoundary>
            <Invoice />
          </ErrorBoundary>
        </Panel>
      );
    }

    if (isActiveUsersProfile && controllerConnection) {
      sectionsMap.set('models', {
        label: 'Models',
        getComponent: () => {
          return (
            <ErrorBoundary>
              <ProfileModelList
                addNotification={props.addNotification}
                baseURL={props.baseURL}
                changeState={props.changeState}
                modelManager={modelManager}
                switchModel={props.switchModel}
                userName={userName} />
            </ErrorBoundary>
          );
        }
      });
    }
    sectionsMap.set('charms', {
      label: 'Charms',
      getComponent: () => {
        const propTypes = ProfileCharmList.propTypes;
        return (
          <ErrorBoundary>
            <ProfileCharmList
              acl={props.acl}
              addNotification={props.addNotification}
              addToModel={props.addToModel}
              bakery={props.bakery}
              baseURL={props.baseURL}
              changeState={props.changeState}
              charmstore={shapeup.fromShape(props.charmstore, propTypes.charmstore)}
              generatePath={props.generatePath}
              generatePermissions={this._generatePermissions}
              getModelName={props.getModelName}
              handleDeploy={this._handleDeploy}
              isActiveUsersProfile={isActiveUsersProfile}
              storeUser={props.storeUser}
              user={props.userInfo.external} />
          </ErrorBoundary>
        );
      }
    });
    sectionsMap.set('bundles', {
      label: 'Bundles',
      getComponent: () => {
        const propTypes = ProfileBundleList.propTypes;
        return (
          <ErrorBoundary>
            <ProfileBundleList
              acl={props.acl}
              addNotification={props.addNotification}
              addToModel={props.addToModel}
              bakery={props.bakery}
              baseURL={props.baseURL}
              changeState={props.changeState}
              charmstore={shapeup.fromShape(props.charmstore, propTypes.charmstore)}
              generatePath={props.generatePath}
              generatePermissions={this._generatePermissions}
              getModelName={props.getModelName}
              handleDeploy={this._handleDeploy}
              isActiveUsersProfile={isActiveUsersProfile}
              storeUser={props.storeUser}
              user={props.userInfo.external} />
          </ErrorBoundary>
        );
      }
    });
    if (isActiveUsersProfile) {
      sectionsMap.set('credentials', {
        label: 'Cloud credentials',
        getComponent: () => {
          return (
            <ErrorBoundary>
              <ProfileCredentialList
                acl={props.acl}
                addNotification={props.addNotification}
                cloudFacade={cloudFacade}
                credential={this._getSectionInfo().sub}
                modelManager={modelManager}
                sendAnalytics={this._sendAnalytics.bind(this)}
                userName={userName} />
            </ErrorBoundary>
          );
        }
      });
    }
    if (isActiveUsersProfile && props.showPay) {
      sectionsMap.set('payment', {
        label: 'Payment',
        getComponent: () => {
          return (
            <ErrorBoundary>
              <Payment
                acl={props.acl}
                addNotification={props.addNotification}
                payment={props.payment}
                stripe={props.stripe}
                username={props.userInfo.profile} />
            </ErrorBoundary>
          );
        }
      });
      sectionsMap.set('invoices', {
        label: 'Invoices',
        getComponent: () => {
          return (
            <ErrorBoundary>
              <ProfileInvoiceList
                baseURL={props.baseURL}
                user={props.userInfo.external} />
            </ErrorBoundary>
          );
        }
      });
      sectionsMap.set('revenue-statement', {
        label: 'Revenue Statements',
        getComponent: () => {
          return (
            <ErrorBoundary>
              <ProfileInvoiceList
                baseURL={props.baseURL}
                user={props.userInfo.external} />
            </ErrorBoundary>
          );
        }
      });
    }
    let section = sectionsMap.get(this._getSectionInfo().active);
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
        extraClasses="v1"
        instanceName="profile"
        visible={true}>
        <ErrorBoundary>
          <ProfileHeader
            changeState={props.changeState}
            controllerIP={props.controllerIP}
            getUser={props.getUser}
            gisf={props.gisf}
            userInfo={shapeup.fromShape(props.userInfo, ProfileHeader.propTypes.userInfo)} />
        </ErrorBoundary>
        <div className="p-strip--light is-shallow">
          <div className="row profile__main">
            <div className="col-3 u-no-margin--left">
              <ProfileNavigation
                // Use supplied activeSection or the key from the first map entry.
                activeSection={this._getSectionInfo().active || mapEntry[0]}
                changeState={props.changeState}
                sectionsMap={sectionsMap} />
            </div>
            <div className="col-9">
              {section.getComponent()}
            </div>
          </div>
        </div>
      </Panel>
    );
  }
}

Profile.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired
  }).frozen.isRequired,
  activeSection: PropTypes.string,
  addNotification: PropTypes.func.isRequired,
  addToModel: PropTypes.func.isRequired,
  bakery: PropTypes.object.isRequired,
  baseURL: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstore: PropTypes.object.isRequired,
  controllerConnection: PropTypes.object,
  controllerIP: PropTypes.string,
  controllerUser: PropTypes.string.isRequired,
  generatePath: PropTypes.func.isRequired,
  getModelName: PropTypes.func.isRequired,
  getUser: PropTypes.func.isRequired,
  gisf: PropTypes.bool.isRequired,
  isActiveUsersProfile: PropTypes.bool.isRequired,
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
  storeUser: PropTypes.func.isRequired,
  stripe: shapeup.shape({
    createCardElement: PropTypes.func,
    createToken: PropTypes.func
  }),
  switchModel: PropTypes.func.isRequired,
  userInfo: shapeup.shape({
    external: PropTypes.string,
    isCurrent: PropTypes.bool.isRequired,
    profile: PropTypes.string.isRequired
  }).isRequired
};

module.exports = Profile;
