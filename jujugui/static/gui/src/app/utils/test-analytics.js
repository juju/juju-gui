/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('Analytics', () => {
  let sendAnalyticsFactory;

  // Fake it with an array
  let dataLayer;
  const controllerAPI = {
    userIsAuthenticated: true
  };

  beforeAll((done) => {
    YUI().use('analytics', (Y) => {
      sendAnalyticsFactory = Y.juju.sendAnalyticsFactory;
      done();
    });
  });

  beforeEach(() => {
    dataLayer = [];
  });

  it('returns a function when initialized', () => {
    assert.isFunction(sendAnalyticsFactory(null, null));
  });

  it('returns null when no dataLayer is set', () => {
    const sendAnalytics = sendAnalyticsFactory(null, null);
    assert.isNull(sendAnalytics());
  });

  it('throws error when required arguments are missing', () => {
    const sendAnalytics = sendAnalyticsFactory(controllerAPI, dataLayer);
    assert.throws(function() {sendAnalytics();});
    assert.throws(function() {sendAnalytics('category');});
    assert.throws(function() {sendAnalytics('category', 'action');});
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
