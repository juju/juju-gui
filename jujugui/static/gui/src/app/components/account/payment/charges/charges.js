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

YUI.add('account-payment-charges', function() {

  juju.components.AccountPaymentCharges = React.createClass({
    displayName: 'AccountPaymentCharges',

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      getCharges: React.PropTypes.func.isRequired,
      getReceipt: React.PropTypes.func.isRequired,
      username: React.PropTypes.string.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];
      return {
        charges: null,
        loading: false,
        showPopup: ''
      };
    },

    componentWillMount: function() {
      this._getCharges();
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    /**
      Show or hide the receipt popup.

      @param chargeId {String|Null} The charge to display.
    */
    _togglePopup: function(chargeId=null) {
      this.setState({showPopup: chargeId});
    },

    /**
      Get the payment details for the user.

      @method _getCharges
    */
    _getCharges: function() {
      this.setState({loading: true}, () => {
        const username = this.props.username;
        const xhr = this.props.getCharges(username, (error, response) => {
          if (error && error !== 'not found') {
            const message = 'Could not load the list of charges';
            this.props.addNotification({
              title: message,
              message: `${message}: ${error}`,
              level: 'error'
            });
            console.error(message, error);
            return;
          }
          this.setState({loading: false, charges: response});
        });
        this.xhrs.push(xhr);
      });
    },

    /**
      Generate the line items for a charge.

      @param lineItems {Array} The list of line items.
      @returns {Object} The markup for the line items.
    */
    _generateLineItems: function(lineItems) {
      if (!lineItems || !lineItems.length) {
        return (
          <div className="account-payment-charges__line-items">
            There are no items for this charge.
          </div>);
      }
      const items = lineItems.map((item, i) => {
        return (
          <li className="user-profile__list-row twelve-col"
            key={item.name + i}>
            <div className="three-col no-margin-bottom">
              {item.name}
            </div>
            <div className="three-col no-margin-bottom">
              {item.details}
            </div>
            <div className="three-col no-margin-bottom">
              {item.usage}
            </div>
            <div className="three-col last-col no-margin-bottom">
              {item.price}
            </div>
          </li>);
      });
      return (
        <div className="account-payment-charges__line-items">
          <h4>Charges for:</h4>
          <ul className="user-profile__list twelve-col">
            <li className="user-profile__list-header twelve-col">
              <div className="three-col no-margin-bottom">
                Name
              </div>
              <div className="three-col no-margin-bottom">
                Details
              </div>
              <div className="three-col no-margin-bottom">
                Usage
              </div>
              <div className="three-col last-col no-margin-bottom">
                Price
              </div>
            </li>
            {items}
          </ul>
        </div>);
    },

    /**
      Generate the list of charges.

      @returns {Object} The markup for the list of charges.
    */
    _generateCharges: function() {
      if (this.state.loading) {
        return <juju.components.Spinner />;
      }
      const charges = this.state.charges;
      if (!charges || !charges.length) {
        return (
          <div>
            You do not have any charges.
          </div>);
      }
      let list = charges.map(charge => {
        return (
          <juju.components.ExpandingRow
            classes={{
              'twelve-col': true,
              'user-profile__list-row': true
            }}
            clickable={true}
            key={charge.id}>
            <div>
              <div className="two-col no-margin-bottom">
                {charge.statementId}
              </div>
              <div className="two-col no-margin-bottom">
                <juju.components.DateDisplay
                  date={charge.for}
                  relative={true} />
              </div>
              <div className="two-col no-margin-bottom">
                {charge.price} {charge.currency}
              </div>
              <div className="two-col no-margin-bottom">
                {charge.vat} {charge.currency}
              </div>
              <div className="two-col last-col no-margin-bottom">
                {charge.price + charge.vat} {charge.currency}
              </div>
              <div className="two-col last-col no-margin-bottom">
              <juju.components.GenericButton
                action={this._togglePopup.bind(this, charge.id)}
                disabled={false}
                type="inline-base"
                title="Show receipt" />
              </div>
            </div>
            <div className="twelve-col">
              {this._generateLineItems(charge.lineItems)}
            </div>
          </juju.components.ExpandingRow>);
      });
      return (
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <div className="two-col no-margin-bottom">
              ID
            </div>
            <div className="two-col no-margin-bottom">
              Date
            </div>
            <div className="two-col no-margin-bottom">
              Price
            </div>
            <div className="two-col no-margin-bottom">
              VAT
            </div>
            <div className="two-col last-col no-margin-bottom">
              Total
            </div>
          </li>
          {list}
        </ul>);
    },

    /**
      Generate the receipt popup.

      @returns {Object} The terms popup markup.
    */
    _generatePopup: function() {
      const charge = this.state.showPopup;
      if (!charge) {
        return null;
      }
      return (
        <juju.components.ReceiptPopup
          addNotification={this.props.addNotification}
          close={this._togglePopup}
          chargeId={charge}
          getReceipt={this.props.getReceipt} />);
    },

    render: function() {
      return (
        <div className="account-payment-charges">
          <div className="account__section">
            <h2 className="account__title twelve-col">
              Charges
            </h2>
            {this._generateCharges()}
            {this._generatePopup()}
          </div>
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'date-display',
    'expanding-row',
    'generic-button',
    'loading-spinner',
    'receipt-popup'
  ]
});
