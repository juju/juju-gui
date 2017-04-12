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

YUI.add('account-payment-method', function() {

  juju.components.AccountPaymentMethod = React.createClass({
    displayName: 'AccountPaymentMethod',

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      createPaymentMethod: React.PropTypes.func.isRequired,
      createToken: React.PropTypes.func.isRequired,
      getUser: React.PropTypes.func.isRequired,
      removePaymentMethod: React.PropTypes.func.isRequired,
      username: React.PropTypes.string.isRequired,
      validateForm: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];
      return {
        loading: false,
        showAdd: false,
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
      Generate a list of payment method details.

      @method _generatePaymentMethods
    */
    _generatePaymentMethods: function() {
      const user = this.state.user;
      if (this.state.loading) {
        return (
          <juju.components.Spinner />);
      }
      if (!user || user.paymentMethods.length === 0) {
        return (
          <div className="account__payment-no-methods">
            You do not have a payment method.
            <juju.components.GenericButton
              action={this._toggleAdd}
              type="inline-neutral"
              title="Add payment method" />
          </div>);
      }
      const classes = {
        'user-profile__list-row': true,
        'twelve-col': true
      };
      const methods = user.paymentMethods.map(method => {
        return (
          <juju.components.ExpandingRow
            classes={classes}
            clickable={false}
            expanded={true}
            key={method.name}>
            <div>
              {method.name}
            </div>
            <div className="account__payment-details">
              <juju.components.AccountPaymentMethodCard
                addNotification={this.props.addNotification}
                card={method}
                onPaymentMethodRemoved={this._getUser}
                removePaymentMethod={this.props.removePaymentMethod}
                username={this.props.username} />
            </div>
          </juju.components.ExpandingRow>);
      });
      return (
        <ul className="user-profile__list twelve-col">
          {methods}
        </ul>);
    },

    /**
      Handle creating the card and user.

      @method _createToken
    */
    _createToken: function() {
      const valid = this.props.validateForm(['cardForm'], this.refs);;
      if (!valid) {
        return;
      }
      const card = this.refs.cardForm.getValue();
      const xhr = this.props.createToken(card, (error, token) => {
        if (error) {
          const message = 'Could not create Stripe token';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        this._createPaymentMethod(token.id);
      });
      this.xhrs.push(xhr);
    },

    /**
      Create the payment method using the card token.

      @method _createPaymentMethod
      @param token {String} A Stripe token.
    */
    _createPaymentMethod: function(token) {
      const xhr = this.props.createPaymentMethod(
        this.props.username, token, (error, method) => {
          if (error) {
            const message = 'Could not create the payment method';
            this.props.addNotification({
              title: message,
              message: `${message}: ${error}`,
              level: 'error'
            });
            console.error(message, error);
            return;
          }
          this._toggleAdd();
          // Reload the user to get the new payment method.
          this._getUser();
        });
      this.xhrs.push(xhr);
    },

    /**
      Show or hide the add payment method form.

      @method _toggleAdd
    */
    _toggleAdd: function() {
      this.setState({showAdd: !this.state.showAdd});
    },

    /**
      Generate a form to add credentials.

      @method _generateAddPaymentMethod
    */
    _generateAddPaymentMethod: function() {
      if (!this.state.showAdd) {
        return null;
      }
      return (
        <juju.components.ExpandingRow
          classes={{'twelve-col': true}}
          clickable={false}
          expanded={true}>
          <div></div>
          <div className="account__payment-form">
            <div className="account__payment-form-fields">
              <juju.components.CardForm
                acl={this.props.acl}
                ref="cardForm"
                validateForm={this.props.validateForm} />
            </div>
            <div className="twelve-col account__payment-form-buttons">
              <juju.components.GenericButton
                action={this._toggleAdd}
                type="inline-neutral"
                title="Cancel" />
              <juju.components.GenericButton
                action={this._createToken}
                type="inline-positive"
                title="Add payment method" />
            </div>
          </div>
        </juju.components.ExpandingRow>);
    },

    render: function() {
      const content = this.state.showAdd ?
        this._generateAddPaymentMethod() : this._generatePaymentMethods();
      return (
        <div className="account__section">
          <h2 className="account__title twelve-col">
            Payment details
          </h2>
          {content}
        </div>
      );
    }

  });

}, '', {
  requires: [
    'account-payment-method-card',
    'card-form',
    'expanding-row',
    'generic-button',
    'loading-spinner'
  ]
});
