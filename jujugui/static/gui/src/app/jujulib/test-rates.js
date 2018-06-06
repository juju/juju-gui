/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

const rates = require('./rates');

describe('jujulib rates service', () => {

  it('exists', () => {
    const webHandler = {};
    const ratesInstance = new rates.rates('http://1.2.3.4/', webHandler);
    assert.equal(ratesInstance.url, 'http://1.2.3.4/v3');
  });

  it('can return the SLA machine rates', done => {
    const webHandler = {
      sendGetRequest: (url, headers, username, password,
        withCredentials, progressCallback, completedCallback) => {
        completedCallback({
          target: {
            responseText: JSON.stringify({
              unsupported: '0.000',
              essential: '0.011',
              standard: '0.055',
              advanced: '0.110'
            })
          }
        });
      }
    };
    const ratesInstance = new rates.rates('http://1.2.3.4/', webHandler);
    ratesInstance.getSLAMachineRates(data => {
      assert.deepEqual(data, {
        unsupported: '0.000',
        essential: '0.011',
        standard: '0.055',
        advanced: '0.110'
      });
      done();
    });
  });

});
