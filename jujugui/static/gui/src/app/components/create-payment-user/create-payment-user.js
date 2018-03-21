/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericInput = require('../generic-input/generic-input');
const GenericButton = require('../generic-button/generic-button');
const CardForm = require('../card-form/card-form');
const AddressForm = require('../address-form/address-form');

class CreatePaymentUser extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      billingAddressSame: true,
      business: true,
      cardAddressSame: true,
      loading: false
    };
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Validate the form.

    @method _validateForm
    @returns {Boolean} Whether the form is valid.
  */
  _validateForm() {
    let fields = [
      'emailAddress',
      'userAddress',
      'cardForm'
    ];
    if (this.state.business) {
      fields = fields.concat([
        'VATNumber',
        'businessName'
      ]);
    }
    if (!this.state.billingAddressSame) {
      fields.push('billingAddress');
    }
    if (!this.state.cardAddressSame) {
      fields.push('cardAddress');
    }
    return this.props.validateForm(fields, this.refs);
  }

  /**
    Handle creating the card and user.

    @method _handleAddUser
  */
  _handleAddUser() {
    const valid = this._validateForm();
    if (!valid) {
      return;
    }
    const refs = this.refs;
    const cardAddress = this.refs[
      `${this.state.cardAddressSame ? 'user' : 'card'}Address`].getValue();
    const card = refs.cardForm.getValue();
    const extra = {
      name: card.name,
      addressLine1: cardAddress.line1,
      addressLine2: cardAddress.line2,
      addressCity: cardAddress.city,
      addressState: cardAddress.state,
      addressZip: cardAddress.postcode,
      addressCountry: cardAddress.countryCode
    };
    const xhr = this.props.createToken(card.card, extra, (error, token) => {
      if (error) {
        const message = 'Could not create Stripe token';
        this.props.addNotification({
          title: message,
          message: `${message}: ${error}`,
          level: 'error'
        });
        console.error(message, error);
        return;
      }
      this._createUser(token.id);
    });
    this.xhrs.push(xhr);
  }

  /**
    Create a payment user.

    @method _createUser
    @param token {String} A Stripe token.
  */
  _createUser(token) {
    const refs = this.refs;
    const business = this.state.business;
    const address = this.refs.userAddress.getValue();
    let billingAddress;
    if (this.state.billingAddressSame) {
      billingAddress = address;
    } else {
      billingAddress = this.refs.billingAddress.getValue();
    }
    const user = {
      nickname: this.props.username,
      name: address.name,
      email: refs.emailAddress.getValue(),
      addresses: [address],
      vat: business && refs.VATNumber.getValue() || null,
      business: business,
      businessName: business && refs.businessName.getValue() || null,
      billingAddresses: [billingAddress],
      token: token,
      paymentMethodName: 'Default'
    };
    const xhr = this.props.createUser(user, (error, user) => {
      if (error) {
        const message = 'Could not create a payment user';
        this.props.addNotification({
          title: message,
          message: `${message}: ${error}`,
          level: 'error'
        });
        console.error(message, error);
        return;
      }
      // Reload the user as one should exist now.
      this.props.onUserCreated();
    });
    this.xhrs.push(xhr);
  }

  /**
    Update the state when the billing checkbox changes.

    @method _handleBillingSameChange
    @param evt {Object} The change event from the checkbox.
  */
  _handleBillingSameChange(evt) {
    this.setState({billingAddressSame: this.refs.billingAddressSame.checked});
  }

  /**
    Update the state when the card checkbox changes.

    @method _handleCardSameChange
    @param evt {Object} The change event from the checkbox.
  */
  _handleCardSameChange(evt) {
    this.setState({cardAddressSame: this.refs.cardAddressSame.checked});
  }

  /**
    Generate the fields for the card address.

    @method _generateCardAddressFields
  */
  _generateCardAddressFields() {
    if (this.state.cardAddressSame) {
      return null;
    }
    return (
      <div className="create-payment-user__card-address-form">
        <h2 className="create-payment-user__title">
          Card address
        </h2>
        <AddressForm
          addNotification={this.props.addNotification}
          disabled={this.props.acl.isReadOnly()}
          getCountries={this.props.getCountries}
          ref="cardAddress"
          validateForm={this.props.validateForm} />
      </div>);
  }

  /**
    Generate the fields for the billing address.

    @method _generateBillingAddressFields
  */
  _generateBillingAddressFields() {
    if (this.state.billingAddressSame) {
      return null;
    }
    return (
      <div className="create-payment-user__billing-address-form">
        <h2 className="create-payment-user__title">
          Billing address
        </h2>
        <AddressForm
          addNotification={this.props.addNotification}
          disabled={this.props.acl.isReadOnly()}
          getCountries={this.props.getCountries}
          ref="billingAddress"
          validateForm={this.props.validateForm} />
      </div>);
  }

  /**
    Generate the VAT field if required.

    @method _generateVATField
  */
  _generateVATField() {
    if (!this.state.business) {
      return null;
    }
    return (
      <div className="create-payment-user__vat">
        <GenericInput
          disabled={this.props.acl.isReadOnly()}
          label="VAT number (optional)"
          ref="VATNumber"
          required={false} />
      </div>);
  }

  /**
    Generate the business name field if required.

    @method _generateBusinessNameField
  */
  _generateBusinessNameField() {
    if (!this.state.business) {
      return null;
    }
    return (
      <GenericInput
        disabled={this.props.acl.isReadOnly()}
        label="Business name"
        ref="businessName"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]} />);
  }

  /**
    Update the state with the form type.

    @method _setFormType
    @param {Boolean} Whether the form is for a business.
  */
  _setFormType(business) {
    this.setState({business: business});
  }

  render() {
    const disabled = this.props.acl.isReadOnly();
    const required = {
      regex: /\S+/,
      error: 'This field is required.'
    };
    return (
      <div className="create-payment-user">
        <form className="create-payment-user__form">
          <div className="create-payment-user__form-content">
            <ul className="create-payment-user__form-type">
              <li className="create-payment-user__form-type-option">
                <label htmlFor="business">
                  <input checked={this.state.business}
                    id="business"
                    name="formType"
                    onChange={this._setFormType.bind(this, true)}
                    type="radio" />
                    Business use
                </label>
              </li>
              <li className="create-payment-user__form-type-option">
                <label htmlFor="personal">
                  <input checked={!this.state.business}
                    id="personal"
                    name="formType"
                    onChange={this._setFormType.bind(this, false)}
                    type="radio" />
                  Personal use
                </label>
              </li>
            </ul>
            {this._generateVATField()}
            <h2 className="create-payment-user__title">
              Your contact details
            </h2>
            {this._generateBusinessNameField()}
            <GenericInput
              disabled={disabled}
              label="Email address"
              ref="emailAddress"
              required={true}
              validate={[required]} />
            <AddressForm
              addNotification={this.props.addNotification}
              disabled={disabled}
              getCountries={this.props.getCountries}
              ref="userAddress"
              validateForm={this.props.validateForm} />
            <h2 className="create-payment-user__title">
              Payment information
            </h2>
            <CardForm
              acl={this.props.acl}
              createCardElement={this.props.createCardElement}
              ref="cardForm"
              validateForm={this.props.validateForm} />
            <label htmlFor="cardAddressSame">
              <input checked={this.state.cardAddressSame}
                id="cardAddressSame"
                name="cardAddressSame"
                onChange={this._handleCardSameChange.bind(this)}
                ref="cardAddressSame"
                type="checkbox" />
              Credit or debit card address is the same as above
            </label>
            <label htmlFor="billingAddressSame">
              <input checked={this.state.billingAddressSame}
                id="billingAddressSame"
                name="billingAddressSame"
                onChange={this._handleBillingSameChange.bind(this)}
                ref="billingAddressSame"
                type="checkbox" />
              Billing address is the same as above
            </label>
            {this._generateCardAddressFields()}
            {this._generateBillingAddressFields()}
            <div className="create-payment-user__add">
              <GenericButton
                action={this._handleAddUser.bind(this)}
                disabled={disabled}
                type="inline-positive">
                Add payment details
              </GenericButton>
            </div>
          </div>
        </form>
      </div>
    );
  }
};

CreatePaymentUser.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  createCardElement: PropTypes.func.isRequired,
  createToken: PropTypes.func.isRequired,
  createUser: PropTypes.func.isRequired,
  getCountries: PropTypes.func.isRequired,
  onUserCreated: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
  validateForm: PropTypes.func.isRequired
};

module.exports = CreatePaymentUser;
