/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../../../../generic-button/generic-button');
const SvgIcon = require('../../../../svg-icon/svg-icon');

class AccountPaymentMethodCard extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      cardFlipped: false
    };
  }

  componentWillUnmount() {
    this.xhrs.forEach((xhr) => {
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
        size="40"
        name={`card-${brand}`} />);
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
      <div className="four-col last-col account__payment-card-actions">
        <GenericButton
          action={this._removePaymentMethod.bind(this)}
          type="inline-neutral">
          Remove payment details
        </GenericButton>
        <GenericButton
          action={this.props.updatePaymentMethod}
          type="inline-neutral">
          Update payment details
        </GenericButton>
      </div>);
  }

  render() {
    const card = this.props.card;
    const cardClasses = classNames(
      'account__payment-card-wrapper',
      {'account__payment-card-wrapper--flipped': this.state.cardFlipped}
    );
    const address = card.address;
    const line2 = address.line2 ? (<p>{address.line2}</p>) : null;
    return (
      <div className="account__payment-card twelve-col">
        <div className="eight-col">
          <div className={cardClasses}
            onClick={this._handleCardClick.bind(this)}>
            <div className="account__payment-card-container">
              <div className="account__payment-card-front">
                <div className="account__payment-card-overlay"></div>
                <div className="account__payment-card-name">
                  {card.cardHolder}
                </div>
              </div>
              <div className="account__payment-card-back">
                <div className="account__payment-card-overlay"></div>
                <div className="account__payment-card-number">
                  xxxx xxxx xxxx {card.last4}
                </div>
                <div className="account__payment-card-bottom">
                  <div className="account__payment-card-expiry">
                    {card.month}/{card.year}
                  </div>
                  <div className="account__payment-card-brand">
                    {this._generateLogo()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="account__payment-card-info">
            <h4>Card address</h4>
            <p>{address.line1}</p>
            {line2}
            <p>{address.city} {address.state}</p>
            <p>{address.country} {address.postcode}</p>
          </div>
        </div>
        {this._generateActions()}
      </div>);
  }
};

AccountPaymentMethodCard.propTypes = {
  addNotification: PropTypes.func,
  card: PropTypes.object.isRequired,
  onPaymentMethodRemoved: PropTypes.func,
  removePaymentMethod: PropTypes.func,
  updatePaymentMethod: PropTypes.func,
  username: PropTypes.string
};

module.exports = AccountPaymentMethodCard;
