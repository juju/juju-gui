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

YUI.add('address-form', function() {

  juju.components.AddressForm = React.createClass({
    displayName: 'AddressForm',

    propTypes: {
      addNotification: React.PropTypes.func,
      address: React.PropTypes.object,
      disabled: React.PropTypes.bool,
      getCountries: React.PropTypes.func,
      showName: React.PropTypes.bool,
      showPhone: React.PropTypes.bool,
      validateForm: React.PropTypes.func
    },

    getDefaultProps: function() {
      return {
        address: {},
        showName: true,
        showPhone: true
      };
    },

    getInitialState: function() {
      this.xhrs = [];
      return {
        countries: [],
        loading: false
      };
    },

    componentWillMount: function() {
      this._getCountries();
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    /**
      Get a list of countries.

      @method _getCountries
    */
    _getCountries: function() {
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
    },

    /**
      Validate the form.

      @method validate
      @returns {Boolean} Whether the form is valid.
    */
    validate: function() {
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
    },

    /**
      Get address data.

      @method getValue
    */
    getValue: function() {
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
    },

    /**
      Generate the country values for a select box.

      @method _generateCountryOptions
      @returns {Array} The list of country options.
    */
    _generateCountryOptions: function() {
      return this.state.countries.map(country => {
        return {
          label: country.name,
          value: country.code
        };
      });
    },

    /**
      Generate the name field.

      @returns {Object} The name field markup.
    */
    _generateNameField: function() {
      if (!this.props.showName) {
        return null;
      }
      const address = this.props.address;
      return (
        <juju.components.GenericInput
          disabled={this.props.disabled}
          label="Full name"
          ref="name"
          required={true}
          validate={[{
            regex: /\S+/,
            error: 'This field is required.'
          }]}
          value={address.name} />);
    },

    /**
      Generate the phone field.

      @returns {Object} The phone field markup.
    */
    _generatePhoneField: function() {
      if (!this.props.showPhone) {
        return null;
      }
      const address = this.props.address;
      return (
        <div className="twelve-col">
          <juju.components.GenericInput
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
    },

    render: function() {
      const address = this.props.address;
      let content;
      if (this.state.loading) {
        content = (
          <juju.components.Spinner />);
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
            <juju.components.InsetSelect
              disabled={disabled}
              label="Country"
              options={this._generateCountryOptions()}
              ref="country"
              value={countryCode} />
            {this._generateNameField()}
            <juju.components.GenericInput
              disabled={disabled}
              label="Address line 1"
              ref="line1"
              required={true}
              validate={[required]}
              value={address.line1}/>
            <juju.components.GenericInput
              disabled={disabled}
              label="Address line 2 (optional)"
              ref="line2"
              required={false}
              value={address.line2} />
            <juju.components.GenericInput
              disabled={disabled}
              label="State/province"
              ref="state"
              required={true}
              validate={[required]}
              value={address.county} />
            <div className="twelve-col">
              <div className="six-col">
                <juju.components.GenericInput
                  disabled={disabled}
                  label="Town/city"
                  ref="city"
                  required={true}
                  validate={[required]}
                  value={address.city} />
              </div>
              <div className="six-col last-col">
                <juju.components.GenericInput
                  disabled={disabled}
                  label="Postcode"
                  ref="postcode"
                  required={true}
                  validate={[required]}
                  value={address.postcode} />
              </div>
              {this._generatePhoneField()}
            </div>
          </div>);
      }
      return (
        <div className="address-form">
          {content}
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'generic-input',
    'inset-select',
    'loading-spinner'
  ]
});
