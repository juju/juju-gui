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
      <juju.components.SvgIcon
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
        <juju.components.GenericButton
          action={this._removePaymentMethod.bind(this)}
          type="inline-neutral">
          Remove payment details
        </juju.components.GenericButton>
        <juju.components.GenericButton
          action={this.props.updatePaymentMethod}
          type="inline-neutral">
          Update payment details
        </juju.components.GenericButton>
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
  addNotification: React.PropTypes.func,
  card: React.PropTypes.object.isRequired,
  onPaymentMethodRemoved: React.PropTypes.func,
  removePaymentMethod: React.PropTypes.func,
  updatePaymentMethod: React.PropTypes.func,
  username: React.PropTypes.string
};

YUI.add('account-payment-method-card', function() {
  juju.components.AccountPaymentMethodCard = AccountPaymentMethodCard;
}, '', {
  requires: [
    'generic-button',
    'svg-icon'
  ]
});
