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

YUI.add('account-payment-details', function() {

  juju.components.AccountPaymentDetails = React.createClass({
    displayName: 'AccountPaymentDetails',

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      getCountries: React.PropTypes.func.isRequired,
      getUser: React.PropTypes.func.isRequired,
      username: React.PropTypes.string.isRequired,
      validateForm: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];
      return {
        loading: false,
        user: null
      };
    },

    componentWillMount: function() {
      this._getUser();
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    /**
      Get a payment user.

      @method _getUser
    */
    _getUser: function() {
      this.setState({loading: true}, () => {
        const xhr = this.props.getUser(this.props.username, (error, user) => {
          if (error) {
            this.props.addNotification({
              title: 'Could not load user info',
              message: `Could not load user info: ${error}`,
              level: 'error'
            });
            console.error('Could not load user info', error);
            return;
          }
          this.setState({user: user, loading: false});
        });
        this.xhrs.push(xhr);
      });
    },

    /**
      Generate the user's details.

      @method _generateDetails
    */
    _generateDetails: function() {
      if (this.state.loading) {
        return <juju.components.Spinner />;
      }
      const user = this.state.user;
      if (!user) {
        return (
          <div className="account__payment-details-none">
            You do not have any payment details.
          </div>);
      }
      const business = user.business;
      return (
        <div className="account__payment-details-view twelve-col">
          <juju.components.GenericInput
            disabled={true}
            label="Name"
            value={user.name} />
         <juju.components.GenericInput
           disabled={true}
           label="Email address"
           value={user.email} />
          {business ? (
            <juju.components.GenericInput
              disabled={true}
              label="VAT number (optional)"
              value={user.vat} />) : null}
          {business ? (
            <juju.components.GenericInput
              disabled={true}
              label="Business name"
              value={user.businessName} />) : null}
          <h4>
            Addresses
          </h4>
          {this._generateAddresses(user.addresses)}
          <h4>
            Billing addresses
          </h4>
          {this._generateAddresses(user.billingAddresses)}
        </div>);
    },

    /**
      Generate the address fields.

      @method _generateAddresses
      @param {Array} adresses A list of address.
      @returns {Object} The markup for the addresses.
    */
    _generateAddresses: function(addresses) {
      let list = addresses.map(address => {
        return (
          <li key={address.name}>
            <juju.components.AddressForm
              disabled={true}
              address={address}
              getCountries={this.props.getCountries} />
          </li>);
      });
      return (
        <ul className="account__payment-details-addresses">
          {list}
        </ul>);
    },

    render: function() {
      return (
        <div className="account__section">
          <h2 className="account__title twelve-col">
            Account details
          </h2>
          {this._generateDetails()}
        </div>
      );
    }

  });

}, '', {
  requires: [
    'address-form',
    'expanding-row',
    'generic-button',
    'loading-spinner'
  ]
});
