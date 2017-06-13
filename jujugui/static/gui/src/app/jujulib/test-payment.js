/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('jujulib payment service', function() {
  let parsedUser, returnedUser;

  const makeXHRRequest = function(obj, json=true) {
    return {target: {responseText: json ? JSON.stringify(obj) : obj}};
  };

  beforeEach(function() {
    returnedUser = {
      nickname: 'spinach',
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
      business: true,
      addresses: [{
        id: 'address1',
        city: 'New Orleans',
        postcode: '70130'
      }],
      vat: '1234',
      'business-name': 'Spinachy business',
      'billing-addresses': [{
        id: 'address2',
        city: 'New Orleans',
        postcode: '70130'
      }],
      'payment-methods': [{
        address: {
          id: 'address3',
          name: null,
          line1: null,
          line2: null,
          county: 'Bunnyhug',
          city: 'New Orleans',
          postcode: null,
          country: null,
          phones: []
        },
        id: 'paymentmethod1',
        brand: 'Brand',
        last4: '1234',
        month: 3,
        name: 'Main',
        'card-holder': 'Mr G Spinach',
        valid: true,
        year: 2017
      }],
      'allow-email': true,
      valid: true
    };
    parsedUser = {
      nickname: 'spinach',
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
      business: true,
      addresses: [{
        id: 'address1',
        name: null,
        line1: null,
        line2: null,
        name: null,
        city: 'New Orleans',
        county: null,
        postcode: '70130',
        country: null,
        phones: []
      }],
      vat: '1234',
      businessName: 'Spinachy business',
      billingAddresses: [{
        id: 'address2',
        name: null,
        line1: null,
        line2: null,
        name: null,
        city: 'New Orleans',
        county: null,
        postcode: '70130',
        country: null,
        phones: []
      }],
      paymentMethods: [{
        address: {
          id: 'address3',
          name: null,
          line1: null,
          line2: null,
          state: 'Bunnyhug',
          city: 'New Orleans',
          postcode: null,
          country: null
        },
        id: 'paymentmethod1',
        brand: 'Brand',
        last4: '1234',
        month: 3,
        name: 'Main',
        cardHolder: 'Mr G Spinach',
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
      get: function(path, headers, callback) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.paymentAPIVersion +
          '/u/spinach');
        const xhr = makeXHRRequest(returnedUser);
        callback(null, xhr);
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
      get: function(path, headers, callback) {
        assert.equal(
          path,
          'http://1.2.3.4/' +
          window.jujulib.paymentAPIVersion +
          '/u/spinach');
        const xhr = makeXHRRequest({
          'billing-addresses': [{
            id: 'address2',
            city: 'New Orleans'
          }],
          'payment-methods': [{
            address: {
              id: 'address3',
              city: 'New Orleans'
            },
            id: 'paymentmethod1'
          }]
        });
        callback(null, xhr);
      }
    };
    const payment = new window.jujulib.payment(
      'http://1.2.3.4/', bakery);
    payment.getUser('spinach', function(error, user) {
      assert.strictEqual(error, null);
      assert.deepEqual(user, {
        nickname: null,
        name: null,
        email: null,
        business: false,
        addresses: [],
        vat: null,
        businessName: null,
        billingAddresses: [{
          id: 'address2',
          name: null,
          line1: null,
          line2: null,
          name: null,
          city: 'New Orleans',
          county: null,
          postcode: null,
          country: null,
          phones: []
        }],
        paymentMethods: [{
          address: {
            id: 'address3',
            name: null,
            line1: null,
            line2: null,
            state: null,
            city: 'New Orleans',
            postcode: null,
            country: null
          },
          id: 'paymentmethod1',
          brand: null,
          last4: null,
          month: null,
          name: null,
          cardHolder: null,
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
      get: function(url, headers, callback) {
        const xhr = makeXHRRequest({Error: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const payment = new window.jujulib.payment(
      'http://1.2.3.4/', bakery);
    payment.getUser('spinach', function(error, user) {
      assert.equal(error, 'Uh oh!');
      assert.strictEqual(user, null);
      done();
    });
  });

  it('can create a user', function() {
    const bakery = {
      put: sinon.stub()
    };
    const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
    const newUser = {
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
      addresses: [{
        city: 'New Orleans',
        postcode: '70130'
      }],
      vat: '1234',
      business: true,
      businessName: 'Spinachy business',
      billingAddresses: [{
        city: 'New Orleans',
        postcode: '70130',
        country: 'US'
      }],
      allowEmail: true,
      token: '54321'
    };
    payment.createUser(newUser, sinon.stub());
    assert.deepEqual(JSON.parse(bakery.put.args[0][2]), {
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
      addresses: [{
        name: null,
        line1: null,
        line2: null,
        city: 'New Orleans',
        county: null,
        postcode: '70130',
        'country-code': null,
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
        county: null,
        postcode: '70130',
        'country-code': 'US',
        phones: []
      }],
      'allow-email': true,
      token: '54321',
      'payment-method-name': null
    });
  });

  it('can return the user when after creating a user', function() {
    const bakery = {
      put: function(url, headers, body, callback) {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          window.jujulib.paymentAPIVersion +
          '/u');
        const xhr = makeXHRRequest(returnedUser);
        callback(null, xhr);
      }
    };
    const payment = new window.jujulib.payment(
      'http://1.2.3.4/', bakery);
    const newUser = {
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
      addresses: [{
        id: 'address1',
        city: 'New Orleans',
        postcode: '70130'
      }],
      vat: '1234',
      business: true,
      businessName: 'Spinachy business',
      billingAddresses: [{
        id: 'address2',
        city: 'New Orleans',
        postcode: '70130'
      }],
      allowEmail: true,
      token: '54321'
    };
    payment.createUser(newUser, function(error, user) {
      assert.strictEqual(error, null);
      assert.deepEqual(user, parsedUser);
    });
  });

  it('handles errors when creating a user', function(done) {
    const bakery = {
      put: function(url, headers, body, callback) {
        const xhr = makeXHRRequest({Error: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const payment = new window.jujulib.payment(
      'http://1.2.3.4/', bakery);
    payment.createUser({}, function(error, user) {
      assert.equal(error, 'Uh oh!');
      assert.strictEqual(user, null);
      done();
    });
  });

  it('can get a list of countries', function(done) {
    const countries = [{
      name: 'Australia',
      code: 'AU'
    }];
    const bakery = {
      get: (url, headers, callback) => {
        assert.equal(
          url,
          'http://1.2.3.4/' +
          window.jujulib.paymentAPIVersion +
          '/country');
        const xhr = makeXHRRequest({countries: countries});
        callback(null, xhr);
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
      get: (url, headers, callback) => {
        const xhr = makeXHRRequest({Error: 'Uh oh!'});
        callback(null, xhr);
      }
    };
    const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
    payment.getCountries((error, response) => {
      assert.equal(error, 'Uh oh!');
      assert.strictEqual(response, null);
      done();
    });
  });

  describe('getPaymentMethods', () => {
    it('can get payment methods for a user', (done) => {
      const bakery = {
        get: function(url, headers, callback) {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.paymentAPIVersion +
            '/u/spinach/payment-methods');
          const xhr = makeXHRRequest({
            'payment-methods': [{
              address: {
                id: 'address1',
                name: 'Home',
                line1: '1 Maple St',
                line2: null,
                county: 'Bunnyhug',
                city: 'Sasquatch',
                postcode: '90210',
                country: 'North of the Border'
              },
              id: 'paymentmethod1',
              brand: 'Brand',
              last4: '1234',
              month: 3,
              name: 'Main',
              'card-holder': 'Mr G Spinach',
              valid: true,
              year: 2017
            }]
          });
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.getPaymentMethods('spinach', function(error, response) {
        assert.strictEqual(error, null);
        assert.deepEqual(response, [{
          address: {
            id: 'address1',
            name: 'Home',
            line1: '1 Maple St',
            line2: null,
            state: 'Bunnyhug',
            city: 'Sasquatch',
            postcode: '90210',
            country: 'North of the Border'
          },
          id: 'paymentmethod1',
          brand: 'Brand',
          last4: '1234',
          month: 3,
          name: 'Main',
          cardHolder: 'Mr G Spinach',
          valid: true,
          year: 2017
        }]);
        done();
      });
    });

    it('handles errors when getting a user', (done) => {
      const bakery = {
        get: function(url, headers, callback) {
          const xhr = makeXHRRequest({Message: 'Uh oh!'});
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.getPaymentMethods('spinach', function(error, user) {
        assert.equal(error, 'Uh oh!');
        assert.strictEqual(user, null);
        done();
      });
    });
  });

  describe('createPaymentMethod', () => {
    it('can create a payment method', () => {
      const bakery = {
        put: sinon.stub()
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.createPaymentMethod(
        'spinach', 'token123', 'Business',
        sinon.stub());
      assert.equal(bakery.put.callCount, 1);
      assert.deepEqual(
        bakery.put.args[0][2], JSON.stringify({
          'payment-method-name': 'Business',
          token: 'token123'
        }));
    });

    it('can return the payment method when it has been created', (done) => {
      const bakery = {
        put: function(url, headers, body, callback) {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.paymentAPIVersion +
            '/u/spinach/payment-methods');
          const xhr = makeXHRRequest({
            address: {
              id: 'address1',
              name: 'Home',
              line1: '1 Maple St',
              line2: 'Loonie Lane',
              county: 'Bunnyhug',
              city: 'Sasquatch',
              postcode: '90210',
              country: 'North of the Border'
            },
            id: 'paymentmethod1',
            brand: 'Brand',
            last4: '1234',
            month: 3,
            name: 'Main',
            'card-holder': 'Mr G Spinach',
            valid: true,
            year: 2017
          });
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.createPaymentMethod(
        'spinach', 'token123', null, (error, response) => {
          assert.strictEqual(error, null);
          assert.deepEqual(response, {
            address: {
              id: 'address1',
              name: 'Home',
              line1: '1 Maple St',
              line2: 'Loonie Lane',
              state: 'Bunnyhug',
              city: 'Sasquatch',
              postcode: '90210',
              country: 'North of the Border'
            },
            id: 'paymentmethod1',
            brand: 'Brand',
            last4: '1234',
            month: 3,
            name: 'Main',
            cardHolder: 'Mr G Spinach',
            valid: true,
            year: 2017
          });
          done();
        });
    });

    it('handles errors when creating a payment method', (done) => {
      const bakery = {
        put: function(url, headers, body, callback) {
          const xhr = makeXHRRequest({Message: 'Uh oh!'});
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.createPaymentMethod(
        'spinach', 'token123', null, (error, response) => {
          assert.equal(error, 'Uh oh!');
          assert.strictEqual(response, null);
          done();
        });
    });
  });

  describe('updatePaymentMethod', () => {
    it('can update a payment method', () => {
      const bakery = {
        put: sinon.stub()
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      const address = {
        line1: '10 Maple St',
        line2: '',
        city: 'Sasquatch',
        county: 'Bunnyhug',
        postcode: '90210',
        country: 'CA'
      };
      payment.updatePaymentMethod(
        'spinach', 'paymentmethod1', address, '12/17', sinon.stub());
      assert.equal(bakery.put.callCount, 1);
      assert.deepEqual(bakery.put.args[0][2], JSON.stringify({
        address: {
          name: null,
          line1: '10 Maple St',
          line2: null,
          city: 'Sasquatch',
          county: 'Bunnyhug',
          postcode: '90210',
          'country-code': 'CA',
          phones: []
        },
        month: 12,
        year: 17
      }));
    });

    it('can return when there are no errors', (done) => {
      const bakery = {
        put: function(url, headers, body, callback) {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.paymentAPIVersion +
            '/u/spinach/payment-methods/paymentmethod1');
          const xhr = makeXHRRequest('success');
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.updatePaymentMethod(
        'spinach', 'paymentmethod1', {}, '12/17', error => {
          assert.strictEqual(error, null);
          done();
        });
    });

    it('handles errors when updating a payment method', (done) => {
      const bakery = {
        put: function(url, headers, body, callback) {
          const xhr = makeXHRRequest({Message: 'Uh oh!'});
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.updatePaymentMethod(
        'spinach', 'paymentmethod1', {}, '12/17', error => {
          assert.equal(error, 'Uh oh!');
          done();
        });
    });
  });

  describe('removePaymentMethod', () => {
    it('can remove a payment method', () => {
      const bakery = {
        delete: sinon.stub()
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.removePaymentMethod('spinach', 'paymentmethod1', sinon.stub());
      assert.equal(bakery.delete.callCount, 1);
      assert.deepEqual(bakery.delete.args[0][2], JSON.stringify({
        'payment-method-name': 'paymentmethod1'
      }));
    });

    it('can return when there are no errors', (done) => {
      const bakery = {
        delete: function(url, headers, body, callback) {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.paymentAPIVersion +
            '/u/spinach/payment-methods/paymentmethod1');
          const xhr = makeXHRRequest('success');
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.removePaymentMethod(
        'spinach', 'paymentmethod1', (error, response) => {
          assert.strictEqual(error, null);
          done();
        });
    });

    it('handles errors when removing a payment method', (done) => {
      const bakery = {
        delete: function(url, headers, body, callback) {
          const xhr = makeXHRRequest({error: 'Uh oh!'});
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.removePaymentMethod(
        'spinach', 'paymentmethod1', (error, response) => {
          assert.equal(error, 'Uh oh!');
          done();
        });
    });
  });

  describe('addAddress', () => {
    let address;

    beforeEach(() => {
      address = {
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        county: 'Bunnyhug',
        city: 'Sasquatch',
        postcode: '90210',
        country: 'CA'
      };
    });

    it('can add an address', () => {
      const bakery = {
        put: sinon.stub()
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.addAddress('spinach', address, sinon.stub());
      assert.equal(bakery.put.callCount, 1);
      assert.deepEqual(bakery.put.args[0][2], JSON.stringify({
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        city: 'Sasquatch',
        county: 'Bunnyhug',
        postcode: '90210',
        'country-code': 'CA',
        phones: []
      }));
    });

    it('can successfully create the address', (done) => {
      const bakery = {
        put: function(url, headers, body, callback) {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.paymentAPIVersion +
            '/u/spinach/addresses');
          const xhr = makeXHRRequest();
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.addAddress('spinach', address, error => {
        assert.strictEqual(error, null);
        done();
      });
    });

    it('handles errors when adding an address', (done) => {
      const bakery = {
        put: function(url, headers, body, callback) {
          const xhr = makeXHRRequest({Message: 'Uh oh!'});
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.addAddress('spinach', address, error => {
        assert.equal(error, 'Uh oh!');
        done();
      });
    });
  });

  describe('addBillingAddress', () => {
    let address;

    beforeEach(() => {
      address = {
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        county: 'Bunnyhug',
        city: 'Sasquatch',
        postcode: '90210',
        country: 'CA'
      };
    });

    it('can add a billing address', () => {
      const bakery = {
        put: sinon.stub()
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.addBillingAddress('spinach', address, sinon.stub());
      assert.equal(bakery.put.callCount, 1);
      assert.deepEqual(bakery.put.args[0][2], JSON.stringify({
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        city: 'Sasquatch',
        county: 'Bunnyhug',
        postcode: '90210',
        'country-code': 'CA',
        phones: []
      }));
    });

    it('can successfully create the billing address', (done) => {
      const bakery = {
        put: function(url, headers, body, callback) {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.paymentAPIVersion +
            '/u/spinach/billing-addresses');
          const xhr = makeXHRRequest();
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.addBillingAddress('spinach', address, error => {
        assert.strictEqual(error, null);
        done();
      });
    });

    it('handles errors when adding a billing address', (done) => {
      const bakery = {
        put: function(url, headers, body, callback) {
          const xhr = makeXHRRequest({Message: 'Uh oh!'});
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.addBillingAddress('spinach', address, error => {
        assert.equal(error, 'Uh oh!');
        done();
      });
    });
  });

  describe('removeAddress', () => {
    it('can remove an address', () => {
      const bakery = {
        delete: sinon.stub()
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.removeAddress('spinach', 'address1', sinon.stub());
      assert.equal(bakery.delete.callCount, 1);
      assert.strictEqual(bakery.delete.args[0][2], null);
    });

    it('can return when there are no errors', (done) => {
      const bakery = {
        delete: function(url, headers, body, callback) {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.paymentAPIVersion +
            '/u/spinach/addresses/address1');
          const xhr = makeXHRRequest('success');
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.removeAddress('spinach', 'address1', (error, response) => {
        assert.strictEqual(error, null);
        done();
      });
    });

    it('handles errors when removing an address', (done) => {
      const bakery = {
        delete: function(url, headers, body, callback) {
          const xhr = makeXHRRequest({error: 'Uh oh!'});
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.removeAddress('spinach', 'address1',(error, response) => {
        assert.equal(error, 'Uh oh!');
        done();
      });
    });
  });

  describe('removeBillingAddress', () => {
    it('can remove a biling address', () => {
      const bakery = {
        delete: sinon.stub()
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.removeBillingAddress('spinach', 'address1', sinon.stub());
      assert.equal(bakery.delete.callCount, 1);
      assert.strictEqual(bakery.delete.args[0][2], null);
    });

    it('can return when there are no errors', (done) => {
      const bakery = {
        delete: function(url, headers, body, callback) {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.paymentAPIVersion +
            '/u/spinach/billing-addresses/address1');
          const xhr = makeXHRRequest('success');
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.removeBillingAddress('spinach', 'address1', (error, response) => {
        assert.strictEqual(error, null);
        done();
      });
    });

    it('handles errors when removing a billing address', (done) => {
      const bakery = {
        delete: function(url, headers, body, callback) {
          const xhr = makeXHRRequest({error: 'Uh oh!'});
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.removeBillingAddress('spinach', 'address1',(error, response) => {
        assert.equal(error, 'Uh oh!');
        done();
      });
    });
  });

  describe('updateAddress', () => {
    let address;

    beforeEach(() => {
      address = {
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        county: 'Bunnyhug',
        city: 'Sasquatch',
        postcode: '90210',
        country: 'CA'
      };
    });

    it('can update an address', () => {
      const bakery = {
        post: sinon.stub()
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.updateAddress('spinach', 'address1', address, sinon.stub());
      assert.equal(bakery.post.callCount, 1);
      assert.deepEqual(JSON.parse(bakery.post.args[0][2]), {
        id: 'address1',
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        city: 'Sasquatch',
        county: 'Bunnyhug',
        postcode: '90210',
        'country-code': 'CA',
        phones: []
      });
    });

    it('can successfully update the address', (done) => {
      const bakery = {
        post: function(url, headers, body, callback) {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.paymentAPIVersion +
            '/u/spinach/addresses/address1');
          const xhr = makeXHRRequest();
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.updateAddress('spinach', 'address1', address, error => {
        assert.strictEqual(error, null);
        done();
      });
    });

    it('handles errors when updating an address', (done) => {
      const bakery = {
        post: function(url, headers, body, callback) {
          const xhr = makeXHRRequest({Message: 'Uh oh!'});
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.updateAddress('spinach', 'address1', address, error => {
        assert.equal(error, 'Uh oh!');
        done();
      });
    });
  });

  describe('updateBillingAddress', () => {
    let address;

    beforeEach(() => {
      address = {
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        county: 'Bunnyhug',
        city: 'Sasquatch',
        postcode: '90210',
        country: 'CA'
      };
    });

    it('can update a billing address', () => {
      const bakery = {
        post: sinon.stub()
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.updateBillingAddress(
        'spinach', 'address1', address, sinon.stub());
      assert.equal(bakery.post.callCount, 1);
      assert.deepEqual(JSON.parse(bakery.post.args[0][2]), {
        id: 'address1',
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        city: 'Sasquatch',
        county: 'Bunnyhug',
        postcode: '90210',
        'country-code': 'CA',
        phones: []
      });
    });

    it('can successfully update the billing address', (done) => {
      const bakery = {
        post: function(url, headers, body, callback) {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.paymentAPIVersion +
            '/u/spinach/billing-addresses/address1');
          const xhr = makeXHRRequest();
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.updateBillingAddress('spinach', 'address1', address, error => {
        assert.strictEqual(error, null);
        done();
      });
    });

    it('handles errors when updating a billing address', (done) => {
      const bakery = {
        post: function(url, headers, body, callback) {
          const xhr = makeXHRRequest({error: 'Uh oh!'});
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.updateBillingAddress('spinach', 'address1', address, error => {
        assert.equal(error, 'Uh oh!');
        done();
      });
    });
  });

  describe('getCharges', () => {
    it('can get a list of charges', (done) => {
      const bakery = {
        post: function(url, headers, body, callback) {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.paymentAPIVersion +
            '/charges');
          const xhr = makeXHRRequest({
            charges:[{
              id: 'TEST-12344',
              'statement-id': '12344',
              price: 10000,
              vat: 2000,
              currency: 'USD',
              nickname: 'spinach',
              for: '2016-01-02T15:04:05Z',
              origin: 'TEST',
              state: 'done',
              'line-items': [{
                name: 'this is line 1',
                details: 'a bit more details for line 1',
                usage: 'something',
                price: '48'
              }],
              'payment-received-at': '2017-04-28T07:49:39.925Z',
              'payment-method-used': {
                address: {
                  id: 'address1',
                  name: 'Home',
                  line1: '1 Maple St',
                  line2: null,
                  county: 'Bunnyhug',
                  city: 'Sasquatch',
                  postcode: '90210',
                  country: 'North of the Border'
                },
                id: 'paymentmethod1',
                brand: 'Brand',
                last4: '1234',
                month: 3,
                name: 'Main',
                'card-holder': 'Mr G Spinach',
                valid: true,
                year: 2017
              },
              'payment-retry-delay': 10,
              'payment-retry-max': 2,
              'payment-method-update-retry-delay': 10,
              'payment-method-update-retry-max': 100
            }]
          });
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.getCharges('spinach', (error, response) => {
        assert.strictEqual(error, null);
        assert.deepEqual(response, [{
          id: 'TEST-12344',
          statementId: '12344',
          price: 10000,
          vat: 2000,
          currency: 'USD',
          nickname: 'spinach',
          for: '2016-01-02T15:04:05Z',
          origin: 'TEST',
          state: 'done',
          lineItems: [{
            name: 'this is line 1',
            details: 'a bit more details for line 1',
            usage: 'something',
            price: '48'
          }],
          paymentReceivedAt: '2017-04-28T07:49:39.925Z',
          paymentMethodUsed: {
            address: {
              id: 'address1',
              name: 'Home',
              line1: '1 Maple St',
              line2: null,
              state: 'Bunnyhug',
              city: 'Sasquatch',
              postcode: '90210',
              country: 'North of the Border'
            },
            id: 'paymentmethod1',
            brand: 'Brand',
            last4: '1234',
            month: 3,
            name: 'Main',
            cardHolder: 'Mr G Spinach',
            valid: true,
            year: 2017
          },
          paymentRetryDelay: 10,
          paymentRetryMax: 2,
          paymentMethodUpdateRetryDelay: 10,
          paymentMethodUpdateRetryMax: 100
        }]);
        done();
      });
    });

    it('handles errors when getting charges', (done) => {
      const bakery = {
        post: function(url, headers, body, callback) {
          const xhr = makeXHRRequest({Message: 'Uh oh!'});
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.getCharges('spinach', (error, response) => {
        assert.equal(error, 'Uh oh!');
        assert.strictEqual(response, null);
        done();
      });
    });
  });

  describe('getReceipt', () => {
    it('can get a receipt', function(done) {
      const bakery = {
        get: (url, headers, callback) => {
          assert.equal(
            url,
            'http://1.2.3.4/' +
            window.jujulib.paymentAPIVersion +
            '/receipts/charge123');
          const xhr = makeXHRRequest('<html>...</html>', false);
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.getReceipt('charge123', (error, response) => {
        assert.strictEqual(error, null);
        assert.equal(response, '<html>...</html>');
        done();
      });
    });

    it('handles errors when getting a receipt', function(done) {
      const bakery = {
        get: (url, headers, callback) => {
          const xhr = makeXHRRequest({error: 'Uh oh!'});
          callback(null, xhr);
        }
      };
      const payment = new window.jujulib.payment('http://1.2.3.4/', bakery);
      payment.getReceipt('charge123', (error, response) => {
        assert.equal(error, 'Uh oh!');
        assert.strictEqual(response, null);
        done();
      });
    });
  });
});
