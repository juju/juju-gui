/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const UserProfileHeader = require('../user-profile/header/header');
const Panel = require('../panel/panel');
const AccountCredentials = require('./credentials/credentials');
const AccountPayment = require('./payment/payment');

class Account extends React.Component {
  /**
    Generate the payment details section.

    @method _generatePaymentDetails
  */
  _generatePaymentDetails() {
    if (this.props.showPay) {
      return (
        <AccountPayment
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          payment={this.props.payment}
          stripe={this.props.stripe}
          username={this.props.userInfo.profile}
          validateForm={this.props.initUtils.validateForm} />);
    } else {
      return null;
    }
  }

  /**
    Send account analytics.

    @param {String} action Some identifiable action.
    @param {String} label Name of the event.
    @param {Object} value An optional single depth object for extra info.
  */
  sendAnalytics(action, label, value) {
    this.props.sendAnalytics('Account', action, label, value);
  }

  render() {
    const links = [{
      label: 'Primary account'
    }];
    return (
      <Panel
        instanceName="account"
        visible={true}>
        <div className="twelve-col">
          <div className="inner-wrapper">
            <UserProfileHeader
              avatar=""
              changeState={this.props.changeState}
              closeState={{root: null}}
              links={links}
              userInfo={this.props.userInfo} />
            <AccountCredentials
              acl={this.props.acl}
              addNotification={this.props.addNotification}
              controllerAPI={this.props.controllerAPI}
              controllerIsReady={this.props.controllerIsReady}
              initUtils={this.props.initUtils}
              sendAnalytics={this.sendAnalytics.bind(this)}
              username={this.props.user} />
            {this._generatePaymentDetails()}
          </div>
        </div>
      </Panel>
    );
  }
};

Account.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  controllerAPI: shapeup.shape({
    getCloudCredentialNames: PropTypes.func.isRequired,
    listClouds: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc,
    revokeCloudCredential: PropTypes.func.isRequired,
    updateCloudCredential: PropTypes.func.isRequired
  }).isRequired,
  controllerIsReady: PropTypes.func.isRequired,
  initUtils: shapeup.shape({
    generateCloudCredentialName: PropTypes.func.isRequired,
    getCloudProviderDetails: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc,
    validateForm: PropTypes.func.isRequired
  }).isRequired,
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
  user: PropTypes.string.isRequired,
  userInfo: PropTypes.object.isRequired
};

module.exports = Account;
