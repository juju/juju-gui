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

YUI.add('account-payment-method-card', function() {

  juju.components.AccountPaymentMethodCard = React.createClass({

    propTypes: {
      card: React.PropTypes.object.isRequired
    },

    getInitialState: function() {
      return {
        cardFlipped: false
      };
    },

    /**
      Handle toggling the card state.

      @method _handleCardClick
      @param {Object} e The click event from the checkbox.
    */
    _handleCardClick: function(e) {
      e.stopPropagation();
      this.setState({cardFlipped: !this.state.cardFlipped});
    },

    render: function() {
      const card = this.props.card;
      const cardClasses = classNames(
        'account__payment-card',
        {'account__payment-card--flipped': this.state.cardFlipped}
      );
      return (
        <div className={cardClasses}
          onClick={this._handleCardClick}>
          <div className="account__payment-card-container">
            <div className="account__payment-card-front">
              <div className="account__payment-card-overlay"></div>
              <div className="account__payment-card-name">
                {card.name}
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
                  {card.brand}
                </div>
              </div>
            </div>
          </div>
        </div>);
    }

  });

}, '', {
  requires: [
  ]
});
