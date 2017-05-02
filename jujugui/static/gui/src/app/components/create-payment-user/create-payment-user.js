/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

YUI.add('create-payment-user', function() {

  juju.components.CreatePaymentUser = React.createClass({
    displayName: 'CreatePaymentUser',

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      createCardElement: React.PropTypes.func.isRequired,
      createToken: React.PropTypes.func.isRequired,
      createUser: React.PropTypes.func.isRequired,
      getCountries: React.PropTypes.func.isRequired,
      onUserCreated: React.PropTypes.func.isRequired,
      username: React.PropTypes.string.isRequired,
      validateForm: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];
      return {
        billingAddressSame: true,
        business: false,
        cardAddressSame: true,
        loading: false
      };
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    /**
      Validate the form.

      @method _validateForm
      @returns {Boolean} Whether the form is valid.
    */
    _validateForm: function() {
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
    },

    /**
      Handle creating the card and user.

      @method _handleAddUser
    */
    _handleAddUser: function() {
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
    },

    /**
      Create a payment user.

      @method _createUser
      @param token {String} A Stripe token.
    */
    _createUser: function(token) {
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
    },

    /**
      Update the state when the billing checkbox changes.

      @method _handleBillingSameChange
      @param evt {Object} The change event from the checkbox.
    */
    _handleBillingSameChange: function(evt) {
      this.setState({billingAddressSame: evt.currentTarget.checked});
    },

    /**
      Update the state when the card checkbox changes.

      @method _handleCardSameChange
      @param evt {Object} The change event from the checkbox.
    */
    _handleCardSameChange: function(evt) {
      this.setState({cardAddressSame: evt.currentTarget.checked});
    },

    /**
      Generate the fields for the card address.

      @method _generateCardAddressFields
    */
    _generateCardAddressFields: function() {
      if (this.state.cardAddressSame) {
        return null;
      }
      return (
        <div>
          <h2 className="create-payment-user__title">
            Card address
          </h2>
          <juju.components.AddressForm
            disabled={this.props.acl.isReadOnly()}
            addNotification={this.props.addNotification}
            getCountries={this.props.getCountries}
            ref="cardAddress"
            validateForm={this.props.validateForm} />
        </div>);
    },

    /**
      Generate the fields for the billing address.

      @method _generateBillingAddressFields
    */
    _generateBillingAddressFields: function() {
      if (this.state.billingAddressSame) {
        return null;
      }
      return (
        <div>
          <h2 className="create-payment-user__title">
            Billing address
          </h2>
          <juju.components.AddressForm
            disabled={this.props.acl.isReadOnly()}
            addNotification={this.props.addNotification}
            getCountries={this.props.getCountries}
            ref="billingAddress"
            validateForm={this.props.validateForm} />
        </div>);
    },

    /**
      Generate the VAT field if required.

      @method _generateVATField
    */
    _generateVATField: function() {
      if (!this.state.business) {
        return null;
      }
      return (
        <div className="create-payment-user__vat">
          <juju.components.GenericInput
            disabled={this.props.acl.isReadOnly()}
            label="VAT number (optional)"
            ref="VATNumber"
            required={false} />
        </div>);
    },

    /**
      Generate the business name field if required.

      @method _generateBusinessNameField
    */
    _generateBusinessNameField: function() {
      if (!this.state.business) {
        return null;
      }
      return (
        <juju.components.GenericInput
          disabled={this.props.acl.isReadOnly()}
          label="Business name"
          ref="businessName"
          required={true}
          validate={[{
            regex: /\S+/,
            error: 'This field is required.'
          }]} />);
    },

    /**
      Update the state with the form type.

      @method _setFormType
      @param {Boolean} Whether the form is for a business.
    */
    _setFormType: function(business) {
      this.setState({business: business});
    },

    render: function() {
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
                  <label htmlFor="personal">
                    <input checked={!this.state.business}
                      id="personal"
                      name="formType"
                      onChange={this._setFormType.bind(this, false)}
                      type="radio" />
                    Personal use
                  </label>
                </li>
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
              </ul>
              {this._generateVATField()}
              <h2 className="create-payment-user__title">
                Name and address
              </h2>
              {this._generateBusinessNameField()}
              <juju.components.GenericInput
                disabled={disabled}
                label="Email address"
                ref="emailAddress"
                required={true}
                validate={[required]} />
              <juju.components.AddressForm
                addNotification={this.props.addNotification}
                disabled={disabled}
                getCountries={this.props.getCountries}
                ref="userAddress"
                validateForm={this.props.validateForm} />
              <h2 className="create-payment-user__title">
                Payment information
              </h2>
              <juju.components.CardForm
                acl={this.props.acl}
                createCardElement={this.props.createCardElement}
                ref="cardForm"
                validateForm={this.props.validateForm} />
              <label htmlFor="cardAddressSame">
                <input checked={this.state.cardAddressSame}
                  id="cardAddressSame"
                  name="cardAddressSame"
                  onChange={this._handleCardSameChange}
                  ref="cardAddressSame"
                  type="checkbox" />
                Credit or debit card address is the same as above
              </label>
              <label htmlFor="billingAddressSame">
                <input checked={this.state.billingAddressSame}
                  id="billingAddressSame"
                  name="billingAddressSame"
                  onChange={this._handleBillingSameChange}
                  ref="billingAddressSame"
                  type="checkbox" />
                Billing address is the same as above
              </label>
              {this._generateCardAddressFields()}
              {this._generateBillingAddressFields()}
            </div>
            <div className="create-payment-user__add">
              <juju.components.GenericButton
                action={this._handleAddUser}
                disabled={disabled}
                type="inline-neutral"
                title="Add payment details" />
            </div>
          </form>
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'account-payment-method-card',
    'address-form',
    'card-form',
    'generic-button',
    'generic-input',
    'inset-select'
  ]
});
