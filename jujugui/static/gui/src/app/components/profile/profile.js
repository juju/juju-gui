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
  _handleDeploy(entityId, props) {
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
    const isActiveUsersProfile = props.controllerUser.split('@')[0] === props.userInfo.profile;
    const sectionsMap = new Map();
    const sectionInfo = this._getSectionInfo();

    if (profileUrl.full === 'revenue-statement') {
      return (
        <Panel
          instanceName="revenue-statement"
          visible={true}>
          <RevenueStatement />
        </Panel>
      );
    }

    if (sectionInfo.active === 'invoices' && sectionInfo.sub !== null) {
      return (
        <Panel
          instanceName="invoice"
          visible={true}>
          <Invoice />
        </Panel>
      );
    }

    if (isActiveUsersProfile) {
      sectionsMap.set('models', {
        label: 'Models',
        getComponent: () => {

          return (
            <ProfileModelList
              acl={props.acl}
              addNotification={props.addNotification}
              baseURL={props.baseURL}
              changeState={props.changeState}
              destroyModel={props.destroyModel}
              facadesExist={props.facadesExist}
              listModelsWithInfo={props.controllerAPI.listModelsWithInfo}
              switchModel={props.switchModel}
              userInfo={props.userInfo} />
          );
        }
      });
    }
    sectionsMap.set('charms', {
      label: 'Charms',
      getComponent: () => {
        const propTypes = ProfileCharmList.propTypes;
        return (
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
        );
      }
    });
    sectionsMap.set('bundles', {
      label: 'Bundles',
      getComponent: () => {
        const propTypes = ProfileBundleList.propTypes;
        return (
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
        );
      }
    });
    if (isActiveUsersProfile) {
      sectionsMap.set('credentials', {
        label: 'Cloud credentials',
        getComponent: () => {
          const propTypes = ProfileCredentialList.propTypes;
          return (
            <ProfileCredentialList
              acl={props.acl}
              addNotification={props.addNotification}
              controllerAPI={shapeup.fromShape(props.controllerAPI, propTypes.controllerAPI)}
              controllerIsReady={props.controllerIsReady}
              credential={this._getSectionInfo().sub}
              sendAnalytics={this._sendAnalytics.bind(this)}
              username={props.controllerUser} />
          );
        }
      });
    }
    if (isActiveUsersProfile && props.showPay) {
      sectionsMap.set('payment', {
        label: 'Payment',
        getComponent: () => {
          return (
            <Payment
              acl={props.acl}
              addNotification={props.addNotification}
              payment={props.payment}
              stripe={props.stripe}
              username={props.userInfo.profile} />
          );
        }
      });
      sectionsMap.set('invoices', {
        label: 'Invoices',
        getComponent: () => {
          return (<ProfileInvoiceList
            baseURL={props.baseURL}
            user={props.userInfo.external} />);
        }
      });
      sectionsMap.set('revenue-statement', {
        label: 'Revenue Statements',
        getComponent: () => {
          return (<ProfileInvoiceList
            baseURL={props.baseURL}
            user={props.userInfo.external} />);
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
        instanceName="profile"
        visible={true}>
        <div className="v1">
          <ProfileHeader
            changeState={props.changeState}
            controllerIP={props.controllerIP}
            getUser={props.getUser}
            gisf={props.gisf}
            userInfo={shapeup.fromShape(props.userInfo, ProfileHeader.propTypes.userInfo)} />
          <div className="p-strip--light is-shallow">
            <div className="row">
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
  controllerAPI: shapeup.shape({
    getCloudCredentialNames: PropTypes.func.isRequired,
    listClouds: PropTypes.func.isRequired,
    listModelsWithInfo: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc,
    revokeCloudCredential: PropTypes.func.isRequired,
    updateCloudCredential: PropTypes.func.isRequired
  }).isRequired,
  controllerIP: PropTypes.string,
  controllerIsReady: PropTypes.func.isRequired,
  controllerUser: PropTypes.string.isRequired,
  destroyModel: PropTypes.func.isRequired,
  facadesExist: PropTypes.bool.isRequired,
  generatePath: PropTypes.func.isRequired,
  getModelName: PropTypes.func.isRequired,
  getUser: PropTypes.func.isRequired,
  gisf: PropTypes.bool.isRequired,
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
