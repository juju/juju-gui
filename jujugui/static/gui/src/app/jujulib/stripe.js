/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

var module = module;

(function (exports) {

  const jujulib = exports.jujulib;

  /**
    Stripe service client.

    Provides access to the Stripe API.
  */

  const stripeAPIVersion = 'v2';

  /**
    Initializer.

    @function stripe
    @param url {String} The URL of the Stripe instance, including
      scheme and port, and excluding the API version.
    @returns {Object} A client object for making Stripe API calls.
  */
  function stripe(url) {
    // Store the API URL (including version) handling missing trailing slash.
    this.url = `${url.replace(/\/?$/, '/')}${stripeAPIVersion}/`;
    this.stripe = null;
  };

  stripe.prototype = {
    /**
      Load a JavaScript file.

      @private _loadScript
      @param callback {Function} A function to be called when the file has
        loaded.
    */
    _loadScript: function(callback) {
      // Load the stripe module.
      const node = document.createElement('script');
      node.src = this.url;
      node.onload = () => {
        callback();
      };
      document.head.appendChild(node);
    },

    /**
      Get the global Stripe object. Used for testing.

      @private _getStripeModule
    */
    _getStripeModule: function() {
      if (!Stripe) {
        console.error('The Stripe module was not able to be loaded.');
      }
      return Stripe;
    },

    /**
      Load and return the Stripe API object.

      @private _getStripe
      @param callback {Function} A function to be called once the Stripe API is
        available.
    */
    _getStripe: function(callback) {
      // If the Stripe module is already loaded then return.
      if (this.stripe) {
        callback(this.stripe);
        return;
      }
      this._loadScript(() => {
        this.stripe = this._getStripeModule();
        callback(this.stripe);
      });
    },

    /**
      Create a Stripe card token.

      @public createToken
      @param card {Object} The data for a card, containing:
        - number {String} The card number.
        - cvc {String|Null} The card's security number (optional).
        - expMonth {String} The two digit number of the month the card expires.
        - expYear {String} The two or four digit number of the year the card
          expires.
        - name {String|Null} The cardholder's name (optional).
        - addressLine1 {String|Null} The first line of the cardholder's address.
        - addressLine2 {String|Null} The second line of the cardholder's
          address.
        - addressCity {String|Null} The city of the cardholder's address.
        - addressState {String|Null} The state of the cardholder's address.
        - addressZip {String|Null} The postcode of the cardholder's address.
        - addressCountry {String|Null} The country of the cardholder's address.
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and the token data as its second. The token data
        contains the following fields:
          - id {String} The identifier for this card
          - card {String} The card data, containing:
            - name {String} The user provided identifier of the card
            - addressLine1 {String|Null} The first address line
            - addresssLine2 {String|Null} The second address line
            - addressCity {String|Null} The address city
            - addressState {String|Null} The address state
            - addressZip {String|Null} The address post code
            - addressCountry {String|Null} The address country
            - country {String} The cardholder's country
            - expMonth {String} The two digit number of the month the card
              expires
            - expYear {String} The two or four digit number of the year the card
            - last4 {String} The last four digits of the card number
            - object {String} The type of object e.g. "card"
            - funding {String} The card credit type e.g. "credit"
          - created {String} The timestamp for when the token was created.
          - livemode {Boolean} Whether this token was created using a live API
            key.
          - type {String} The token type e.g. "card".
          - object {String} The type of object, in this case always "token".
          - used {Boolean} Whether this token has been used.
    */
    createToken: function(card, callback) {
      const handler = (status, response) => {
        if (response && response.error) {
          callback(response.error.message, null);
          return;
        }
        const card = response.card;
        const token = {
          id: response.id,
          card: {
            name: card.name || null,
            addressLine1: card['address_line1'] || null,
            addressLine2: card['address_line2'] || null,
            addressCity: card['address_city'] || null,
            addressState: card['address_state'] || null,
            addressZip: card['address_zip'] || null,
            addressCountry: card['address_country'] || null,
            country: card.country,
            expMonth: card['exp_month'],
            expYear: card['exp_year'],
            last4: card.last4,
            object: card.object,
            brand: card.brand,
            funding: card.funding
          },
          created: response.created,
          livemode: response.livemode,
          type: response.type,
          object: response.object,
          used: response.used
        };
        callback(null, token);
      };
      const data = {
        number: card.number,
        cvc: card.cvc,
        exp_month: card.expMonth,
        exp_year: card.expYear,
        name: card.name,
        address_line1: card.addressLine1,
        address_line2: card.addressLine2,
        address_city: card.addressCity,
        address_state: card.addressState,
        address_zip: card.addressZip,
        address_country: card.addressCountry
      };
      this._getStripe(stripe => {stripe.card.createToken(data, handler);});
    }
  };

  // Populate the library with the API client and supported version.
  jujulib.stripe = stripe;

}((module && module.exports) ? module.exports : this));
