/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

var module = module;

(function (exports) {

  const jujulib = exports.jujulib;

  /**
    Payment service client.

    Provides access to the payment API.
  */

  const paymentAPIVersion = 'v1';

  /**
    Initializer.

    @function payment
    @param url {String} The URL of the payment instance, including
      scheme and port, and excluding the API version.
    @param bakery {Object} A bakery object for communicating with the Register
      User instance.
    @returns {Object} A client object for making payment API calls.
  */
  function payment(url, bakery) {
    // Store the API URL (including version) handling missing trailing slash.
    this.url = url.replace(/\/?$/, '/') + paymentAPIVersion;
    this.bakery = bakery;
  };

  payment.prototype = {
    /**
      Get the details for a user.

      @public getUser
      @param name {String} The user's username.
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and the user data as its second. The user data
        includes the following fields:
          - nickname {String} The user's nickname
          - first {String} The user's first name
          - last {String} The user's last name
          - email {String} The user's email address
          - business {Boolean} whether this is a business account
          - addresses {Array} A list of address objects, the
            objects contain:
              - name {String} The name of the address e.g. "Home"
              - line1 {String} The first address line
              - line2 {String} The second address line
              - county {String} The address county
              - city {String} The address city
              - postCode {String} The address post code
              - country {String} The address country
              - phones {Array} a list of phone number strings
          - vat {String|Null} The VAT number
          - businessName {String|Null} The business name
	        - billingAddresses {Array} A list of billing address objects,
            the objects contain:
              - name {String} The name of the address e.g. "Home"
              - line1 {String} The first address line
              - line2 {String} The second address line
              - county {String} The address county
              - city {String} The address city
              - postCode {String} The address post code
              - country {String} The address country
              - phones {Array} a list of phone number strings
	        - paymentMethods {Array} A list of payment method objects,
            the objects contain:
              - address {Object} The card address object containing
                - name {String|Null} The name of the address e.g. "Home"
                - line1 {String|Null} The first address line
                - line2 {String|Null} The second address line
                - county {String|Null} The address county
                - city {String|Null} The address city
                - postCode {String|Null} The address post code
                - country {String|Null} The address country
                - phones {Array} a list of phone number strings
              - brand {String} The card brand name
              - last4 {String} The last four digits of the card number
              - month {Int} The card expiry month
              - name {String} The user provided identifier of the card
              - valid {Boolean} Whether the card is valid e.g. the card has not
                expired
              - Year {Int} The card expiry year
          - allowEmail {Boolean} Whether the user allows emails
          - valid {Boolean} Whether the user is valid e.g. the user has been
            disabled after unsuccessful payment attempts
        If the user is not found, the second argument is null.
    */
    getUser: function(name, callback) {
      const handler = (error, response) => {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, this._parseUser(response));
      };
      const url = `${this.url}/u/${name}`;
      return jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Add a user.

      @public createUser
      @param name {String} The user's username.
      @param user {Object} The user data object, containing:
        - first {String} The user's first name
        - last {String} The user's last name
        - email {String} The user's email address
        - addresses {Array} A list of address objects, the objects contain:
          - name {String} The name of the address e.g. "Home"
          - line1 {String} The first address line
          - line2 {String} The second address line
          - county {String} The address county
          - city {String} The address city
          - postCode {String} The address post code
          - country {String} The address country
          - phones {Array} a list of phone number strings
        - vat {String|Null} The VAT number
        - business {Boolean} whether this is a business account
        - businessName {String|Null} The business name
        - billingAddresses {Array} A list of billing address objects,
          the objects contain:
            - name {String} The name of the address e.g. "Home"
            - line1 {String} The first address line
            - line2 {String} The second address line
            - county {String} The address county
            - city {String} The address city
            - postCode {String} The address post code
            - country {String} The address country
            - phones {Array} a list of phone number strings
        - allowEmail {Boolean} Whether the user allows emails
        - token {String|Null} A payment authentication token
        - paymentMethodName {String|Null} The name of the payment method
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and a user object as its second (see the getUser object
        for the fields it returns).
    */
    createUser: function(name, user, callback) {
      const handler = (error, response) => {
        if (error !== null) {
          callback(error, null);
          return;
        }
        const parsed = this._parseUser(response);
        callback(null, parsed);
      };
      const url = `${this.url}/u/${name}`;
      const payload = {
        user: {
          first: user.first,
          last: user.last,
          email: user.email,
          addresses: this._unparseAddresses(user.addresses),
          vat: user.vat,
          business: user.business,
          'business-name': user.businessName,
          'billing-addresses': this._unparseAddresses(user.billingAddresses),
          'allow-email': user.allowEmail,
          token: user.token,
          'payment-method-name': user.paymentMethodName
        }
      };
      return jujulib._makeRequest(this.bakery, url, 'POST', payload, handler);
    },

    /**
      Get a list of countries.

      @public getCountries
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and the country data as its second. The country data
        returns {Array} A list of country objects, the objects contain:
          - name {String} The country name e.g. "Australia"
          - code {String} The country code e.g. "AU"
    */
    getCountries: function(callback) {
      const handler = (error, response) => {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, response['Countries']);
      };
      const url = `${this.url}/country`;
      return jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Reformat the user object for easier use with JavaScript.

      @public _parseUser
      @param user {Object} A user reponse from the API.
      @returns {Object} A parsed user object.
    */
    _parseUser: function(user) {
      const paymentMethods = (user['payment-methods'] || []).map(method => {
        return {
          address: this._parseAddress(method.address),
          brand: method.brand || null,
          last4: method.last4 || null,
          month: method.month || null,
          name: method.name || null,
          valid: method.valid || false,
          year: method.year || null
        };
      });
      return {
        nickname: user.nickname || null,
        first: user.first || null,
        last: user.last || null,
        email: user.email || null,
        business: user.business || false,
        addresses: this._parseAddresses(user.addresses),
        vat: user.vat || null,
        businessName: user['business-name'] || null,
        billingAddresses: this._parseAddresses(user['billing-addresses']),
        paymentMethods: paymentMethods,
        allowEmail: user['allow-email'] || false,
        valid: user.valid || false
      };
    },

    /**
      Reformat the address objects for easier use with JavaScript.

      @public _parseAddresses
      @param addresses {Array} A list of addresses from the API.
      @returns {Array} A parsed adresses array.
    */
    _parseAddresses: function(addresses) {
      return (addresses || []).map(address => {
        return this._parseAddress(address);
      });
    },

    /**
      Reformat an address object for easier use with JavaScript.

      @public _parseAddress
      @param address {Object} An address from the API.
      @returns {Object} A parsed adress.
    */
    _parseAddress: function(address) {
      return {
        name: address.name || null,
        line1: address.line1 || null,
        line2: address.line2 || null,
        city: address.city || null,
        postCode: address['post-code'] || null,
        country: address.country || null,
        phones: address.phones || []
      };
    },

    /**
      Reformat the address objects for use with the API.

      @public _unparseAddresses
      @param addresses {Array} A list of addresses.
      @returns {Array} An unparsed adresses array.
    */
    _unparseAddresses: function(addresses) {
      return (addresses || []).map(address => {
        return this._unparseAddress(address);
      });
    },

    /**
      Reformat an address object for use with the API.

      @public _unparseAddress
      @param address {Object} An address.
      @returns {Object} An unparsed adress.
    */
    _unparseAddress: function(address) {
      return {
        name: address.name || null,
        line1: address.line1 || null,
        line2: address.line2 || null,
        city: address.city || null,
        'post-code': address.postCode || null,
        country: address.country || null,
        phones: address.phones || []
      };
    }
  };

  // Populate the library with the API client and supported version.
  jujulib.payment = payment;
  jujulib.paymentAPIVersion = paymentAPIVersion;

}((module && module.exports) ? module.exports : this));
