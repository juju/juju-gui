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

const DeploymentPayment = React.createClass({
  displayName: 'DeploymentPayment',

  propTypes: {
    acl: React.PropTypes.object.isRequired,
    addNotification: React.PropTypes.func.isRequired,
    createCardElement: React.PropTypes.func,
    createToken: React.PropTypes.func,
    createUser: React.PropTypes.func,
    getCountries: React.PropTypes.func,
    getUser: React.PropTypes.func,
    paymentUser: React.PropTypes.object,
    setPaymentUser: React.PropTypes.func.isRequired,
    username: React.PropTypes.string.isRequired,
    validateForm: React.PropTypes.func.isRequired
  },

  getInitialState: function() {
    this.xhrs = [];
    return {
      loading: false
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
          this.props.setPaymentUser(user);
        });
      });
      this.xhrs.push(xhr);
    });
  },

  /**
    Generate the details for the payment method.

    @method _generatePaymentMethods
  */
  _generatePaymentMethods: function() {
    const methods = this.props.paymentUser.paymentMethods.map((method, i) => {
      return (
        <li className="deployment-payment__method"
          key={method.name + i}>
          <juju.components.AccountPaymentMethodCard
            card={method} />
        </li>);
    });
    return (
      <ul className="deployment-payment__methods twelve-col">
        {methods}
      </ul>);
  },

  /**
    Generate the details for the payment method.

    @method _generatePaymentForm
  */
  _generatePaymentForm: function() {
    return (
      <juju.components.CreatePaymentUser
        acl={this.props.acl}
        addNotification={this.props.addNotification}
        createCardElement={this.props.createCardElement}
        createToken={this.props.createToken}
        createUser={this.props.createUser}
        getCountries={this.props.getCountries}
        onUserCreated={this._getUser}
        username={this.props.username}
        validateForm={this.props.validateForm} />);
  },

  render: function() {
    let content;
    if (this.state.loading) {
      content = (
        <juju.components.Spinner />);
    } else if (this.props.paymentUser) {
      content = this._generatePaymentMethods();
    } else {
      content = this._generatePaymentForm();
    }
    return (
      <div className="deployment-payment">
        {content}
      </div>
    );
  }

});

YUI.add('deployment-payment', function() {
  juju.components.DeploymentPayment = DeploymentPayment;
}, '0.1.0', {
  requires: [
    'create-payment-user',
    'loading-spinner'
  ]
});
