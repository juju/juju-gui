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
      acl: React.PropTypes.object.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      getCountries: React.PropTypes.func,
      validateForm: React.PropTypes.func.isRequired
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
        'addressLine1',
        'addressLine2',
        'addressCity',
        'addressState',
        'addressPostcode',
        'addressCountry',
        'addressPhoneNumber',
        'addressFullName'
      ];
      return this.props.validateForm(fields, this.refs);
    },

    /**
      Get address data.

      @method getValue
      @param key {String} The identifier for the form instance.
    */
    getValue: function(key) {
      const refs = this.refs;
      return {
        line1: refs.addressLine1.getValue(),
        line2: refs.addressLine2.getValue(),
        city: refs.addressCity.getValue(),
        state: refs.addressState.getValue(),
        postcode: refs.addressPostcode.getValue(),
        countryCode: refs.addressCountry.getValue(),
        phones: [refs.addressPhoneNumber.getValue()]
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
      Generate the country code values for a select box.

      @method _generateCountryCodeOptions
      @returns {Array} The list of country code options.
    */
    _generateCountryCodeOptions: function() {
      return this.state.countries.map(country => {
        return {
          label: country.code,
          value: country.code
        };
      });
    },

    render: function() {
      let content;
      if (this.state.loading) {
        content = (
          <juju.components.Spinner />);
      } else {
        const required = {
          regex: /\S+/,
          error: 'This field is required.'
        };
        const disabled = this.props.acl.isReadOnly();
        content = (
          <div>
            <juju.components.InsetSelect
              disabled={disabled}
              label="Country"
              options={this._generateCountryOptions()}
              ref="addressCountry"
              value="GB" />
            <juju.components.GenericInput
              disabled={disabled}
              label="Full name"
              ref="addressFullName"
              required={true}
              validate={[required]} />
            <juju.components.GenericInput
              disabled={disabled}
              label="Address line 1"
              ref="addressLine1"
              required={true}
              validate={[required]} />
            <juju.components.GenericInput
              disabled={disabled}
              label="Address line 2 (optional)"
              ref="addressLine2"
              required={false} />
            <juju.components.GenericInput
              disabled={disabled}
              label="State/province"
              ref="addressState"
              required={true}
              validate={[required]} />
            <div className="twelve-col">
              <div className="six-col">
                <juju.components.GenericInput
                  disabled={disabled}
                  label="Town/city"
                  ref="addressCity"
                  required={true}
                  validate={[required]} />
              </div>
              <div className="six-col last-col">
                <juju.components.GenericInput
                  disabled={disabled}
                  label="Postcode"
                  ref="addressPostcode"
                  required={true}
                  validate={[required]} />
              </div>
              <div className="four-col">
                <juju.components.InsetSelect
                  disabled={disabled}
                  label="Country code"
                  options={this._generateCountryCodeOptions()}
                  ref="addressCountryCode"
                  value="GB" />
              </div>
              <div className="eight-col last-col">
                <juju.components.GenericInput
                  disabled={disabled}
                  label="Phone number"
                  ref="addressPhoneNumber"
                  required={true}
                  validate={[required]} />
              </div>
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
