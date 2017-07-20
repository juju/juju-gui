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

class AccountPaymentMethod extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      showForm: false
    };
  }

  componentWillUnmount() {
    this.xhrs.forEach((xhr) => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Generate a payment method.

    @method _generatePaymentMethod
  */
  _generatePaymentMethod() {
    return (
      <juju.components.AccountPaymentMethodCard
        addNotification={this.props.addNotification}
        card={this.props.paymentMethod}
        onPaymentMethodRemoved={this.props.updateUser}
        removePaymentMethod={this.props.removePaymentMethod}
        updatePaymentMethod={this._toggleForm.bind(this)}
        username={this.props.username} />);
  }

  /**
    Update a payment method.
  */
  _updatePaymentMethod() {
    const valid = this.props.validateForm(
      ['expiry', 'cardAddress'], this.refs);
    if (!valid) {
      return;
    }
    const address = this.refs.cardAddress.getValue();
    const expiry = this.refs.expiry.getValue();
    const xhr = this.props.updatePaymentMethod(
      this.props.username, this.props.paymentMethod.id, address, expiry,
      error => {
        if (error) {
          const message = 'Could not update the payment method';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        this._toggleForm();
        // Reload the user to get the new payment method.
        this.props.updateUser();
      });
    this.xhrs.push(xhr);
  }

  /**
    Show or hide the edit payment method form.

    @method _toggleForm
  */
  _toggleForm() {
    this.setState({showForm: !this.state.showForm});
  }

  /**
    Generate the form for editing the payment method.
  */
  _generateEditForm() {
    const paymentMethod = this.props.paymentMethod;
    // Zero pad the month if it is less than 10.
    const month = `0${paymentMethod.month}`.slice(-2);
    return (
      <div className="account-payment-method__form">
        <juju.components.AddressForm
          address={paymentMethod.address}
          disabled={this.props.acl.isReadOnly()}
          addNotification={this.props.addNotification}
          getCountries={this.props.getCountries}
          ref="cardAddress"
          showName={false}
          showPhone={false}
          validateForm={this.props.validateForm} />
        <div className="twelve-col">
          <juju.components.GenericInput
            disabled={this.props.acl.isReadOnly()}
            label="Expiry MM/YY"
            ref="expiry"
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }, {
              regex: /[\d]{2}\/[\d]{2}/,
              error: 'The expiry must be in the format MM/YY'
            }]}
            value={`${month}/${paymentMethod.year}`} />
        </div>
        <div className="twelve-col account-payment-method__buttons">
          <juju.components.GenericButton
            action={this._toggleForm.bind(this)}
            type="inline-neutral">
            Cancel
          </juju.components.GenericButton>
          <juju.components.GenericButton
            action={this._updatePaymentMethod.bind(this)}
            type="inline-positive">
            Update
          </juju.components.GenericButton>
        </div>
      </div>);
  }

  render() {
    const content = this.state.showForm ?
      this._generateEditForm() : this._generatePaymentMethod();
    return (
      <juju.components.ExpandingRow
        classes={{
          'user-profile__list-row': true,
          'twelve-col': true
        }}
        clickable={false}
        expanded={true}>
        <div></div>
        <div className="account-payment-method">
          {content}
        </div>
      </juju.components.ExpandingRow>
    );
  }
};

AccountPaymentMethod.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  getCountries: PropTypes.func.isRequired,
  paymentMethod: PropTypes.object.isRequired,
  removePaymentMethod: PropTypes.func.isRequired,
  updatePaymentMethod: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
  validateForm: PropTypes.func.isRequired
};

YUI.add('account-payment-method', function() {
  juju.components.AccountPaymentMethod = AccountPaymentMethod;
}, '', {
  requires: [
    'account-payment-method-card',
    'address-form',
    'expanding-row',
    'generic-button'
  ]
});
