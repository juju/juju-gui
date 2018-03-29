/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const Spinner = require('../spinner/spinner');
const InsetSelect = require('../inset-select/inset-select');
const GenericInput = require('../generic-input/generic-input');

class AddressForm extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      countries: [],
      loading: false
    };
  }

  componentWillMount() {
    this._getCountries();
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Get a list of countries.

    @method _getCountries
  */
  _getCountries() {
    this.setState({loading: true}, () => {
      const xhr = this.props.getCountries((error, countries) => {
        if (error) {
          const message = 'Could not load country info';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        this.setState({
          countries: countries || [],
          loading: false
        });
      });
      this.xhrs.push(xhr);
    });
  }

  /**
    Validate the form.

    @method validate
    @returns {Boolean} Whether the form is valid.
  */
  validate() {
    let fields = [
      'line1',
      'line2',
      'city',
      'state',
      'postcode',
      'country'
    ];
    if (this.props.showName) {
      fields.push('name');
    }
    if (this.props.showPhone) {
      fields.push('phoneNumber');
    }
    return this.props.validateForm(fields, this.refs);
  }

  /**
    Get address data.

    @method getValue
  */
  getValue() {
    const refs = this.refs;
    return {
      name: this.props.showName ? refs.name.getValue() : null,
      line1: refs.line1.getValue(),
      line2: refs.line2.getValue(),
      city: refs.city.getValue(),
      county: refs.state.getValue(),
      postcode: refs.postcode.getValue(),
      country: refs.country.getValue(),
      phones: this.props.showPhone ? [refs.phoneNumber.getValue()] : null
    };
  }

  /**
    Generate the country values for a select box.

    @method _generateCountryOptions
    @returns {Array} The list of country options.
  */
  _generateCountryOptions() {
    return this.state.countries.map(country => {
      return {
        label: country.name,
        value: country.code
      };
    });
  }

  /**
    Generate the name field.

    @returns {Object} The name field markup.
  */
  _generateNameField() {
    if (!this.props.showName) {
      return null;
    }
    const address = this.props.address;
    return (
      <GenericInput
        disabled={this.props.disabled}
        label="Full name"
        ref="name"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value={address.name} />);
  }

  /**
    Generate the phone field.

    @returns {Object} The phone field markup.
  */
  _generatePhoneField() {
    if (!this.props.showPhone) {
      return null;
    }
    const address = this.props.address;
    return (
      <div className="twelve-col u-no-margin--bottom">
        <GenericInput
          disabled={this.props.disabled}
          label="Phone number"
          ref="phoneNumber"
          required={true}
          validate={[{
            regex: /\S+/,
            error: 'This field is required.'
          }]}
          value={(address.phones || []).join(', ')} />
      </div>);
  }

  render() {
    const address = this.props.address;
    let content;
    if (this.state.loading) {
      content = (
        <Spinner />);
    } else {
      const required = {
        regex: /\S+/,
        error: 'This field is required.'
      };
      const disabled = this.props.disabled;
      let countryCode = 'GB';
      // Map the country name to code so that the select box can display the
      // correct value.
      this.state.countries.some(country => {
        if (country.name === address.country) {
          countryCode = country.code;
          return true;
        }
      });
      content = (
        <div>
          <InsetSelect
            disabled={disabled}
            label="Country"
            options={this._generateCountryOptions()}
            ref="country"
            value={countryCode} />
          {this._generateNameField()}
          <GenericInput
            disabled={disabled}
            label="Address line 1"
            ref="line1"
            required={true}
            validate={[required]}
            value={address.line1} />
          <GenericInput
            disabled={disabled}
            label="Address line 2 (optional)"
            ref="line2"
            required={false}
            value={address.line2} />
          <GenericInput
            disabled={disabled}
            label="State/province"
            ref="state"
            required={true}
            validate={[required]}
            value={address.county} />
          <div className="twelve-col u-no-margin--bottom">
            <div className="six-col u-no-margin--bottom">
              <GenericInput
                disabled={disabled}
                label="Town/city"
                ref="city"
                required={true}
                validate={[required]}
                value={address.city} />
            </div>
            <div className="six-col last-col u-no-margin--bottom">
              <GenericInput
                disabled={disabled}
                label="Postcode"
                ref="postcode"
                required={true}
                validate={[required]}
                value={address.postcode} />
            </div>
          </div>
          {this._generatePhoneField()}
        </div>);
    }
    return (
      <div className="address-form">
        {content}
      </div>
    );
  }
};

AddressForm.propTypes = {
  addNotification: PropTypes.func,
  address: PropTypes.object,
  disabled: PropTypes.bool,
  getCountries: PropTypes.func,
  showName: PropTypes.bool,
  showPhone: PropTypes.bool,
  validateForm: PropTypes.func
};

AddressForm.defaultProps = {
  address: {},
  showName: true,
  showPhone: true
};

module.exports = AddressForm;
