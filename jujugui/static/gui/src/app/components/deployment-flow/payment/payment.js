/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const CreatePaymentUser = require('../../create-payment-user/create-payment-user');
const Link = require('../../link/link');
const PaymentMethodCard = require('../../payment/methods/card/card');
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
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
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
          <PaymentMethodCard
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
    const payment = this.props.payment;
    return (
      <CreatePaymentUser
        acl={this.props.acl}
        addNotification={this.props.addNotification}
        onUserCreated={this._getUser.bind(this)}
        payment={payment && shapeup.addReshape({
          createUser: payment.createUser.bind(payment),
          getCountries: payment.getCountries.bind(payment)
        })}
        stripe={this.props.stripe}
        username={this.props.username} />);
  }

  /**
    Generate the form for adding a payment method.
    @returns {Object} The form component JSX.
  */
  _generateProfileLink() {
    return (
      <div className="deployment-payment__no-methods">
        You do not have a payment method, you can add one from your&nbsp;
        <Link
          changeState={this.props.changeState}
          clickState={{
            gui: {
              deploy: null
            },
            hash: 'payment',
            profile: this.props.username
          }}
          generatePath={this.props.generatePath}>
          Profile
        </Link>.
      </div>);
  }

  render() {
    let content;
    const { paymentUser } = this.props;
    const hasPaymentMethods = paymentUser && paymentUser.paymentMethods &&
      paymentUser.paymentMethods.length;
    if (this.state.loading) {
      content = (
        <Spinner />);
    } else if (paymentUser && hasPaymentMethods) {
      content = this._generatePaymentMethods();
    } else if (paymentUser && !hasPaymentMethods) {
      content = this._generateProfileLink();
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
  changeState: PropTypes.func.isRequired,
  generatePath: PropTypes.func.isRequired,
  payment: shapeup.shape({
    createUser: PropTypes.func.isRequired,
    getCountries: PropTypes.func.isRequired,
    getUser: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc
  }),
  paymentUser: PropTypes.object,
  setPaymentUser: PropTypes.func.isRequired,
  stripe: shapeup.shape({
    createCardElement: PropTypes.func,
    createToken: PropTypes.func,
    reshape: shapeup.reshapeFunc
  }),
  username: PropTypes.string.isRequired
};

module.exports = DeploymentPayment;
