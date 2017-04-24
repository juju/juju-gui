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
      addAddress: React.PropTypes.func.isRequired,
      addBillingAddress: React.PropTypes.func.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      getCountries: React.PropTypes.func.isRequired,
      paymentUser: React.PropTypes.object.isRequired,
      removeAddress: React.PropTypes.func.isRequired,
      removeBillingAddress: React.PropTypes.func.isRequired,
      username: React.PropTypes.string.isRequired,
      validateForm: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      return {
        addressEdit: false,
        billingAddressEdit: false
      };
    },

    /**
      Show the edit address form.

      @method _toggleAddressEdit
    */
    _toggleAddressEdit: function() {
      this.setState({addressEdit: !this.state.addressEdit});
    },

    /**
      Show the edit address form.

      @method _toggleBillingAddressEdit
    */
    _toggleBillingAddressEdit: function() {
      this.setState({billingAddressEdit: !this.state.billingAddressEdit});
    },

    /**
      Generate the user's details.

      @method _generateDetails
    */
    _generateDetails: function() {
      const user = this.props.paymentUser;
      const business = user.business;
      const disabled = this.props.acl.isReadOnly();
      return (
        <div className="account__payment-details-view twelve-col">
          <div className="account__payment-details-fields">
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
          </div>
          <h4>
            Addresses
            {this.state.addressEdit ? null : (
              <juju.components.GenericButton
                action={this._toggleAddressEdit}
                disabled={disabled}
                type="inline-base"
                title="Edit" />)}
          </h4>
          {this._generateAddresses(user.addresses)}
          <h4>
            Billing addresses
            {this.state.billingAddressEdit ? null : (
              <juju.components.GenericButton
                action={this._toggleBillingAddressEdit}
                disabled={disabled}
                type="inline-base"
                title="Edit" />)}
          </h4>
          {this._generateAddresses(user.billingAddresses, true)}
        </div>);
    },

    /**
      Generate the address fields.

      @method _generateAddresses
      @param {Array} adresses A list of address.
      @param {Boolean} billing Whether this is a billing address.
      @returns {Object} The markup for the addresses.
    */
    _generateAddresses: function(addresses, billing=false) {
      let list = addresses.map(address => {
        return (
          <juju.components.AccountPaymentDetailsAddress
            acl={this.props.acl}
            addNotification={this.props.addNotification}
            addAddress={
              billing ? this.props.addBillingAddress : this.props.addAddress}
            address={address}
            close={
              billing ? this._toggleBillingAddressEdit :
                this._toggleAddressEdit}
            getCountries={this.props.getCountries}
            key={address.name}
            removeAddress={
              billing ? this.props.removeBillingAddress :
                this.props.removeAddress}
            showEdit={
              billing ? this.state.billingAddressEdit : this.state.addressEdit}
            updated={this._getUser}
            username={this.props.username}
            validateForm={this.props.validateForm} />);
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
    'account-payment-details-address',
    'address-form',
    'expanding-row',
    'generic-button'
  ]
});
