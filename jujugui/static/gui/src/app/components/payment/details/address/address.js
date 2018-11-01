/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const AddressForm = require('../../../address-form/address-form');
const ExpandingRow = require('../../../shared/expanding-row/expanding-row');
const Button = require('../../../shared/button/button');
const initUtils = require('../../../../init/utils');

class PaymentDetailsAddress extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Update an address.

    @method _updateAddress
  */
  _updateAddress() {
    const valid = initUtils.validateForm(['addressForm'], this.refs);
    if (!valid) {
      return;
    }
    const address = this.refs.addressForm.getValue();
    const username = this.props.username;
    const xhr = this.props.updateAddress(username, this.props.address.id, address, error => {
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
      <div className="payment-details-address_wrapper">
        <ExpandingRow
          classes={{
            'payment-details-address': true,
            'twelve-col': true
          }}
          clickable={false}
          expanded={this.props.showEdit}
        >
          <AddressForm
            address={this.props.address}
            disabled={true}
            getCountries={this.props.getCountries}
          />
          <div className="twelve-col payment-details-address__edit u-no-margin--bottom">
            <AddressForm
              addNotification={this.props.addNotification}
              address={this.props.address}
              disabled={disabled}
              getCountries={this.props.getCountries}
              ref="addressForm"
            />
            <div className={'twelve-col payment-details-address__buttons u-no-margin--bottom'}>
              <Button action={this.props.close} disabled={disabled} type="inline-neutral">
                Cancel
              </Button>
              <Button
                action={this._updateAddress.bind(this)}
                disabled={disabled}
                type="inline-positive"
              >
                Update
              </Button>
            </div>
          </div>
        </ExpandingRow>
      </div>
    );
  }
}

PaymentDetailsAddress.propTypes = {
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
  username: PropTypes.string.isRequired
};

module.exports = PaymentDetailsAddress;
