/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const Spinner = require('../spinner/spinner');
const PaymentCharges = require('./charges/charges');
const PaymentDetails = require('./details/details');
const PaymentMethods = require('./methods/methods');
const CreatePaymentUser = require('../create-payment-user/create-payment-user');
const GenericButton = require('../generic-button/generic-button');

class Payment extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      loading: false,
      paymentUser: null,
      showAdd: false
    };
  }

  componentWillMount() {
    this._getUser();
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Show or hide the add payment user form.

    @method _toggleAdd
  */
  _toggleAdd() {
    this.setState({showAdd: !this.state.showAdd});
  }

  /**
    Store the payment user in state.

    @method _setUser
    @param {String} user The user deetails.
  */
  _setUser(user) {
    this.setState({paymentUser: user});
  }

  /**
    Handle the user having been created.

    @method _handleUserCreated
  */
  _handleUserCreated() {
    this._toggleAdd();
    this._getUser();
  }

  /**
    Get the payment details for the user.

    @method _getUser
  */
  _getUser() {
    this.setState({loading: true}, () => {
      const xhr = this.props.payment.getUser(this.props.username, (error, user) => {
        // If the user is not found we don't want to display the error, but
        // rather display a message about creating a user.
        if (error && error !== 'not found') {
          const message = 'Could not load user info';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        this.setState({loading: false}, () => {
          this._setUser(user);
        });
      });
      this.xhrs.push(xhr);
    });
  }

  /**
    Generate the details for the payment method.

    @returns {Object} The payment details markup.
  */
  _generatePaymentDetails() {
    const payment = this.props.payment;
    return (
      <div>
        <PaymentMethods
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          payment={payment && shapeup.addReshape({
            createPaymentMethod: payment.createPaymentMethod.bind(payment),
            getCountries: payment.getCountries.bind(payment),
            removePaymentMethod: payment.removePaymentMethod.bind(payment),
            updatePaymentMethod: payment.updatePaymentMethod.bind(payment)
          })}
          paymentUser={this.state.paymentUser}
          stripe={this.props.stripe}
          updateUser={this._getUser.bind(this)}
          username={this.props.username}
          validateForm={this.props.validateForm} />
        <PaymentDetails
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          payment={payment && shapeup.addReshape({
            addAddress: payment.addAddress.bind(payment),
            addBillingAddress: payment.addBillingAddress.bind(payment),
            getCountries: payment.getCountries.bind(payment),
            removeAddress: payment.removeAddress.bind(payment),
            removeBillingAddress: payment.removeBillingAddress.bind(payment),
            updateAddress: payment.updateAddress.bind(payment),
            updateBillingAddress: payment.updateBillingAddress.bind(payment)
          })}
          paymentUser={this.state.paymentUser}
          updateUser={this._getUser.bind(this)}
          username={this.props.username}
          validateForm={this.props.validateForm} />
        <PaymentCharges
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          payment={payment && shapeup.addReshape({
            getCharges: payment.getCharges.bind(payment),
            getReceipt: payment.getReceipt.bind(payment)
          })}
          username={this.props.username} />
      </div>);
  }

  /**
    Generate the details for the payment method.

    @method _generatePaymentForm
  */
  _generatePaymentForm() {
    return (
      <div className="payment__section">
        <div className="twelve-col">
          <h2 className="payment__title twelve-col">
            Enter your payment details
          </h2>
          <CreatePaymentUser
            acl={this.props.acl}
            addNotification={this.props.addNotification}
            createCardElement={this.props.stripe.createCardElement}
            createToken={this.props.stripe.createToken}
            createUser={this.props.payment.createUser}
            getCountries={this.props.payment.getCountries}
            onUserCreated={this._handleUserCreated.bind(this)}
            username={this.props.username}
            validateForm={this.props.validateForm} />
        </div>
      </div>);
  }

  /**
    Generate the a notice if there is no user.

    @method _generateNoUser
  */
  _generateNoUser() {
    return (
      <div className="payment__section">
        <h2 className="payment__title twelve-col">
          Payment details
        </h2>
        <div className="payment__no-user">
          <p>You are not set up to make payments.</p>
          <p>
            <GenericButton
              action={this._toggleAdd.bind(this)}
              type="inline-positive">
              Set up payments
            </GenericButton>
          </p>
        </div>
      </div>);
  }

  render() {
    let content;
    if (this.state.loading) {
      content = (
        <Spinner />);
    } else if (this.state.paymentUser) {
      content = this._generatePaymentDetails();
    } else if (this.state.showAdd) {
      content = this._generatePaymentForm();
    } else {
      content = this._generateNoUser();
    }
    return (
      <div className="payment">
        {content}
      </div>
    );
  }
};

Payment.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
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
  stripe: shapeup.shape({
    createCardElement: PropTypes.func,
    createToken: PropTypes.func,
    reshape: shapeup.reshapeFunc
  }),
  username: PropTypes.string.isRequired,
  validateForm: PropTypes.func.isRequired
};

module.exports = Payment;
