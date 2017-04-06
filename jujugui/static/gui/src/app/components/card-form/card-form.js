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

YUI.add('card-form', function() {

  juju.components.CardForm = React.createClass({
    displayName: 'CardForm',

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      validateForm: React.PropTypes.func.isRequired
    },

    /**
      Validate the form.

      @method validate
      @returns {Boolean} Whether the form is valid.
    */
    validate: function() {
      const fields = [
        'expiry',
        'number',
        'cvc',
        'name'
      ];
      return this.props.validateForm(fields, this.refs);
    },

    /**
      Get card data.

      @method getValue
    */
    getValue: function() {
      const refs = this.refs;
      const expiry = refs.expiry.getValue().split('/');
      const expiryMonth = expiry[0];
      const expiryYear = expiry[1];
      return {
        expMonth: expiryMonth,
        expYear: expiryYear,
        number: refs.number.getValue().replace(/ /g, ''),
        cvc: refs.cvc.getValue(),
        name: refs.name.getValue()
      };
    },

    /**
      Handle updating the number with the correct spacing.

      @method _handleNumberChange
    */
    _handleNumberChange: function() {
      this.refs.number.setValue(
        this._formatNumber(this.refs.number.getValue()));
      // TODO: when we have card logos we should update the logo for the card
      // type here.
    },

    /**
      Format the credit card number. Stripe accepts Visa, MasterCard, American
      Express, JCB, Discover, and Diners Club, of which all are spaced in blocks
      four except American Express.

      @method _formatNumber
      @param number {String} A full or partial card number.
    */
    _formatNumber: function(number) {
      const provider = this._getCardProvider(number);
      if (!provider) {
        return number;
      }
      let parts = [];
      let position = 0;
      // Clean all the spaces from the card number.
      number = number.replace(/ /g, '');
      // Loop through the blocks.
      provider.blocks.forEach(block => {
        // Store the block of numbers.
        parts.push(number.slice(position, position + block));
        position += block;
      });
      // Join the new blocks with spaces.
      return parts.join(' ');
    },

    /**
      Get the details of the card provider from the card number.

      @method _getCardProvider
      @param number {String} A full or partial card number.
    */
    _getCardProvider: function(number) {
      // Clean all the spaces from the card number.
      number = number.replace(/ /g, '');
      // Define the blocks for the different card providers. Defaulting to the
      // most common.
      const providers = [{
        name: 'American Express',
        // Prefix: 34, 37
        numbers: /^(34|37)/,
        blocks: [4, 6, 5]
      }, {
        name: 'Visa',
        // Prefix: 4
        numbers: /^4/,
        blocks: [4, 4, 4, 4]
      }, {
        name: 'MasterCard',
        // Prefix: 50-55
        numbers: /^5[1-5]/,
        blocks: [4, 4, 4, 4]
      }, {
        name: 'Discover',
        // Prefix: 6011, 622126-622925, 644-649, 65
        numbers: /^(65|6011|(64[4-9])|(622\d\d\d))/,
        blocks: [4, 4, 4, 4]
      }, {
        name: 'Diners Club',
        // Prefix: 300-305, 309, 36, 38-39
        numbers: /^((30[0-5])|309|36|(3[8-9]))/,
        blocks: [4, 4, 4, 4]
      }, {
        name: 'JCB',
        // Prefix: 3528-3589
        numbers: /^(35\d\d)/,
        blocks: [4, 4, 4, 4]
      }];
      let match;
      providers.some(provider => {
        if (provider.numbers.test(number)) {
          match = provider;
          return true;
        }
      });
      return match || null;
    },

    render: function() {
      const disabled = this.props.acl.isReadOnly();
      const required = {
        regex: /\S+/,
        error: 'This field is required.'
      };
      return (
        <div className="card-form">
          <juju.components.GenericInput
            disabled={disabled}
            label="Card number"
            onChange={this._handleNumberChange}
            ref="number"
            required={true}
            validate={[required, {
              regex: /^[a-zA-Z0-9_-\s]{16,}/,
              error: 'The card number is too short.'
            }, {
              regex: /^[a-zA-Z0-9_-\s]{0,23}$/,
              error: 'The card number is too long.'
            }, {
              regex: /^[0-9\s]+$/,
              error: 'The card number can only contain numbers.'
            }]} />
          <div className="twelve-col no-margin-bottom">
            <div className="six-col no-margin-bottom">
              <juju.components.GenericInput
                disabled={disabled}
                label="Expiry MM/YY"
                ref="expiry"
                required={true}
                validate={[required, {
                  regex: /[\d]{2}\/[\d]{2}/,
                  error: 'The expiry must be in the format MM/YY'
                }]} />
            </div>
            <div className="six-col last-col no-margin-bottom">
              <juju.components.GenericInput
                disabled={disabled}
                label="Security number (CVC)"
                ref="cvc"
                required={true}
                validate={[required, {
                  regex: /^[0-9]{3}$/,
                  error: 'The CVC must be three characters long.'
                }, {
                  regex: /^[0-9]+$/,
                  error: 'The CVC can only contain numbers.'
                }]} />
            </div>
          </div>
          <div className="twelve-col">
            <juju.components.GenericInput
              disabled={disabled}
              label="Name on card"
              ref="name"
              required={true}
              validate={[required]} />
          </div>
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'generic-input'
  ]
});
