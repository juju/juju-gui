/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const analytics = require('./analytics');

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('Analytics', () => {
  const sendAnalyticsFactory = analytics.sendAnalyticsFactory;

  // Fake it with an array
  let dataLayer;
  const controllerAPI = {
    userIsAuthenticated: true
  };

  beforeEach(() => {
    dataLayer = [];
  });

  it('returns a function when initialized', () => {
    assert.isFunction(sendAnalyticsFactory(null, null));
  });

  it('returns null when no dataLayer is set', () => {
    const sendAnalytics = sendAnalyticsFactory(null, null);
    assert.isNull(sendAnalytics('category', 'action', 'label'));
  });

  it('logs an error when required arguments are missing', () => {
    const sendAnalytics = sendAnalyticsFactory(controllerAPI, dataLayer);
    const original = console.error;
    const check = (err, func) => {
      const error = sinon.stub();
      console.error = error;
      func();
      console.error = original;
      assert.strictEqual(error.calledOnce, true, err);
      const args = error.args[0];
      assert.strictEqual(args.length, 1, err);
      assert.strictEqual(args[0], err);
    };
    check('cannot send analytics: category required', () => {
      sendAnalytics();
    });
    check('cannot send analytics: action required', () => {
      sendAnalytics('category');
    });
    check('cannot send analytics: label required', () => {
      sendAnalytics('category', 'action');
    });
  });

  it('pushes to dataLayer when all arguments are present', () => {
    const sendAnalytics = sendAnalyticsFactory(controllerAPI, dataLayer);
    sendAnalytics('category', 'action', 'label');
    assert.lengthOf(dataLayer, 1);
    assert.deepEqual(dataLayer[0], {
      'event': 'GAEvent',
      'eventCategory': 'category',
      'eventAction': 'action',
      'eventLabel': 'label',
      'eventValue': 'loggedIn:true'
    });
  });

  it('combines values if present', () => {
    const sendAnalytics = sendAnalyticsFactory(controllerAPI, dataLayer);
    sendAnalytics(
      'category',
      'action',
      'label',
      {
        'value': 'mambo',
        'number': 5
      });
    assert.lengthOf(dataLayer, 1);
    assert.deepEqual(dataLayer[0], {
      'event': 'GAEvent',
      'eventCategory': 'category',
      'eventAction': 'action',
      'eventLabel': 'label',
      'eventValue': 'loggedIn:true|value:mambo|number:5'
    });
  });
});
