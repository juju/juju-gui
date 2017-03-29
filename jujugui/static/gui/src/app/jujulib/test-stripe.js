/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('jujulib Stripe service', function() {
  let fakeStripe;

  beforeEach(function() {
    fakeStripe = {
      card: {
        createToken: sinon.stub()
      }
    };
  });

  it('exists', function() {
    const stripe = new window.jujulib.stripe('http://example.com');
    assert.strictEqual(stripe instanceof window.jujulib.stripe, true);
    assert.equal(stripe.url,'http://example.com/v2/');
  });

  it('can load the Stripe JavaScript', function() {
    const stripe = new window.jujulib.stripe('http://example.com');
    stripe._getStripeModule = sinon.stub().returns(fakeStripe);
    stripe._getStripe(sinon.stub());
    assert.equal(
      document.querySelector('script').src,
      'http://example.com/v2/');
  });

  it('calls the callback once the script has loaded', function() {
    const stripe = new window.jujulib.stripe('http://example.com');
    stripe._loadScript = sinon.stub().callsArg(0);
    stripe._getStripeModule = sinon.stub().returns(fakeStripe);
    const callback = sinon.stub();
    stripe._getStripe(callback);
    assert.equal(callback.callCount, 1);
    assert.equal(callback.args[0][0], fakeStripe);
  });

  it('does not load the script more than once', function() {
    const stripe = new window.jujulib.stripe('http://example.com');
    stripe._loadScript = sinon.stub().callsArg(0);
    stripe._getStripeModule = sinon.stub().returns(fakeStripe);
    const callback = sinon.stub();
    stripe._getStripe(callback);
    stripe._getStripe(callback);
    assert.equal(stripe._loadScript.callCount, 1);
    assert.equal(callback.callCount, 2);
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
      fakeStripe.card.createToken = sinon.stub().callsArgWith(
        1, null, cardResponse);
      const stripe = new window.jujulib.stripe('http://example.com/');
      stripe.stripe = fakeStripe;
      stripe.createToken(cardData, sinon.stub());
      assert.equal(fakeStripe.card.createToken.callCount, 1);
      assert.deepEqual(fakeStripe.card.createToken.args[0][0], {
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
      fakeStripe.card.createToken = sinon.stub().callsArgWith(
        1, null, cardResponse);
      const stripe = new window.jujulib.stripe('http://example.com/');
      stripe.stripe = fakeStripe;
      const callback = sinon.stub();
      stripe.createToken(cardData, callback);
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
      fakeStripe.card.createToken = sinon.stub().callsArgWith(1, null, {
        error: {
          type: 'card_error',
          code: 'invalid_expiry_year',
          message: 'Your card\'s expiration year is invalid.',
          param: 'exp_year'
        }
      });
      const stripe = new window.jujulib.stripe('http://example.com/');
      stripe.stripe = fakeStripe;
      const callback = sinon.stub();
      stripe.createToken(cardData, callback);
      assert.equal(callback.callCount, 1);
      assert.equal(callback.args[0][0],
        'Your card\'s expiration year is invalid.');
      assert.isNull(callback.args[0][1]);
    });
  });
});
