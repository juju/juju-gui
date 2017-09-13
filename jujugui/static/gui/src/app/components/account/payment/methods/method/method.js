/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const GenericButton = require('../../../../generic-button/generic-button');
const GenericInput = require('../../../../generic-input/generic-input');
const ExpandingRow = require('../../../../expanding-row/expanding-row');
const AddressForm = require('../../../../address-form/address-form');
const AccountPaymentMethodCard = require('../card/card');

class AccountPaymentMethod extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      showForm: false
    };
  }

  componentWillUnmount() {
    this.xhrs.forEach((xhr) => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Generate a payment method.

    @method _generatePaymentMethod
  */
  _generatePaymentMethod() {
    return (
      <AccountPaymentMethodCard
        addNotification={this.props.addNotification}
        card={this.props.paymentMethod}
        onPaymentMethodRemoved={this.props.updateUser}
        removePaymentMethod={this.props.removePaymentMethod}
        updatePaymentMethod={this._toggleForm.bind(this)}
        username={this.props.username} />);
  }

  /**
    Update a payment method.
  */
  _updatePaymentMethod() {
    const valid = this.props.validateForm(
      ['expiry', 'cardAddress'], this.refs);
    if (!valid) {
      return;
    }
    const address = this.refs.cardAddress.getValue();
    const expiry = this.refs.expiry.getValue();
    const xhr = this.props.updatePaymentMethod(
      this.props.username, this.props.paymentMethod.id, address, expiry,
      error => {
        if (error) {
          const message = 'Could not update the payment method';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        this._toggleForm();
        // Reload the user to get the new payment method.
        this.props.updateUser();
      });
    this.xhrs.push(xhr);
  }

  /**
    Show or hide the edit payment method form.

    @method _toggleForm
  */
  _toggleForm() {
    this.setState({showForm: !this.state.showForm});
  }

  /**
    Generate the form for editing the payment method.
  */
  _generateEditForm() {
    const paymentMethod = this.props.paymentMethod;
    // Zero pad the month if it is less than 10.
    const month = `0${paymentMethod.month}`.slice(-2);
    return (
      <div className="account-payment-method__form">
        <AddressForm
          address={paymentMethod.address}
          disabled={this.props.acl.isReadOnly()}
          addNotification={this.props.addNotification}
          getCountries={this.props.getCountries}
          ref="cardAddress"
          showName={false}
          showPhone={false}
          validateForm={this.props.validateForm} />
        <div className="twelve-col">
          <GenericInput
            disabled={this.props.acl.isReadOnly()}
            label="Expiry MM/YY"
            ref="expiry"
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }, {
              regex: /[\d]{2}\/[\d]{2}/,
              error: 'The expiry must be in the format MM/YY'
            }]}
            value={`${month}/${paymentMethod.year}`} />
        </div>
        <div className="twelve-col account-payment-method__buttons">
          <GenericButton
            action={this._toggleForm.bind(this)}
            type="inline-neutral">
            Cancel
          </GenericButton>
          <GenericButton
            action={this._updatePaymentMethod.bind(this)}
            type="inline-positive">
            Update
          </GenericButton>
        </div>
      </div>);
  }

  render() {
    const content = this.state.showForm ?
      this._generateEditForm() : this._generatePaymentMethod();
    return (
      <ExpandingRow
        classes={{
          'user-profile__list-row': true,
          'twelve-col': true
        }}
        clickable={false}
        expanded={true}>
        <div></div>
        <div className="account-payment-method">
          {content}
        </div>
      </ExpandingRow>
    );
  }
};

AccountPaymentMethod.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  getCountries: PropTypes.func.isRequired,
  paymentMethod: PropTypes.object.isRequired,
  removePaymentMethod: PropTypes.func.isRequired,
  updatePaymentMethod: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
  validateForm: PropTypes.func.isRequired
};

module.exports = AccountPaymentMethod;
