/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../../../generic-button/generic-button');
const SvgIcon = require('../../../svg-icon/svg-icon');

class PaymentMethodCard extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      cardFlipped: false
    };
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Generate the card logo.

    @method _generateLogo
  */
  _generateLogo() {
    // Convert the brand to the format required for the logo.
    const brand = this.props.card.brand.toLowerCase().replace(' ', '-');
    return (
      <SvgIcon
        name={`card-${brand}`}
        size="40" />);
  }

  /**
    Handle toggling the card state.

    @method _handleCardClick
    @param {Object} e The click event from the checkbox.
  */
  _handleCardClick(e) {
    e.stopPropagation();
    this.setState({cardFlipped: !this.state.cardFlipped});
  }

  /**
    Remove the payment method.

    @method _removePaymentMethod
  */
  _removePaymentMethod() {
    const xhr = this.props.removePaymentMethod(
      this.props.username, this.props.card.id, error => {
        if (error) {
          const message = 'Unable to remove the payment method';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        this.props.onPaymentMethodRemoved();
      });
    this.xhrs.push(xhr);
  }

  /**
    Generate the card actions.

    @method _generateActions
  */
  _generateActions() {
    if (!this.props.removePaymentMethod) {
      return null;
    }
    return (
      <div className="payment-card-actions no-margin-bottom">
        <GenericButton
          action={this.props.updatePaymentMethod}
          type="inline-neutral">
          Update payment
        </GenericButton>
        <GenericButton
          action={this._removePaymentMethod.bind(this)}
          type="inline-neutral">
          Remove payment details
        </GenericButton>
      </div>);
  }

  render() {
    const card = this.props.card;
    const cardClasses = classNames(
      'payment-card-wrapper',
      {'payment-card-wrapper--flipped': this.state.cardFlipped}
    );
    const address = card.address;
    const line2 = address.line2 ? (<p>{address.line2}</p>) : null;
    return (
      <div className="payment-card">
        <div className="five-col">
          <div className={cardClasses}
            onClick={this._handleCardClick.bind(this)}>
            <div className="payment-card-container">
              <div className="payment-card-front">
                <div className="payment-card-overlay"></div>
                <div className="payment-card-name">
                  {card.cardHolder}
                </div>
              </div>
              <div className="payment-card-back">
                <div className="payment-card-overlay"></div>
                <div className="payment-card-number">
                  xxxx xxxx xxxx {card.last4}
                </div>
                <div className="payment-card-bottom">
                  <div className="payment-card-expiry">
                    {card.month}/{card.year}
                  </div>
                  <div className="payment-card-brand">
                    {this._generateLogo()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="seven-col last-col">
          <div className="payment-card-info">
            <h4>Card address</h4>
            <p>{address.line1}</p>
            {line2}
            <p>{address.city} {address.state}</p>
            <p>{address.country} {address.postcode}</p>
          </div>
          {this._generateActions()}
        </div>
      </div>);
  }
};

PaymentMethodCard.propTypes = {
  addNotification: PropTypes.func,
  card: PropTypes.object.isRequired,
  onPaymentMethodRemoved: PropTypes.func,
  removePaymentMethod: PropTypes.func,
  updatePaymentMethod: PropTypes.func,
  username: PropTypes.string
};

module.exports = PaymentMethodCard;
