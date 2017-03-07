/* Copyright (C) 2016 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('jujulib register user service', function() {
  let cleanups = [];

  const makeXHRRequest = function(obj) {
    return {target: {responseText: JSON.stringify(obj)}};
  };

  afterEach(function() {
    cleanups.forEach(cleanup => {
      cleanup();
    });
  });

  it('exists', function() {
    const bakery = {};
    const registerUser = new window.jujulib.registerUser(
      'http://1.2.3.4/', bakery);
    assert.strictEqual(
      registerUser instanceof window.jujulib.registerUser, true);
    assert.strictEqual(
      registerUser.url,
      `http://1.2.3.4/${window.jujulib.registerUserAPIVersion}`);
  });

  it('can get a user', function(done) {
    const bakery = {
      sendGetRequest: function(path, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.registerUserAPIVersion +
          '/u/spinach');
        const xhr = makeXHRRequest({
          nickname: 'spinach',
          first: 'Geoffrey',
          last: 'Spinach',
          email: 'spinach@example.com',
          business: true,
          addresses: [{street: 'address'}],
          vat: '1234',
          'business-name': 'Spinachy business',
          'billing-addresses': [{street: 'billing address'}],
          'payment-methods': [{payment: 'method'}],
          'allow-email': true,
          valid: true
        });
        success(xhr);
      }
    };
    const registerUser = new window.jujulib.registerUser(
      'http://1.2.3.4/', bakery);
    registerUser.getUser('spinach', function(error, user) {
      assert.strictEqual(error, null);
      assert.deepEqual(user, {
        nickname: 'spinach',
        first: 'Geoffrey',
        last: 'Spinach',
        email: 'spinach@example.com',
        business: true,
        addresses: [{street: 'address'}],
        vat: '1234',
        businessName: 'Spinachy business',
        billingAddresses: [{street: 'billing address'}],
        paymentMethods: [{payment: 'method'}],
        allowEmail: true,
        valid: true
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
    const registerUser = new window.jujulib.registerUser(
      'http://1.2.3.4/', bakery);
    registerUser.getUser('spinach', function(error, user) {
      assert.equal(error, 'Uh oh!');
      assert.isNull(user);
      done();
    });
  });

  it('can create a user', function(done) {
    const bakery = {
      sendPostRequest: function(path, params, success, failure) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.registerUserAPIVersion +
          '/u/spinach');
        const xhr = makeXHRRequest({
          first: 'Geoffrey',
          last: 'Spinach',
          email: 'spinach@example.com',
          addresses: [{street: 'address'}],
          vat: '1234',
          business: true,
          'business-name': 'Spinachy business',
          'billing-addresses': [{street: 'billing address'}],
          'allow-email': true,
          token: '54321',
          'payment-method-name': 'Platinum'
        });
        success(xhr);
      }
    };
    const registerUser = new window.jujulib.registerUser(
      'http://1.2.3.4/', bakery);
    const userData = {
      first: 'Geoffrey',
      last: 'Spinach',
      email: 'spinach@example.com',
      addresses: [{street: 'address'}],
      vat: '1234',
      business: true,
      businessName: 'Spinachy business',
      billingAddresses: [{street: 'billing address'}],
      allowEmail: true,
      token: '54321',
      paymentMethodName: 'Platinum',
    };
    registerUser.createUser('spinach', {user: userData}, function(error, user) {
      assert.strictEqual(error, null);
      assert.deepEqual(user, userData);
      done();
    });
  });

  it('handles errors when creating a user', function(done) {
    const bakery = {
      sendPostRequest: function(path, params, success, failure) {
        const xhr = makeXHRRequest({Message: 'Uh oh!'});
        failure(xhr);
      }
    };
    const registerUser = new window.jujulib.registerUser(
      'http://1.2.3.4/', bakery);
    const userData = {
      first: 'Geoffrey',
      last: 'Spinach',
      email: 'spinach@example.com',
      addresses: [{street: 'address'}],
      vat: '1234',
      business: true,
      businessName: 'Spinachy business',
      billingAddresses: [{street: 'billing address'}],
      allowEmail: true,
      token: '54321',
      paymentMethodName: 'Platinum',
    };
    registerUser.createUser('spinach', {user: userData}, function(error, user) {
      assert.equal(error, 'Uh oh!');
      assert.isNull(user);
      done();
    });
  });

});
