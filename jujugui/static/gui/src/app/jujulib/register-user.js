/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

var module = module;

(function (exports) {

  const jujulib = exports.jujulib;

  /**
    Register User service client.

    Provides access to the Register User API.
  */

  const registerUserAPIVersion = 'v1';

  /**
    Initializer.

    @function registerUser
    @param url {String} The URL of the Register User instance, including
      scheme and port, and excluding the API version.
    @param bakery {Object} A bakery object for communicating with the Register
      User instance.
    @returns {Object} A client object for making Register User API calls.
  */
  function registerUser(url, bakery) {
    // Store the API URL (including version) handling missing trailing slash.
    this.url = url.replace(/\/?$/, '/') + registerUserAPIVersion;
    this.bakery = bakery;
  };

  registerUser.prototype = {
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
	        - last {String} The user's first name
	        - email {String} The user's email address
	        - business {Boolean} whether this is a business account
          - addresses {Array} A list of address objects (if defined)
          - vat {String} The VAT number (if defined)
          - business-name {String} The business name (if defined)
	        - billing-addresses {Array} A list of billing address objects
              (if defined)
	        - payment-methods {Array} A list of payment method objects
          - allow-email {Boolean} Whether the user allows emails
          - valid {Boolean} Whether the user is valid
        If the user is not found, the second argument is null.
    */
    getUser: function(name, callback) {
      const handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, {
          nickname: response.nickname,
          first: response.first,
          last: response.last,
          email: response.email,
          business: response.business,
          addresses: response.addresses,
          vat: response.vat,
          businessName: response['business-name'],
          billingAddresses: response['billing-addresses'],
          paymentMethods: response['payment-methods'],
          allowEmail: response['allow-email'],
          valid: response.valid
        });
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
        - last {String} The user's first name
        - email {String} The user's email address
        - addresses {Array} A list of address objects (not required)
        - vat {String} The VAT number (not required)
        - business {Boolean} whether this is a business account
        - businessName {String} The business name (not required)
        - billingAddresses {Array} A list of billing address objects
            (not required)
        - allowEmail {Boolean} Whether the user allows emails
        - token {String} A Stripe token (not required)
        - paymentMethodName {String} The name of the payment method
            (not required)
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and a user object as its second.
    */
    createUser: function(name, user, callback) {
      const handler = function(error, user) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, {
          first: user.first,
          last: user.last,
          email: user.email,
          addresses: user.addresses,
          vat: user.vat,
          business: user.business,
          businessName: user['business-name'],
          billingAddresses: user['billing-addresses'],
          allowEmail: user['allow-email'],
          token: user.token,
          paymentMethodName: user['payment-method-name']
        });
      };
      const url = `${this.url}/u/${name}`;
      const payload = {
        user: {
          first: user.first,
          last: user.last,
          email: user.email,
          addresses: user.addresses,
          vat: user.vat,
          business: user.business,
          'business-name': user.businessName,
          'billing-addresses': user.billingAddresses,
          'allow-email': user.allowEmail,
          token: user.token,
          'payment-method-name': user.paymentMethodName
        }
      };
      return jujulib._makeRequest(this.bakery, url, 'POST', payload, handler);
    }

  };

  // Populate the library with the API client and supported version.
  jujulib.registerUser = registerUser;
  jujulib.registerUserAPIVersion = registerUserAPIVersion;

}((module && module.exports) ? module.exports : this));
