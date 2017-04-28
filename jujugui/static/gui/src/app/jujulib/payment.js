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
          - name {String} The user's full name
          - email {String} The user's email address
          - business {Boolean} whether this is a business account
          - addresses {Array} A list of address objects, the
            objects contain:
              - id {String} The unique address id.
              - name {String} The name for the address e.g. "Geoffrey Spinach"
                or "Tuque LTD"
              - line1 {String} The first address line
              - line2 {String} The second address line
              - county {String} The address county
              - city {String} The address city
              - postcode {String} The address post code
              - countryCode {String} The address country code
              - phones {Array} a list of phone number strings
          - vat {String|Null} The VAT number
          - businessName {String|Null} The business name
	        - billingAddresses {Array} A list of billing address objects,
            the objects contain:
              - id {String} The unique address id.
              - name {String} The name for the address e.g. "Geoffrey Spinach"
                or "Tuque LTD"
              - line1 {String} The first address line
              - line2 {String} The second address line
              - county {String} The address county
              - city {String} The address city
              - postcode {String} The address post code
              - countryCode {String} The address country code
              - phones {Array} a list of phone number strings
	        - paymentMethods {Array} A list of payment method objects,
            the objects contain:
              - address {Object} The card address object containing
                - id {String} The unique address id.
                - name {String|Null} The name for the address e.g.
                  "Geoffrey Spinach" or "Tuque LTD"
                - line1 {String|Null} The first address line
                - line2 {String|Null} The second address line
                - county {String|Null} The address county
                - city {String|Null} The address city
                - postcode {String|Null} The address post code
                - countryCode {String|Null} The address country code
                - phones {Array} a list of phone number strings
              - id {String} The unique payment method id.
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
      @param user {Object} The user data object, containing:
        - name {String} The user's full name
        - email {String} The user's email address
        - addresses {Array} A list of address objects, the objects contain:
          - name {String} The name for the address e.g. "Geoffrey Spinach" or
            "Tuque LTD"
          - line1 {String} The first address line
          - line2 {String} The second address line
          - county {String} The address county
          - city {String} The address city
          - postcode {String} The address post code
          - countryCode {String} The address country code
          - phones {Array} a list of phone number strings
        - vat {String|Null} The VAT number
        - business {Boolean} whether this is a business account
        - businessName {String|Null} The business name
        - billingAddresses {Array} A list of billing address objects,
          the objects contain:
            - name {String} The name for the address e.g. "Geoffrey Spinach" or
              "Tuque LTD"
            - line1 {String} The first address line
            - line2 {String} The second address line
            - county {String} The address county
            - city {String} The address city
            - postcode {String} The address post code
            - countryCode {String} The address country code
            - phones {Array} a list of phone number strings
        - allowEmail {Boolean} Whether the user allows emails
        - token {String|Null} A Stripe token
        - paymentMethodName {String|Null} A payment method name
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and a user object as its second (see the getUser object
        for the fields it returns).
    */
    createUser: function(user, callback) {
      const handler = (error, response) => {
        if (error !== null) {
          callback(error, null);
          return;
        }
        const parsed = this._parseUser(response);
        callback(null, parsed);
      };
      const url = `${this.url}/u`;
      const payload = {
        name: user.name,
        email: user.email,
        addresses: this._unparseAddresses(user.addresses),
        vat: user.vat,
        business: user.business,
        'business-name': user.businessName,
        'billing-addresses': this._unparseAddresses(user.billingAddresses),
        'allow-email': user.allowEmail || false,
        token: user.token,
        'payment-method-name': user.paymentMethodName || null
      };
      return jujulib._makeRequest(this.bakery, url, 'PUT', payload, handler);
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
        callback(null, response['countries']);
      };
      const url = `${this.url}/country`;
      return jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Get a list of the user's payment methods.

      @public getPaymentMethods
      @param username {String} The user's username.
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and the payment methods as its second. The payment
        methods is an array of payment method objects containing:
          - address {Object} The card address object containing
            - id {String} The unique address id.
            - name {String|Null} The name for the address e.g.
              "Geoffrey Spinach" or "Tuque LTD"
            - line1 {String|Null} The first address line
            - line2 {String|Null} The second address line
            - county {String|Null} The address county
            - city {String|Null} The address city
            - postcode {String|Null} The address post code
            - countryCode {String|Null} The address country code
          - id {String} The unique payment method id.
          - brand {String} The card brand name
          - last4 {String} The last four digits of the card number
          - year {Int} The card expiry year
          - month {Int} The card expiry month
          - name {String} The user provided identifier of the card
          - cardHolder {String} The name of the card owner
          - valid {Boolean} Whether the card is valid e.g. the card has not
            expired
    */
    getPaymentMethods: function(username, callback) {
      const handler = (error, response) => {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, this._parsePaymentMethods(
          response['payment-methods'], true));
      };
      const url = `${this.url}/u/${username}/payment-methods`;
      return jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Create a new payment method.

      @public createPaymentMethod
      @param username {String} The user's username.
      @param token {String} A Stripe token.
      @param methodName {String} A name for this payment method.
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and a payment method object as its second (see the
        getPaymentMethods docstring for the fields it returns).
    */
    createPaymentMethod: function(username, token, methodName, callback) {
      const handler = (error, response) => {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, this._parsePaymentMethod(response, true));
      };
      const url = `${this.url}/u/${username}/payment-methods`;
      const payload = {
        'payment-method-name': methodName,
        token: token
      };
      return jujulib._makeRequest(this.bakery, url, 'PUT', payload, handler);
    },

    /**
      Remove a new payment method.

      @public removePaymentMethod
      @param name {String} The user's username.
      @param id {String} The payment method id.
      @param callback {Function} A callback to handle errors from the request.
        Must accept an error message or null as its first parameter.
    */
    removePaymentMethod: function(username, id, callback) {
      const handler = error => {
        callback(error);
      };
      const url = `${this.url}/u/${username}/payment-methods/${id}`;
      const payload = {
        'payment-method-name': id
      };
      return jujulib._makeRequest(this.bakery, url, 'DELETE', payload, handler);
    },

    /**
      Add an address.

      @public addAddress
      @param username {String} The user's username.
      @param address {Object} An address containing:
        - name {String} The name for the address e.g. "Geoffrey Spinach" or
          "Tuque LTD"
        - line1 {String} The first address line
        - line2 {String} The second address line
        - county {String} The address county
        - city {String} The address city
        - postcode {String} The address post code
        - countryCode {String} The address country code
        - phones {Array} a list of phone number strings
      @param callback {Function} A callback to handle errors. Must accept an
        error message or null as its first parameter.
    */
    addAddress: function(username, address, callback) {
      const handler = error => {
        callback(error);
      };
      const url = `${this.url}/u/${username}/addresses`;
      const payload = this._unparseAddress(address);
      return jujulib._makeRequest(this.bakery, url, 'PUT', payload, handler);
    },

    /**
      Add a billing address.

      @public addBillingAddress
      @param username {String} The user's username.
      @param address {Object} An address containing:
        - name {String} The name for the address e.g. "Geoffrey Spinach" or
          "Tuque LTD"
        - line1 {String} The first address line
        - line2 {String} The second address line
        - county {String} The address county
        - city {String} The address city
        - postcode {String} The address post code
        - countryCode {String} The address country code
        - phones {Array} a list of phone number strings
      @param callback {Function} A callback to handle errors. Must accept an
        error message or null as its first parameter.
    */
    addBillingAddress: function(username, address, callback) {
      const handler = error => {
        callback(error);
      };
      const url = `${this.url}/u/${username}/billing-addresses`;
      const payload = this._unparseAddress(address);
      return jujulib._makeRequest(this.bakery, url, 'PUT', payload, handler);
    },

    /**
      Update an address.

      @public updateAddress
      @param username {String} The user's username.
      @param id {String} The id for an address.
      @param address {Object} An address containing:
        - name {String} The name for the address e.g. "Geoffrey Spinach" or
          "Tuque LTD"
        - line1 {String} The first address line
        - line2 {String} The second address line
        - county {String} The address county
        - city {String} The address city
        - postcode {String} The address post code
        - countryCode {String} The address country code
        - phones {Array} a list of phone number strings
      @param callback {Function} A callback to handle errors. Must accept an
        error message or null as its first parameter.
    */
    updateAddress: function(username, id, address, callback) {
      const handler = error => {
        callback(error);
      };
      const url = `${this.url}/u/${username}/addresses/${id}`;
      const payload = this._unparseAddress(address);
      // The API uses the id on the address object, not the id in the URL to do
      // the lookup, so attach the id here.
      payload.id = id;
      return jujulib._makeRequest(this.bakery, url, 'POST', payload, handler);
    },

    /**
      Update a billing address.

      @public updateBillingAddress
      @param username {String} The user's username.
      @param id {String} The id for a billing address.
      @param address {Object} An address containing:
        - name {String} The name for the address e.g. "Geoffrey Spinach" or
          "Tuque LTD"
        - line1 {String} The first address line
        - line2 {String} The second address line
        - county {String} The address county
        - city {String} The address city
        - postcode {String} The address post code
        - countryCode {String} The address country code
        - phones {Array} a list of phone number strings
      @param callback {Function} A callback to handle errors. Must accept an
        error message or null as its first parameter.
    */
    updateBillingAddress: function(username, id, address, callback) {
      const handler = error => {
        callback(error);
      };
      const url = `${this.url}/u/${username}/billing-addresses/${id}`;
      const payload = this._unparseAddress(address);
      // The API uses the id on the address object, not the id in the URL to do
      // the lookup, so attach the id here.
      payload.id = id;
      return jujulib._makeRequest(this.bakery, url, 'POST', payload, handler);
    },

    /**
      Remove an address.

      @public removeAddress
      @param name {String} The user's username.
      @param id {String} The unique address id.
      @param callback {Function} A callback to handle errors from the request.
        Must accept an error message or null as its first parameter.
    */
    removeAddress: function(username, id, callback) {
      const handler = error => {
        callback(error);
      };
      const url = `${this.url}/u/${username}/addresses/${id}`;
      return jujulib._makeRequest(this.bakery, url, 'DELETE', null, handler);
    },

    /**
      Remove a billing address.

      @public removeBillingAddress
      @param name {String} The user's username.
      @param id {String} The unique address id.
      @param callback {Function} A callback to handle errors from the request.
        Must accept an error message or null as its first parameter.
    */
    removeBillingAddress: function(username, id, callback) {
      const handler = error => {
        callback(error);
      };
      const url = `${this.url}/u/${username}/billing-addresses/${id}`;
      return jujulib._makeRequest(this.bakery, url, 'DELETE', null, handler);
    },

    /**
      Reformat payment method objects for easier use with JavaScript.

      @public _parsePaymentMethods
      @param paymentMethods {Array} Payment method reponses from the API.
      @param parseCardholder {Boolean} Whether to include the card-holder.
      @returns {Array} A list of parsed payment method objects.
    */
    _parsePaymentMethods: function(paymentMethods, parseCardholder=false) {
      return paymentMethods.map(method => {
        return this._parsePaymentMethod(method, parseCardholder);
      });
    },

    /**
      Reformat a payment method object for easier use with JavaScript.

      @public _parsePaymentMethod
      @param paymentMethod {Object} A payment method reponse from the API.
      @param parseCardholder {Boolean} Whether to include the card-holder.
      @returns {Object} A parsed payment method object.
    */
    _parsePaymentMethod: function(paymentMethod, parseCardholder=false) {
      const address = paymentMethod.address;
      const parsed = {
        address: {
          id: address.id,
          name: address.name || null,
          line1: address.line1 || null,
          line2: address.line2 || null,
          city: address.city || null,
          state: address.county || null,
          postcode: address.postcode || null,
          country: address.country || null
        },
        id: paymentMethod.id,
        brand: paymentMethod.brand || null,
        last4: paymentMethod.last4 || null,
        month: paymentMethod.month || null,
        name: paymentMethod.name || null,
        valid: paymentMethod.valid || false,
        year: paymentMethod.year || null
      };
      if (parseCardholder) {
        parsed.cardHolder = paymentMethod['card-holder'];
      }
      return parsed;
    },

    /**
      Reformat the user object for easier use with JavaScript.

      @public _parseUser
      @param user {Object} A user reponse from the API.
      @returns {Object} A parsed user object.
    */
    _parseUser: function(user) {
      return {
        nickname: user.nickname || null,
        name: user.name || null,
        email: user.email || null,
        business: user.business || false,
        addresses: this._parseAddresses(user.addresses),
        vat: user.vat || null,
        businessName: user['business-name'] || null,
        billingAddresses: this._parseAddresses(user['billing-addresses']),
        paymentMethods: this._parsePaymentMethods(
          user['payment-methods'] || []),
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
        id: address.id,
        name: address.name || null,
        line1: address.line1 || null,
        line2: address.line2 || null,
        city: address.city || null,
        county: address.county || null,
        postcode: address.postcode || null,
        countryCode: address['country-code'] || null,
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
        county: address.county || null,
        postcode: address.postcode || null,
        'country-code': address.countryCode || null,
        phones: address.phones || []
      };
    }
  };

  // Populate the library with the API client and supported version.
  jujulib.payment = payment;
  jujulib.paymentAPIVersion = paymentAPIVersion;

}((module && module.exports) ? module.exports : this));
