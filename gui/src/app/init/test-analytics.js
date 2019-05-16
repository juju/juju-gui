/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const {Analytics} = require('./analytics');

describe('Analytics', () => {
  it('can add category', () => {
    let analytics = new Analytics([]);
    analytics = analytics.addCategory('Inspector');
    assert.deepEqual(analytics.categories, ['Inspector']);
  });

  it('returns a new instance when adding a new category', () => {
    const analytics = new Analytics([]);
    const analytics2 = analytics.addCategory('Inspector');
    assert.deepEqual(analytics.categories, []);
    assert.deepEqual(analytics2.categories, ['Inspector']);
  });

  it('can add category from a React component', () => {
    let analytics = new Analytics([]);
    analytics = analytics.addCategory({
      _reactInternalFiber: {
        elementType: {
          name: 'Inspector'
        }
      }
    });
    assert.deepEqual(analytics.categories, ['Inspector']);
  });

  it('can send an event', () => {
    let dataLayer = [];
    let analytics = new Analytics(dataLayer);
    analytics = analytics.addCategory('Inspector');
    analytics = analytics.addCategory('Config');
    analytics.sendEvent('Click');
    assert.deepEqual(dataLayer[0], {
      'event': 'GAEvent',
      'eventCategory': 'Inspector > Config',
      'eventAction': 'Click',
      'eventLabel': undefined,
      'eventValue': undefined
    });
  });

  it('can send an event with a provided label', () => {
    let dataLayer = [];
    let analytics = new Analytics(dataLayer);
    analytics = analytics.addCategory('Inspector');
    analytics.sendEvent('Click', {label: 'cs:k8s'});
    assert.deepEqual(dataLayer[0], {
      'event': 'GAEvent',
      'eventCategory': 'Inspector',
      'eventAction': 'Click',
      'eventLabel': 'cs:k8s',
      'eventValue': undefined
    });
  });

  it('can send an event with a provided value', () => {
    let dataLayer = [];
    let analytics = new Analytics(dataLayer);
    analytics = analytics.addCategory('Inspector');
    analytics.sendEvent('Click', {value: 99});
    assert.deepEqual(dataLayer[0], {
      'event': 'GAEvent',
      'eventCategory': 'Inspector',
      'eventAction': 'Click',
      'eventLabel': undefined,
      'eventValue': 99
    });
  });

  it('can send an event with a label from a function', () => {
    let dataLayer = [];
    let analytics = new Analytics(dataLayer, {getLabel: () => 'authorised: true'});
    analytics = analytics.addCategory('Inspector');
    analytics.sendEvent('Click');
    assert.deepEqual(dataLayer[0], {
      'event': 'GAEvent',
      'eventCategory': 'Inspector',
      'eventAction': 'Click',
      'eventLabel': 'authorised: true',
      'eventValue': undefined
    });
  });

  it('can send an event with an appended label', () => {
    let dataLayer = [];
    let analytics = new Analytics(dataLayer, {getLabel: () => 'authorised: true'});
    analytics = analytics.addCategory('Inspector');
    analytics.sendEvent('Click', {label: 'charm: k8s'});
    assert.deepEqual(dataLayer[0], {
      'event': 'GAEvent',
      'eventCategory': 'Inspector',
      'eventAction': 'Click',
      'eventLabel': 'authorised: true, charm: k8s',
      'eventValue': undefined
    });
  });
});
