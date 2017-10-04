/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

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
          addAddress={this.props.addAddress}
          addBillingAddress={this.props.addBillingAddress}
          addNotification={this.props.addNotification}
          createCardElement={this.props.createCardElement}
          createPaymentMethod={this.props.createPaymentMethod}
          createToken={this.props.createToken}
          createUser={this.props.createUser}
          getCharges={this.props.getCharges}
          getCountries={this.props.getCountries}
          getReceipt={this.props.getReceipt}
          getUser={this.props.getUser}
          removeAddress={this.props.removeAddress}
          removeBillingAddress={this.props.removeBillingAddress}
          removePaymentMethod={this.props.removePaymentMethod}
          updateAddress={this.props.updateAddress}
          updateBillingAddress={this.props.updateBillingAddress}
          updatePaymentMethod={this.props.updatePaymentMethod}
          username={this.props.userInfo.profile}
          validateForm={this.props.validateForm} />);
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
              links={links}
              userInfo={this.props.userInfo} />
            <AccountCredentials
              acl={this.props.acl}
              addNotification={this.props.addNotification}
              controllerIsReady={this.props.controllerIsReady}
              generateCloudCredentialName={
                this.props.generateCloudCredentialName}
              getCloudCredentialNames={this.props.getCloudCredentialNames}
              getCloudProviderDetails={this.props.getCloudProviderDetails}
              listClouds={this.props.listClouds}
              revokeCloudCredential={this.props.revokeCloudCredential}
              sendAnalytics={this.sendAnalytics.bind(this)}
              updateCloudCredential={this.props.updateCloudCredential}
              username={this.props.user}
              validateForm={this.props.validateForm} />
            {this._generatePaymentDetails()}
          </div>
        </div>
      </Panel>
    );
  }
};

Account.propTypes = {
  acl: PropTypes.object.isRequired,
  addAddress: PropTypes.func,
  addBillingAddress: PropTypes.func,
  addNotification: PropTypes.func.isRequired,
  controllerIsReady: PropTypes.func.isRequired,
  createCardElement: PropTypes.func,
  createPaymentMethod: PropTypes.func,
  createToken: PropTypes.func,
  createUser: PropTypes.func,
  generateCloudCredentialName: PropTypes.func.isRequired,
  getCharges: PropTypes.func,
  getCloudCredentialNames: PropTypes.func.isRequired,
  getCloudProviderDetails: PropTypes.func.isRequired,
  getCountries: PropTypes.func,
  getReceipt: PropTypes.func,
  getUser: PropTypes.func,
  listClouds: PropTypes.func.isRequired,
  removeAddress: PropTypes.func,
  removeBillingAddress: PropTypes.func,
  removePaymentMethod: PropTypes.func,
  revokeCloudCredential: PropTypes.func.isRequired,
  sendAnalytics: PropTypes.func.isRequired,
  showPay: PropTypes.bool,
  updateAddress: PropTypes.func,
  updateBillingAddress: PropTypes.func,
  updateCloudCredential: PropTypes.func.isRequired,
  updatePaymentMethod: PropTypes.func,
  user: PropTypes.string.isRequired,
  userInfo: PropTypes.object.isRequired,
  validateForm: PropTypes.func.isRequired
};

module.exports = Account;
