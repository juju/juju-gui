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

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      getUser: React.PropTypes.func.isRequired,
      username: React.PropTypes.string.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];
      return {
        loading: false,
        user: null
      };
    },

    componentWillMount: function() {
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

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
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
          <div>
            No payment methods available.
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
                card={method} />
            </div>
          </juju.components.ExpandingRow>);
      });
      return (
        <ul className="user-profile__list twelve-col">
          {methods}
        </ul>);
    },

    render: function() {
      return (
        <div className="account__section">
          <h2 className="account__title twelve-col">
            Payment details
          </h2>
          {this._generatePaymentMethods()}
        </div>
      );
    }

  });

}, '', {
  requires: [
    'account-payment-method-card',
    'expanding-row',
    'loading-spinner'
  ]
});
