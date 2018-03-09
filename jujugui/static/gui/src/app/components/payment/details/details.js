/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const GenericButton = require('../../generic-button/generic-button');
const GenericInput = require('../../generic-input/generic-input');
const PaymentDetailsAddress = require('./address/address');

class PaymentDetails extends React.Component {
  constructor() {
    super();
    this.state = {
      addressEdit: false,
      billingAddressEdit: false
    };
  }

  /**
    Show the edit address form.

    @method _toggleAddressEdit
  */
  _toggleAddressEdit() {
    this.setState({addressEdit: !this.state.addressEdit});
  }

  /**
    Show the edit address form.

    @method _toggleBillingAddressEdit
  */
  _toggleBillingAddressEdit() {
    this.setState({billingAddressEdit: !this.state.billingAddressEdit});
  }

  /**
    Generate the user's details.

    @method _generateDetails
  */
  _generateDetails() {
    const user = this.props.paymentUser;
    const business = user.business;
    const disabled = this.props.acl.isReadOnly();
    return (
      <div className="payment-details-view twelve-col">
        <div className="payment-details-fields">
          <GenericInput
            disabled={true}
            label="Name"
            value={user.name} />
          <GenericInput
            disabled={true}
            label="Email address"
            value={user.email} />
          {business ? (
            <GenericInput
              disabled={true}
              label="VAT number (optional)"
              value={user.vat} />) : null}
          {business ? (
            <GenericInput
              disabled={true}
              label="Business name"
              value={user.businessName} />) : null}
        </div>
        <h4>
          Addresses
          {this.state.addressEdit ? null : (
            <GenericButton
              action={this._toggleAddressEdit.bind(this)}
              disabled={disabled}
              extraClasses="payment-details-title-button"
              type="inline-neutral">
              Edit
            </GenericButton>)}
        </h4>
        {this._generateAddresses(user.addresses)}
        <h4>
          Billing addresses
          {this.state.billingAddressEdit ? null : (
            <GenericButton
              action={this._toggleBillingAddressEdit.bind(this)}
              disabled={disabled}
              extraClasses="payment-details-title-button"
              type="inline-neutral">
              Edit
            </GenericButton>)}
        </h4>
        {this._generateAddresses(user.billingAddresses, true)}
      </div>);
  }

  /**
    Generate the address fields.

    @method _generateAddresses
    @param {Array} adresses A list of address.
    @param {Boolean} billing Whether this is a billing address.
    @returns {Object} The markup for the addresses.
  */
  _generateAddresses(addresses, billing=false) {
    let list = addresses.map(address => {
      return (
        <PaymentDetailsAddress
          acl={this.props.acl}
          addAddress={
            billing ? this.props.payment.addBillingAddress : this.props.payment.addAddress}
          addNotification={this.props.addNotification}
          address={address}
          close={
            billing ? this._toggleBillingAddressEdit :
              this._toggleAddressEdit}
          getCountries={this.props.payment.getCountries}
          key={address.name}
          removeAddress={
            billing ? this.props.payment.removeBillingAddress :
              this.props.payment.removeAddress}
          showEdit={
            billing ? this.state.billingAddressEdit : this.state.addressEdit}
          updateAddress={
            billing ? this.props.payment.updateBillingAddress :
              this.props.payment.updateAddress}
          updated={this.props.updateUser}
          username={this.props.username}
          validateForm={this.props.validateForm} />);
    });
    return (
      <ul className="payment-details-addresses">
        {list}
      </ul>);
  }

  render() {
    return (
      <div className="payment__section">
        <h2 className="payment__title twelve-col">
          Account details
        </h2>
        {this._generateDetails()}
      </div>
    );
  }
};

PaymentDetails.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  payment: shapeup.shape({
    addAddress: PropTypes.func,
    addBillingAddress: PropTypes.func,
    getCountries: PropTypes.func,
    removeAddress: PropTypes.func,
    removeBillingAddress: PropTypes.func,
    reshape: shapeup.reshapeFunc,
    updateAddress: PropTypes.func,
    updateBillingAddress: PropTypes.func
  }),
  paymentUser: PropTypes.object.isRequired,
  updateUser: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
  validateForm: PropTypes.func.isRequired
};

module.exports = PaymentDetails;
