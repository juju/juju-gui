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

YUI.add('deployment-payment', function() {

  juju.components.DeploymentPayment = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      getUser: React.PropTypes.func,
      paymentUser: React.PropTypes.object,
      setPaymentUser: React.PropTypes.func.isRequired,
      username: React.PropTypes.string.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];
      return {
        billingAddressSame: true,
        business: false,
        cardAddressSame: true,
        countries: [],
        loading: false
      };
    },

    componentWillMount: function() {
      this.setState({loading: true}, () => {
        const xhr = this.props.getUser(this.props.username, (error, user) => {
          if (error) {
            this.props.addNotification({
              title: 'Could not load user info',
              message: `Could not load user info: ${error}`,
              level: 'error'
            });
            console.error('Could not load user info', error);
            return;
          }
          this.setState({loading: false}, () => {
            this.props.setPaymentUser(user);
          });
        });
        this.xhrs.push(xhr);
      });
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    /**
      Generate the details for the payment method.

      @method _generatePaymentMethods
    */
    _generatePaymentMethods: function() {
      const methods = this.props.paymentUser.paymentMethods.map((method, i) => {
        return (
          <li className="deployment-payment__method"
            key={method.name + i}>
            <juju.components.AccountPaymentMethodCard
              card={method} />
          </li>);
      });
      return (
        <ul className="deployment-payment__methods twelve-col">
          {methods}
        </ul>);
    },

    /**
      Generate the details for the payment method.

      @method _generatePaymentForm
    */
    _generatePaymentForm: function() {
      const disabled = this.props.acl.isReadOnly();
      return (
        <form className="deployment-payment__form">
          <div className="deployment-payment__form-content">
            <ul className="deployment-payment__form-type">
              <li className="deployment-payment__form-type-option">
                <label htmlFor="personal">
                  <input checked={!this.state.business}
                    id="personal"
                    name="formType"
                    onChange={this._setFormType.bind(this, false)}
                    type="radio" />
                  Personal use
                </label>
              </li>
              <li className="deployment-payment__form-type-option">
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
            <h2 className="deployment-payment__title">
              Name and address
            </h2>
            {this._generateBusinessNameField()}
            {this._generateAddressFields()}
            <h2 className="deployment-payment__title">
              Payment information
            </h2>
            <juju.components.GenericInput
              disabled={disabled}
              label="Card number"
              required={true} />
            <div className="twelve-col">
              <div className="six-col">
                <juju.components.GenericInput
                  disabled={disabled}
                  label="Expiry MM/YY"
                  required={true} />
              </div>
              <div className="six-col last-col">
                <juju.components.GenericInput
                  disabled={disabled}
                  label="Security number (CVC)"
                  required={true} />
              </div>
            </div>
            <div className="twelve-col">
              <juju.components.GenericInput
                disabled={disabled}
                label="Name on card"
                required={true} />
            </div>
            <label htmlFor="cardAddressSame">
              <input checked={this.state.cardAddressSame}
                id="cardAddressSame"
                name="cardAddressSame"
                onChange={this._handleCardSameChange}
                type="checkbox" />
              Credit or debit card address is the same as above
            </label>
            <label htmlFor="billingAddressSame">
              <input checked={this.state.billingAddressSame}
                id="billingAddressSame"
                name="billingAddressSame"
                onChange={this._handleBillingSameChange}
                type="checkbox" />
              Billing address is the same as above
            </label>
            {this._generateCardAddressFields()}
            {this._generateBillingAddressFields()}
          </div>
          <div className="deployment-payment__add">
          <juju.components.GenericButton
            action={null}
            disabled={disabled}
            type="inline-neutral"
            title="Add payment details" />
          </div>
        </form>);
    },

    /**
      Generate the fields for an address.

      @method _generateAddressFields
    */
    _generateAddressFields: function() {
      const disabled = this.props.acl.isReadOnly();
      return (
        <div>
          <juju.components.InsetSelect
            disabled={disabled}
            label="Country"
            onChange={null}
            options={[]} />
          <juju.components.GenericInput
            disabled={disabled}
            label="Full name"
            required={true} />
          <juju.components.GenericInput
            disabled={disabled}
            label="Address line 1"
            required={true} />
          <juju.components.GenericInput
            disabled={disabled}
            label="Address line 2 (optional)"
            required={false} />
          <juju.components.GenericInput
            disabled={disabled}
            label="State/province (optional)"
            required={false} />
          <div className="twelve-col">
            <div className="six-col">
              <juju.components.GenericInput
                disabled={disabled}
                label="Town/city"
                required={true} />
            </div>
            <div className="six-col last-col">
              <juju.components.GenericInput
                disabled={disabled}
                label="Postcode"
                required={true} />
            </div>
            <div className="four-col">
              <juju.components.InsetSelect
                disabled={disabled}
                label="Country code"
                onChange={null}
                options={[]} />
            </div>
            <div className="eight-col last-col">
              <juju.components.GenericInput
                disabled={disabled}
                label="Phone number"
                required={true} />
            </div>
          </div>
        </div>);
    },

    /**
      Update the state when the billing checkbox changes.

      @method _handleBillingSameChange
      @param {Object} The change event from the checkbox.
    */
    _handleBillingSameChange: function(e) {
      this.setState({billingAddressSame: e.currentTarget.checked});
    },

    /**
      Update the state when the card checkbox changes.

      @method _handleCardSameChange
      @param {Object} The change event from the checkbox.
    */
    _handleCardSameChange: function(e) {
      this.setState({cardAddressSame: e.currentTarget.checked});
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
          <h2 className="deployment-payment__title">
            Card address
          </h2>
          {this._generateAddressFields()}
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
          <h2 className="deployment-payment__title">
            Billing address
          </h2>
          {this._generateAddressFields()}
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
        <div className="deployment-payment__vat">
          <juju.components.GenericInput
            disabled={this.props.acl.isReadOnly()}
            label="VAT number (optional)"
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
          required={true} />);
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
      let content;
      if (this.state.loading) {
        content = (
          <juju.components.Spinner />);
      } else if (this.props.paymentUser) {
        content = this._generatePaymentMethods();
      } else {
        content = this._generatePaymentForm();
      }
      return (
        <div className="deployment-payment">
          {content}
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'generic-button',
    'generic-input',
    'inset-select',
    'loading-spinner'
  ]
});
