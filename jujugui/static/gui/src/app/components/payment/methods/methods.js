/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const GenericButton = require('../../generic-button/generic-button');
const ExpandingRow = require('../../expanding-row/expanding-row');
const CardForm = require('../../card-form/card-form');
const AddressForm = require('../../address-form/address-form');
const PaymentMethod = require('./method/method');

class PaymentMethods extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      cardAddressSame: true,
      showAdd: false
    };
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
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
        <div className="payment-methods__no-methods">
          You do not have a payment method.
          <GenericButton
            action={this._toggleAdd.bind(this)}
            type="inline-neutral">
            Add payment method
          </GenericButton>
        </div>);
    }
    const payment = this.props.payment;
    const methods = user.paymentMethods.map(method => {
      return (
        <PaymentMethod
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          key={method.id}
          payment={payment && shapeup.addReshape({
            getCountries: payment.getCountries.bind(payment),
            removePaymentMethod: payment.removePaymentMethod.bind(payment),
            updatePaymentMethod: payment.updatePaymentMethod.bind(payment)
          })}
          paymentMethod={method}
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
    const xhr = this.props.stripe.createToken(card.card, extra, (error, token) => {
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
    const xhr = this.props.payment.createPaymentMethod(
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
        addNotification={this.props.addNotification}
        disabled={this.props.acl.isReadOnly()}
        getCountries={this.props.payment.getCountries}
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
        <div className="payment-methods__form">
          <div className="payment-methods__form-fields">
            <CardForm
              acl={this.props.acl}
              createCardElement={this.props.stripe.createCardElement}
              ref="cardForm"
              validateForm={this.props.validateForm} />
            <label htmlFor="cardAddressSame">
              <input checked={this.state.cardAddressSame}
                className="payment-methods__form-checkbox"
                id="cardAddressSame"
                name="cardAddressSame"
                onChange={this._handleCardSameChange.bind(this)}
                ref="cardAddressSame"
                type="checkbox" />
              Credit or debit card address is the same as default address.
            </label>
            {this._generateCardAddressFields()}
          </div>
          <div className="twelve-col payment-methods__form-buttons">
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
      <div className="payment__section">
        <h2 className="payment__title twelve-col">
          Payment details
        </h2>
        {content}
      </div>
    );
  }
};

PaymentMethods.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  payment: shapeup.shape({
    createPaymentMethod: PropTypes.func.isRequired,
    getCountries: PropTypes.func.isRequired,
    removePaymentMethod: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc,
    updatePaymentMethod: PropTypes.func.isRequired
  }),
  paymentUser: PropTypes.object.isRequired,
  stripe: shapeup.shape({
    createCardElement: PropTypes.func,
    createToken: PropTypes.func,
    reshape: shapeup.reshapeFunc
  }),
  updateUser: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
  validateForm: PropTypes.func.isRequired
};

module.exports = PaymentMethods;
