/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

describe('jujulib rates service', () => {

  it('exists', () => {
    const webHandler = {};
    const rates = new window.jujulib.rates('http://1.2.3.4/', webHandler);
    assert.equal(rates.url, 'http://1.2.3.4/' + window.jujulib.ratesAPIVersion);
  });

  it('can return the SLA machine rates', done => {
    const webHandler = {
      sendGetRequest: (url, a, b, c, d, e, callback) => {
        callback({
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
    const rates = new window.jujulib.rates('http://1.2.3.4/', webHandler);
    rates.getSLAMachineRates(data => {
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
