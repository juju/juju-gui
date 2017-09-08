/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const AddressForm = require('../../../../address-form/address-form');
const ExpandingRow = require('../../../../expanding-row/expanding-row');
const GenericButton = require('../../../../generic-button/generic-button');

class AccountPaymentDetailsAddress extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
  }

  componentWillUnmount() {
    this.xhrs.forEach((xhr) => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Update an address.

    @method _updateAddress
  */
  _updateAddress() {
    const valid = this.props.validateForm(['addressForm'], this.refs);
    if (!valid) {
      return;
    }
    const address = this.refs.addressForm.getValue();
    const username = this.props.username;
    const xhr = this.props.updateAddress(
      username, this.props.address.id, address, error => {
        if (error) {
          const message = 'Could not update address';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        this.props.updated();
        this.props.close();
      });
    this.xhrs.push(xhr);
  }

  render() {
    const disabled = this.props.acl.isReadOnly();
    return (
      <ExpandingRow
        classes={{
          'account-payment-details-address': true,
          'twelve-col': true
        }}
        clickable={false}
        expanded={this.props.showEdit}>
        <AddressForm
          disabled={true}
          address={this.props.address}
          getCountries={this.props.getCountries} />
        <div className="twelve-col account-payment-details-address__edit">
          <AddressForm
            addNotification={this.props.addNotification}
            address={this.props.address}
            disabled={disabled}
            getCountries={this.props.getCountries}
            ref="addressForm"
            validateForm={this.props.validateForm} />
          <div className={
            'twelve-col account-payment-details-address__buttons'}>
            <GenericButton
              action={this.props.close}
              disabled={disabled}
              type="inline-neutral">
              Cancel
            </GenericButton>
            <GenericButton
              action={this._updateAddress.bind(this)}
              disabled={disabled}
              type="inline-positive">
              Update
            </GenericButton>
          </div>
        </div>
      </ExpandingRow>
    );
  }
};

AccountPaymentDetailsAddress.propTypes = {
  acl: PropTypes.object.isRequired,
  addAddress: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  address: PropTypes.object.isRequired,
  close: PropTypes.func.isRequired,
  getCountries: PropTypes.func.isRequired,
  removeAddress: PropTypes.func.isRequired,
  showEdit: PropTypes.bool,
  updateAddress: PropTypes.func.isRequired,
  updated: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
  validateForm: PropTypes.func.isRequired
};

module.exports = AccountPaymentDetailsAddress;
