/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../../../generic-button/generic-button');
const ExpandingRow = require('../../../expanding-row/expanding-row');
const CardForm = require('../../../card-form/card-form');
const AddressForm = require('../../../address-form/address-form');
const AccountPaymentMethod = require('./method/method');

class AccountPaymentMethods extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      cardAddressSame: true,
      showAdd: false
    };
  }

  componentWillUnmount() {
    this.xhrs.forEach((xhr) => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Generate a list of payment method details.

    @method _generatePaymentMethods
  */
  _generatePaymentMethods() {
    const user = this.props.paymentUser;
    if (!user.paymentMethods.length) {
      return (
        <div className="account__payment-no-methods">
          You do not have a payment method.
          <GenericButton
            action={this._toggleAdd.bind(this)}
            type="inline-neutral">
            Add payment method
          </GenericButton>
        </div>);
    }
    const methods = user.paymentMethods.map(method => {
      return (
        <AccountPaymentMethod
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          getCountries={this.props.getCountries}
          key={method.id}
          paymentMethod={method}
          removePaymentMethod={this.props.removePaymentMethod}
          updatePaymentMethod={this.props.updatePaymentMethod}
          updateUser={this.props.updateUser}
          username={this.props.username}
          validateForm={this.props.validateForm} />);
    });
    return (
      <ul className="user-profile__list twelve-col">
        {methods}
      </ul>);
  }

  /**
    Handle creating the card and user.

    @method _createToken
  */
  _createToken() {
    let fields = ['cardForm'];
    if (!this.state.cardAddressSame) {
      fields.push('cardAddress');
    }
    const valid = this.props.validateForm(fields, this.refs);;
    if (!valid) {
      return;
    }
    const card = this.refs.cardForm.getValue();
    const paymentUser = this.props.paymentUser;
    const address = this.state.cardAddressSame ?
      paymentUser.addresses.length && paymentUser.addresses[0] :
      this.refs.cardAddress.getValue();
    const extra = {
      addressLine1: address.line1 || '',
      addressLine2: address.line2 || '',
      addressCity: address.city || '',
      addressState: address.county || '',
      addressZip: address.postcode || '',
      addressCountry: address.country || '',
      name: card.name
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
      this._createPaymentMethod(token.id);
    });
    this.xhrs.push(xhr);
  }

  /**
    Create the payment method using the card token.

    @method _createPaymentMethod
    @param token {String} A Stripe token.
  */
  _createPaymentMethod(token) {
    const xhr = this.props.createPaymentMethod(
      this.props.username, token, null, (error, method) => {
        if (error) {
          const message = 'Could not create the payment method';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        this._toggleAdd();
        // Reload the user to get the new payment method.
        this.props.updateUser();
      });
    this.xhrs.push(xhr);
  }

  /**
    Show or hide the add payment method form.

    @method _toggleAdd
  */
  _toggleAdd() {
    this.setState({showAdd: !this.state.showAdd});
  }

  /**
    Update the state when the card checkbox changes.

    @method _handleCardSameChange
    @param evt {Object} The change event from the checkbox.
  */
  _handleCardSameChange(evt) {
    this.setState({cardAddressSame: evt.currentTarget.checked});
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
      <AddressForm
        disabled={this.props.acl.isReadOnly()}
        addNotification={this.props.addNotification}
        getCountries={this.props.getCountries}
        ref="cardAddress"
        showName={false}
        showPhone={false}
        validateForm={this.props.validateForm} />);
  }

  /**
    Generate a form to add a payment method.

    @method _generateAddPaymentMethod
  */
  _generateAddPaymentMethod() {
    if (!this.state.showAdd) {
      return null;
    }
    return (
      <ExpandingRow
        classes={{'twelve-col': true}}
        clickable={false}
        expanded={true}>
        <div></div>
        <div className="account__payment-form">
          <div className="account__payment-form-fields">
            <CardForm
              acl={this.props.acl}
              createCardElement={this.props.createCardElement}
              ref="cardForm"
              validateForm={this.props.validateForm} />
            <label htmlFor="cardAddressSame">
              <input checked={this.state.cardAddressSame}
                className="account__payment-form-checkbox"
                id="cardAddressSame"
                name="cardAddressSame"
                onChange={this._handleCardSameChange.bind(this)}
                ref="cardAddressSame"
                type="checkbox" />
              Credit or debit card address is the same as default address.
            </label>
            {this._generateCardAddressFields()}
          </div>
          <div className="twelve-col account__payment-form-buttons">
            <GenericButton
              action={this._toggleAdd.bind(this)}
              type="inline-neutral">
              Cancel
            </GenericButton>
            <GenericButton
              action={this._createToken.bind(this)}
              type="inline-positive">
              Add
            </GenericButton>
          </div>
        </div>
      </ExpandingRow>);
  }

  render() {
    const content = this.state.showAdd ?
      this._generateAddPaymentMethod() : this._generatePaymentMethods();
    return (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Payment details
        </h2>
        {content}
      </div>
    );
  }
};

AccountPaymentMethods.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  createCardElement: PropTypes.func.isRequired,
  createPaymentMethod: PropTypes.func.isRequired,
  createToken: PropTypes.func.isRequired,
  getCountries: PropTypes.func.isRequired,
  paymentUser: PropTypes.object.isRequired,
  removePaymentMethod: PropTypes.func.isRequired,
  updatePaymentMethod: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
  validateForm: PropTypes.func.isRequired
};

module.exports = AccountPaymentMethods;
