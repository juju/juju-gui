/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

describe('jujulib identity service', () => {

  describe('getUser', () => {

    const baseURL = 'http://1.2.3.4';

    function setupBakery(returnVal) {
      return {
        get: function(url, headers, callback) {
          assert.equal(url, `${baseURL}/v1/u/hatch`);
          assert.equal(headers, null);
          callback.apply(null, returnVal);
        }
      };
    }

    it('calls back with the parsed data', done => {
      const userData = {user: 'data'};
      const returnVal = [null, {
        target: {
          responseText: JSON.stringify(userData)
        }
      }];
      const bakery = setupBakery(returnVal);
      const identity = new window.jujulib.identity(baseURL, bakery);
      identity.getUser('hatch', (err, data) => {
        assert.deepEqual(data, userData);
        done();
      });
    });

    it('calls back with an error if the bakery request fails', done => {
      const returnVal = [{error: 'foo'}, null];
      const bakery = setupBakery(returnVal);
      const identity = new window.jujulib.identity(baseURL, bakery);
      identity.getUser('hatch', (err, data) => {
        assert.deepEqual(err, returnVal[0]);
        done();
      });
    });

    it('calls back with an error if the json parsing fails', done => {
      const returnVal = [null, 'invalid'];
      const bakery = setupBakery(returnVal);
      const identity = new window.jujulib.identity(baseURL, bakery);
      identity.getUser('hatch', (err, data) => {
        assert.deepEqual(
          err, 'TypeError: Cannot read property \'responseText\' of undefined');
        done();
      });
    });

  });
});
