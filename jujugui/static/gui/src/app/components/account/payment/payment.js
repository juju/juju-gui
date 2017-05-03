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

YUI.add('account-payment', function() {

  juju.components.AccountPayment = React.createClass({
    displayName: 'AccountPayment',

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addAddress: React.PropTypes.func.isRequired,
      addBillingAddress: React.PropTypes.func.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      createCardElement: React.PropTypes.func.isRequired,
      createPaymentMethod: React.PropTypes.func.isRequired,
      createToken: React.PropTypes.func.isRequired,
      createUser: React.PropTypes.func.isRequired,
      getCharges: React.PropTypes.func.isRequired,
      getCountries: React.PropTypes.func.isRequired,
      getReceipt: React.PropTypes.func.isRequired,
      getUser: React.PropTypes.func.isRequired,
      removeAddress: React.PropTypes.func.isRequired,
      removeBillingAddress: React.PropTypes.func.isRequired,
      removePaymentMethod: React.PropTypes.func.isRequired,
      updateAddress: React.PropTypes.func.isRequired,
      updateBillingAddress: React.PropTypes.func.isRequired,
      updatePaymentMethod: React.PropTypes.func.isRequired,
      username: React.PropTypes.string.isRequired,
      validateForm: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];
      return {
        loading: false,
        paymentUser: null,
        showAdd: false
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
      Show or hide the add payment user form.

      @method _toggleAdd
    */
    _toggleAdd: function() {
      this.setState({showAdd: !this.state.showAdd});
    },

    /**
      Store the payment user in state.

      @method _setUser
      @param {String} user The user deetails.
    */
    _setUser: function(user) {
      this.setState({paymentUser: user});
    },

    /**
      Handle the user having been created.

      @method _handleUserCreated
    */
    _handleUserCreated: function() {
      this._toggleAdd();
      this._getUser();
    },

    /**
      Get the payment details for the user.

      @method _getUser
    */
    _getUser: function() {
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
            this._setUser(user);
          });
        });
        this.xhrs.push(xhr);
      });
    },

    /**
      Generate the details for the payment method.

      @returns {Object} The payment details markup.
    */
    _generatePaymentDetails: function() {
      return (
        <div>
          <juju.components.AccountPaymentMethods
            acl={this.props.acl}
            addNotification={this.props.addNotification}
            createCardElement={this.props.createCardElement}
            createPaymentMethod={this.props.createPaymentMethod}
            createToken={this.props.createToken}
            getCountries={this.props.getCountries}
            paymentUser={this.state.paymentUser}
            removePaymentMethod={this.props.removePaymentMethod}
            updatePaymentMethod={this.props.updatePaymentMethod}
            updateUser={this._getUser}
            username={this.props.username}
            validateForm={this.props.validateForm} />
          <juju.components.AccountPaymentDetails
            acl={this.props.acl}
            addAddress={this.props.addAddress}
            addBillingAddress={this.props.addBillingAddress}
            addNotification={this.props.addNotification}
            getCountries={this.props.getCountries}
            paymentUser={this.state.paymentUser}
            removeAddress={this.props.removeAddress}
            removeBillingAddress={this.props.removeBillingAddress}
            updateAddress={this.props.updateAddress}
            updateBillingAddress={this.props.updateBillingAddress}
            updateUser={this._getUser}
            username={this.props.username}
            validateForm={this.props.validateForm} />
          <juju.components.AccountPaymentCharges
            acl={this.props.acl}
            addNotification={this.props.addNotification}
            getCharges={this.props.getCharges}
            getReceipt={this.props.getReceipt}
            username={this.props.username} />
        </div>);
    },

    /**
      Generate the details for the payment method.

      @method _generatePaymentForm
    */
    _generatePaymentForm: function() {
      return (
        <div className="account__section">
          <h2 className="account__title twelve-col">
            Payment details
          </h2>
          <div className="twelve-col">
            <juju.components.CreatePaymentUser
              acl={this.props.acl}
              addNotification={this.props.addNotification}
              createCardElement={this.props.createCardElement}
              createToken={this.props.createToken}
              createUser={this.props.createUser}
              getCountries={this.props.getCountries}
              onUserCreated={this._handleUserCreated}
              username={this.props.username}
              validateForm={this.props.validateForm} />
          </div>
        </div>);
    },

    /**
      Generate the a notice if there is no user.

      @method _generateNoUser
    */
    _generateNoUser: function() {
      return (
        <div className="account__section">
          <h2 className="account__title twelve-col">
            Payment details
          </h2>
          <div className="account-payment__no-user">
            You are not set up to make payments.
            <juju.components.GenericButton
              action={this._toggleAdd}
              type="inline-neutral"
              title="Set up payments" />
          </div>
        </div>);
    },

    render: function() {
      let content;
      if (this.state.loading) {
        content = (
          <juju.components.Spinner />);
      } else if (this.state.paymentUser) {
        content = this._generatePaymentDetails();
      } else if (this.state.showAdd) {
        content = this._generatePaymentForm();
      } else {
        content = this._generateNoUser();
      }
      return (
        <div className="account-payment">
          {content}
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'account-payment-charges',
    'account-payment-details',
    'account-payment-methods',
    'create-payment-user',
    'loading-spinner'
  ]
});
