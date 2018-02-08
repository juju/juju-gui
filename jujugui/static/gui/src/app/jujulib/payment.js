/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

var module = module;

(function(exports) {

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
              - country {String} The address country code
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
              - country {String} The address country code
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
                - country {String|Null} The address country code
                - phones {Array} a list of phone number strings
              - id {String} The unique payment method id.
              - brand {String} The card brand name
              - last4 {String} The last four digits of the card number
              - month {Int} The card expiry month
              - name {String} The user provided identifier of the card
              - cardHolder {String} The name of the card owner
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
      const headers = null;
      return this.bakery.get(
        url, headers, jujulib._wrap(handler, {parseJSON: true}));
    },

    /**
      Add a user.

      @public createUser
      @param user {Object} The user data object, containing:
        - nickname {String} The user's nickname,
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
          - country {String} The address country code
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
            - country {String} The address country code
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
      const body = JSON.stringify({
        nickname: user.nickname,
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
      });
      const headers = {
        'Content-Type': 'application/json'
      };
      return this.bakery.post(
        url, headers, body, jujulib._wrap(handler, {parseJSON: true}));
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
      const headers = null;
      return this.bakery.get(
        url, headers, jujulib._wrap(handler, {parseJSON: true}));
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
            - country {String|Null} The address country code
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
        callback(null, this._parsePaymentMethods(response['payment-methods']));
      };
      const url = `${this.url}/u/${username}/payment-methods`;
      const headers = null;
      return this.bakery.get(
        url, headers, jujulib._wrap(handler, {parseJSON: true}));
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
        callback(null, this._parsePaymentMethod(response));
      };
      const url = `${this.url}/u/${username}/payment-methods`;
      const headers = {
        'Content-Type': 'application/json'
      };
      const body = JSON.stringify({
        'payment-method-name': methodName,
        token: token
      });
      return this.bakery.post(
        url, headers, body, jujulib._wrap(handler, {parseJSON: true}));
    },

    /**
      Update a new payment method. The method MUST be provided the address and
      expiry, even if it is the existing data.

      @public updatePaymentMethod
      @param username {String} The user's username.
      @param id {String} The payment method id.
      @param address {Object} The new payment method address, containing:
        - line1 {String} The first address line,
        - line2 {String} The second address line,
        - county {String} The address county,
        - city {String} The address city,
        - postcode {String} The address post code,
        - country {String} The address country,
      @param expiry {String} The new payment method expiry in the format: MM/YY.
      @param callback {Function} A callback to handle errors from the request.
        Must accept an error message or null as its first parameter.
    */
    updatePaymentMethod: function(username, id, address, expiry, callback) {
      const handler = error => {
        callback(error);
      };
      const url = `${this.url}/u/${username}/payment-methods/${id}/content`;
      const parts = expiry.split('/');
      const body = JSON.stringify({
        address: this._unparseAddress(address),
        month: parseInt(parts[0]),
        year: parseInt(parts[1])
      });
      const headers = {
        'Content-Type': 'application/json'
      };
      return this.bakery.put(
        url, headers, body, jujulib._wrap(handler, {parseJSON: true}));
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
      const headers = null;
      const body = JSON.stringify({
        'payment-method-name': id
      });
      return this.bakery.delete(
        url, headers, body, jujulib._wrap(handler, {parseJSON: true}));
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
        - country {String} The address country code
        - phones {Array} a list of phone number strings
      @param callback {Function} A callback to handle errors. Must accept an
        error message or null as its first parameter.
    */
    addAddress: function(username, address, callback) {
      const handler = error => {
        callback(error);
      };
      const url = `${this.url}/u/${username}/addresses`;
      const headers = null;
      const body = JSON.stringify(this._unparseAddress(address));
      return this.bakery.put(
        url, headers, body, jujulib._wrap(handler, {parseJSON: true}));
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
        - country {String} The address country code
        - phones {Array} a list of phone number strings
      @param callback {Function} A callback to handle errors. Must accept an
        error message or null as its first parameter.
    */
    addBillingAddress: function(username, address, callback) {
      const handler = error => {
        callback(error);
      };
      const url = `${this.url}/u/${username}/billing-addresses`;
      const headers = null;
      const body = JSON.stringify(this._unparseAddress(address));
      return this.bakery.put(
        url, headers, body, jujulib._wrap(handler, {parseJSON: true}));
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
        - country {String} The address country code
        - phones {Array} a list of phone number strings
      @param callback {Function} A callback to handle errors. Must accept an
        error message or null as its first parameter.
    */
    updateAddress: function(username, id, address, callback) {
      const handler = error => {
        callback(error);
      };
      const url = `${this.url}/u/${username}/addresses/${id}`;
      const headers = {
        'Content-Type': 'application/json'
      };
      const objAddress = this._unparseAddress(address);
      // The API uses the id on the address object, not the id in the URL to do
      // the lookup, so attach the id here.
      objAddress.id = id;
      const body = JSON.stringify(objAddress);
      this.bakery.put(
        url, headers, body, jujulib._wrap(handler, {parseJSON: true}));
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
        - country {String} The address country code
        - phones {Array} a list of phone number strings
      @param callback {Function} A callback to handle errors. Must accept an
        error message or null as its first parameter.
    */
    updateBillingAddress: function(username, id, address, callback) {
      const handler = error => {
        callback(error);
      };
      const url = `${this.url}/u/${username}/billing-addresses/${id}`;
      const headers = {
        'Content-Type': 'application/json'
      };
      const objAddress = this._unparseAddress(address);
      // The API uses the id on the address object, not the id in the URL to do
      // the lookup, so attach the id here.
      objAddress.id = id;
      const body = JSON.stringify(objAddress);
      this.bakery.put(
        url, headers, body, jujulib._wrap(handler, {parseJSON: true}));
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
      const headers = null;
      const body = null;
      return this.bakery.delete(
        url, headers, body, jujulib._wrap(handler, {parseJSON: true}));
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
      const headers = null;
      const body = null;
      this.bakery.delete(
        url, headers, body, jujulib._wrap(handler, {parseJSON: true}));
    },

    /**
      Get the charges for a user.

      @param name {String} The user's username.
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and a list of charges as its second. The charges are
        an array of objects containing:
        - id {String} The unique charge ID,
        - statementId {String} The ID for the statement,
        - price {Integer} The total price in cents,
        - vat {Integer} The VAT component of the price in cents,
        - currency {String} The currency for the charge,
        - nickname {String} The user's nickname,
        - for {String} The date for the charge,
        - origin {String} The origin of the charge,
        - state {String} The status of the charge,
        - lineItems {Array} The list of items in the statement, containing:
          - name {String} The name of the item,
          - details {String} The details of the item,
          - usage {String} The usage for the item,
          - price {String} The price for the item in cents,
        - paymentReceivedAt {String} The date the payment was received,
        - paymentMethodUsed {Object} The payment method used, containing:
          - address {Object} The card address object containing:
            - id {String} The unique address id,
            - name {String|Null} The name for the address e.g.
              "Geoffrey Spinach" or "Tuque LTD",
            - line1 {String|Null} The first address line,
            - line2 {String|Null} The second address line,
            - county {String|Null} The address county,
            - city {String|Null} The address city,
            - postcode {String|Null} The address post code,
            - country {String|Null} The address country code,
            - phones {Array} a list of phone number strings,
          - id {String} The unique payment method id,
          - brand {String} The card brand name,
          - last4 {String} The last four digits of the card number,
          - month {Int} The card expiry month,
          - name {String} The user provided identifier of the card,
          - cardHolder {String} The name of the card owner,
          - valid {Boolean} Whether the card is valid e.g. the card has not
            expired,
          - Year {Int} The card expiry year,
        - paymentRetryDelay {Integer} The delay for the retry,
        - paymentRetryMax {Integer} The maximum number of retries,
        - paymentMethodUpdateRetryDelay {Integer} The delay for retrying the
          payment method update,
        - paymentMethodUpdateRetryMax {Integer} The maximum number of payment
          method update retries.
    */
    getCharges: function(username, callback) {
      const handler = (error, response) => {
        if (error !== null) {
          callback(error, null);
          return;
        }
        let parsed = [];
        if (response.charges) {
          parsed = response.charges.map(charge => {
            const lineItems = charge['line-items'].map(item => {
              return {
                name: item.name,
                details: item.details,
                usage: item.usage,
                price: item.price
              };
            });
            return {
              id: charge.id,
              statementId: charge['statement-id'],
              price: charge.price,
              vat: charge.vat,
              currency: charge.currency,
              nickname: charge.nickname,
              for: charge.for,
              origin: charge.origin,
              state: charge.state,
              lineItems: lineItems,
              paymentReceivedAt: charge['payment-received-at'],
              paymentMethodUsed: this._parsePaymentMethod(
                charge['payment-method-used']),
              paymentRetryDelay: charge['payment-retry-delay'],
              paymentRetryMax: charge['payment-retry-max'],
              paymentMethodUpdateRetryDelay: charge[
                'payment-method-update-retry-delay'],
              paymentMethodUpdateRetryMax: charge[
                'payment-method-update-retry-max']
            };
          });
        }
        callback(null, parsed);
      };
      const url = `${this.url}/charges?nickname=${username}`;
      const headers = {
        'Content-Type': 'application/json'
      };
      return this.bakery.get(
        url, headers, jujulib._wrap(handler, {parseJSON: true}));
    },

    /**
      Get the receipt for a charge.

      @param chargeId {String} A charge ID.
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and a receipt string as its second.
    */
    getReceipt: function(chargeId, callback) {
      const handler = (error, response) => {
        if (error !== null) {
          callback(error, null);
          return;
        }
        // Because the api response does not follow the convention this needs
        // additional processing to determine if it's in error.
        let resp;
        try {
          resp = JSON.parse(response);
          const parsedError =
            resp.error || resp.Error || resp.message || resp.Message;
          if (parsedError) {
            callback(parsedError, null);
            return;
          }
          callback(null, resp);
        } catch (_) {
          // If it can't parse it as json then it's a valid html response.
          callback(null, response);
        }
      };
      const url = `${this.url}/receipts/${chargeId}`;
      const headers = null;
      return this.bakery.get(url, headers, jujulib._wrap(handler));
    },

    /**
      Reformat payment method objects for easier use with JavaScript.

      @public _parsePaymentMethods
      @param paymentMethods {Array} Payment method reponses from the API.
      @returns {Array} A list of parsed payment method objects.
    */
    _parsePaymentMethods: function(paymentMethods) {
      return paymentMethods.map(method => {
        return this._parsePaymentMethod(method);
      });
    },

    /**
      Reformat a payment method object for easier use with JavaScript.

      @public _parsePaymentMethod
      @param paymentMethod {Object} A payment method reponse from the API.
      @returns {Object} A parsed payment method object.
    */
    _parsePaymentMethod: function(paymentMethod) {
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
        cardHolder: paymentMethod['card-holder'] || null,
        id: paymentMethod.id,
        brand: paymentMethod.brand || null,
        last4: paymentMethod.last4 || null,
        month: paymentMethod.month || null,
        name: paymentMethod.name || null,
        valid: paymentMethod.valid || false,
        year: paymentMethod.year || null
      };
      return parsed;
    },

    /**
      Reformat the user object for easier use with JavaScript.

      @public _parseUser
      @param user {Object} A user reponse from the API.
      @returns {Object} A parsed user object.
    */
    _parseUser: function(user) {
      if (!user) {
        return null;
      }
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
        county: address.county || null,
        postcode: address.postcode || null,
        'country-code': address.country || null,
        phones: address.phones || []
      };
    }
  };

  // Populate the library with the API client and supported version.
  jujulib.payment = payment;
  jujulib.paymentAPIVersion = paymentAPIVersion;

}((module && module.exports) ? module.exports : this));
