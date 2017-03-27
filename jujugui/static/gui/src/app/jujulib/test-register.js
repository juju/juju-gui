/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('jujulib register service', function() {
  let parsedUser, returnedUser;

  const makeXHRRequest = function(obj) {
    return {target: {responseText: JSON.stringify(obj)}};
  };

  beforeEach(function() {
    returnedUser = {
      nickname: 'spinach',
      first: 'Geoffrey',
      last: 'Spinach',
      email: 'spinach@example.com',
      business: true,
      addresses: [{
        city: 'New Orleans',
        'post-code': '70130'
      }],
      vat: '1234',
      'business-name': 'Spinachy business',
      'billing-addresses': [{
        city: 'New Orleans',
        'post-code': '70130'
      }],
      'payment-methods': [{
        address: {
          name: null,
          line1: null,
          line2: null,
          name: null,
          city: 'New Orleans',
          'post-code': null,
          country: null,
          phones: []
        },
        brand: 'Brand',
        last4: '1234',
        month: 3,
        name: 'Main',
        valid: true,
        year: 2017
      }],
      'allow-email': true,
      valid: true
    };
    parsedUser = {
      nickname: 'spinach',
      first: 'Geoffrey',
      last: 'Spinach',
      email: 'spinach@example.com',
      business: true,
      addresses: [{
        name: null,
        line1: null,
        line2: null,
        name: null,
        city: 'New Orleans',
        postCode: '70130',
        country: null,
        phones: []
      }],
      vat: '1234',
      businessName: 'Spinachy business',
      billingAddresses: [{
        name: null,
        line1: null,
        line2: null,
        name: null,
        city: 'New Orleans',
        postCode: '70130',
        country: null,
        phones: []
      }],
      paymentMethods: [{
        address: {
          name: null,
          line1: null,
          line2: null,
          name: null,
          city: 'New Orleans',
          postCode: null,
          country: null,
          phones: []
        },
        brand: 'Brand',
        last4: '1234',
        month: 3,
        name: 'Main',
        valid: true,
        year: 2017
      }],
      allowEmail: true,
      valid: true
    };
  });

  it('exists', function() {
    const bakery = {};
    const payment = new window.jujulib.payment(
      'http://1.2.3.4/', bakery);
    assert.strictEqual(
      payment instanceof window.jujulib.payment, true);
    assert.strictEqual(
      payment.url,
      `http://1.2.3.4/${window.jujulib.paymentAPIVersion}`);
  });

  it('can get a user', function(done) {
    const bakery = {
      sendGetRequest: function(path, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.paymentAPIVersion +
          '/u/spinach');
        const xhr = makeXHRRequest(returnedUser);
        success(xhr);
      }
    };
    const payment = new window.jujulib.payment(
      'http://1.2.3.4/', bakery);
    payment.getUser('spinach', function(error, user) {
      assert.strictEqual(error, null);
      assert.deepEqual(user, parsedUser);
      done();
    });
  });

  it('can handle missing fields when getting a user', function(done) {
    const bakery = {
      sendGetRequest: function(path, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.paymentAPIVersion +
          '/u/spinach');
        const xhr = makeXHRRequest({
          'billing-addresses': [{
            city: 'New Orleans',
          }],
          'payment-methods': [{
            address: {
              city: 'New Orleans'
            }
          }]
        });
        success(xhr);
      }
    };
    const payment = new window.jujulib.payment(
      'http://1.2.3.4/', bakery);
    payment.getUser('spinach', function(error, user) {
      assert.strictEqual(error, null);
      assert.deepEqual(user, {
        nickname: null,
        first: null,
        last: null,
        email: null,
        business: false,
        addresses: [],
        vat: null,
        businessName: null,
        billingAddresses: [{
          name: null,
          line1: null,
          line2: null,
          name: null,
          city: 'New Orleans',
          postCode: null,
          country: null,
          phones: []
        }],
        paymentMethods: [{
          address: {
            name: null,
            line1: null,
            line2: null,
            name: null,
            city: 'New Orleans',
            postCode: null,
            country: null,
            phones: []
          },
          brand: null,
          last4: null,
          month: null,
          name: null,
          valid: false,
          year: null
        }],
        allowEmail: false,
        valid: false
      });
      done();
    });
  });

  it('handles errors when getting a user', function(done) {
    const bakery = {
      sendGetRequest: function(path, success, failure) {
        const xhr = makeXHRRequest({Message: 'Uh oh!'});
        failure(xhr);
      }
    };
    const payment = new window.jujulib.payment(
      'http://1.2.3.4/', bakery);
    payment.getUser('spinach', function(error, user) {
      assert.equal(error, 'Uh oh!');
      assert.isNull(user);
      done();
    });
  });

  it('can create a user', function() {
    const originalMakeRequest = jujulib._makeRequest;
    const makeRequest = sinon.stub();
    jujulib._makeRequest = makeRequest;
    const payment = new window.jujulib.payment('http://1.2.3.4/', {});
    const newUser = {
      first: 'Geoffrey',
      last: 'Spinach',
      email: 'spinach@example.com',
      addresses: [{
        city: 'New Orleans',
        postCode: '70130'
      }],
      vat: '1234',
      business: true,
      businessName: 'Spinachy business',
      billingAddresses: [{
        city: 'New Orleans',
        postCode: '70130'
      }],
      allowEmail: true,
      token: '54321',
      paymentMethodName: 'Platinum'
    };
    payment.createUser('spinach', newUser, sinon.stub());
    // Restore the original method on the lib.
    jujulib._makeRequest = originalMakeRequest;
    assert.equal(makeRequest.callCount, 1);
    assert.deepEqual(makeRequest.args[0][3], {
      user: {
        first: 'Geoffrey',
        last: 'Spinach',
        email: 'spinach@example.com',
        addresses: [{
          name: null,
          line1: null,
          line2: null,
          city: 'New Orleans',
          'post-code': '70130',
          country: null,
          phones: []
        }],
        vat: '1234',
        business: true,
        'business-name': 'Spinachy business',
        'billing-addresses': [{
          name: null,
          line1: null,
          line2: null,
          city: 'New Orleans',
          'post-code': '70130',
          country: null,
          phones: []
        }],
        'allow-email': true,
        token: '54321',
        'payment-method-name': 'Platinum'
      }
    });
  });

  it('can return the user when after creating a user', function() {
    const bakery = {
      sendPostRequest: function(path, params, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.paymentAPIVersion +
          '/u/spinach');
        const xhr = makeXHRRequest(returnedUser);
        success(xhr);
      }
    };
    const payment = new window.jujulib.payment(
      'http://1.2.3.4/', bakery);
    const newUser = {
      first: 'Geoffrey',
      last: 'Spinach',
      email: 'spinach@example.com',
      addresses: [{
        city: 'New Orleans',
        postCode: '70130'
      }],
      vat: '1234',
      business: true,
      businessName: 'Spinachy business',
      billingAddresses: [{
        city: 'New Orleans',
        postCode: '70130'
      }],
      allowEmail: true,
      token: '54321',
      paymentMethodName: 'Platinum'
    };
    payment.createUser('spinach', {user: newUser}, function(error, user) {
      assert.strictEqual(error, null);
      assert.deepEqual(user, parsedUser);
    });
  });

  it('handles errors when creating a user', function(done) {
    const bakery = {
      sendPostRequest: function(path, params, success, failure) {
        const xhr = makeXHRRequest({Message: 'Uh oh!'});
        failure(xhr);
      }
    };
    const payment = new window.jujulib.payment(
      'http://1.2.3.4/', bakery);
    payment.createUser('spinach', {}, function(error, user) {
      assert.equal(error, 'Uh oh!');
      assert.isNull(user);
      done();
    });
  });

  it('can get a list of contries', function(done) {
    const countries = [{
      name: 'Australia',
      code: 'AU'
    }];
    const bakery = {
      sendGetRequest: (path, success, failure) => {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.paymentAPIVersion +
          '/country');
        const xhr = makeXHRRequest({Countries: countries});
        success(xhr);
      }
    };
    const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
    payment.getCountries((error, response) => {
      assert.strictEqual(error, null);
      assert.deepEqual(response, countries);
      done();
    });
  });

  it('handles errors when getting the country list', function(done) {
    const bakery = {
      sendGetRequest: (path, success, failure) => {
        const xhr = makeXHRRequest({Message: 'Uh oh!'});
        failure(xhr);
      }
    };
    const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
    payment.getCountries((error, response) => {
      assert.equal(error, 'Uh oh!');
      assert.isNull(response);
      done();
    });
  });

  describe('createToken', function() {
    let cardData, cardResponse;

    beforeEach(function() {
      cardData = {
        number: '1234123412341234',
        cvc: '321',
        expMonth: '03',
        expYear: '17',
        name: 'Mr G Spinach',
        addressLine1: '1 Maple St',
        addressLine2: 'Right of Nowhere',
        addressCity: 'Somewhere',
        addressState: 'Left a bit',
        addressZip: '70130',
        addressCountry: 'North of the border'
      };
      cardResponse = {
        id: 'tok_8DPg4qjJ20F1aM',
        card: {
          name: null,
          address_line1: '12 Main Street',
          address_line2: 'Apt 42',
          address_city: 'Palo Alto',
          address_state: 'CA',
          address_zip: '94301',
          address_country: 'US',
          country: 'US',
          exp_month: 2,
          exp_year: 2018,
          last4: '4242',
          object: 'card',
          brand: 'Visa',
          funding: 'credit'
        },
        created: 1490567830,
        livemode: true,
        type: 'card',
        object: 'token',
        used: false
      };
    });

    it('can create a token', function() {
      const createToken = sinon.stub().callsArgWith(1, null, cardResponse);
      const stripe = {
        card: {
          createToken: createToken
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', {}, stripe);
      payment.createToken(cardData, sinon.stub());
      assert.equal(createToken.callCount, 1);
      assert.deepEqual(createToken.args[0][0], {
        number: '1234123412341234',
        cvc: '321',
        exp_month: '03',
        exp_year: '17',
        name: 'Mr G Spinach',
        address_line1: '1 Maple St',
        address_line2: 'Right of Nowhere',
        address_city: 'Somewhere',
        address_state: 'Left a bit',
        address_zip: '70130',
        address_country: 'North of the border'
      });
    });

    it('can return the token data', function() {
      const createToken = sinon.stub().callsArgWith(1, null, cardResponse);
      const stripe = {
        card: {
          createToken: createToken
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', {}, stripe);
      const callback = sinon.stub();
      payment.createToken(cardData, callback);
      assert.equal(callback.callCount, 1);
      assert.isNull(callback.args[0][0]);
      assert.deepEqual(callback.args[0][1], {
        id: 'tok_8DPg4qjJ20F1aM',
        card: {
          name: null,
          addressLine1: '12 Main Street',
          addressLine2: 'Apt 42',
          addressCity: 'Palo Alto',
          addressState: 'CA',
          addressZip: '94301',
          addressCountry: 'US',
          country: 'US',
          expMonth: 2,
          expYear: 2018,
          last4: '4242',
          object: 'card',
          brand: 'Visa',
          funding: 'credit'
        },
        created: 1490567830,
        livemode: true,
        type: 'card',
        object: 'token',
        used: false
      });
    });

    it('handles errors when getting a user', function() {
      const createToken = sinon.stub().callsArgWith(1, null, {
        error: {
          type: 'card_error',
          code: 'invalid_expiry_year',
          message: 'Your card\'s expiration year is invalid.',
          param: 'exp_year'
        }
      });
      const stripe = {
        card: {
          createToken: createToken
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', {}, stripe);
      const callback = sinon.stub();
      payment.createToken(cardData, callback);
      assert.equal(callback.callCount, 1);
      assert.equal(callback.args[0][0],
        'Your card\'s expiration year is invalid.');
      assert.isNull(callback.args[0][1]);
    });
  });
});
