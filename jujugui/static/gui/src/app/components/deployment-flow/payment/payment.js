/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const AccountPaymentMethodCard = require('../../account/payment/methods/card/card');
const CreatePaymentUser = require('../../create-payment-user/create-payment-user');
const Spinner = require('../../spinner/spinner');

class DeploymentPayment extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      loading: false
    };
  }

  componentWillMount() {
    this._getUser();
  }

  componentWillUnmount() {
    this.xhrs.forEach((xhr) => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Get the payment details for the user.

    @method _getUser
  */
  _getUser() {
    this.setState({loading: true}, () => {
      const xhr = this.props.getUser(this.props.username, (error, user) => {
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
          this.props.setPaymentUser(user);
        });
      });
      this.xhrs.push(xhr);
    });
  }

  /**
    Generate the details for the payment method.

    @method _generatePaymentMethods
  */
  _generatePaymentMethods() {
    const methods = this.props.paymentUser.paymentMethods.map((method, i) => {
      return (
        <li className="deployment-payment__method"
          key={method.name + i}>
          <AccountPaymentMethodCard
            card={method} />
        </li>);
    });
    return (
      <ul className="deployment-payment__methods twelve-col">
        {methods}
      </ul>);
  }

  /**
    Generate the details for the payment method.

    @method _generatePaymentForm
  */
  _generatePaymentForm() {
    return (
      <CreatePaymentUser
        acl={this.props.acl}
        addNotification={this.props.addNotification}
        createCardElement={this.props.createCardElement}
        createToken={this.props.createToken}
        createUser={this.props.createUser}
        getCountries={this.props.getCountries}
        onUserCreated={this._getUser.bind(this)}
        username={this.props.username}
        validateForm={this.props.validateForm} />);
  }

  render() {
    let content;
    if (this.state.loading) {
      content = (
        <Spinner />);
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
};

DeploymentPayment.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  createCardElement: PropTypes.func,
  createToken: PropTypes.func,
  createUser: PropTypes.func,
  getCountries: PropTypes.func,
  getUser: PropTypes.func,
  paymentUser: PropTypes.object,
  setPaymentUser: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
  validateForm: PropTypes.func.isRequired
};

module.exports = DeploymentPayment;
