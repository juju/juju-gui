/* Copyright (C) 2018 Canonical Ltd. */

'use strict';

describe('jujulib identity service', () => {

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

  function setupUserStorage(returnVal) {
    return {
      identityURL: function() {
        return returnVal;
      }
    };
  }

  describe('getIdentityURL', () => {
    it('returns the identity url with the api version', () => {
      const bakery = setupBakery();
      const userStorage = setupUserStorage(baseURL);
      const identity = new window.jujulib.identity(userStorage, bakery);
      assert.equal(identity.getIdentityURL(), `${baseURL}/v1`);
    });

    it('returns null if no identity url is available', () => {
      const bakery = setupBakery();
      const userStorage = setupUserStorage(null);
      const identity = new window.jujulib.identity(userStorage, bakery);
      assert.strictEqual(identity.getIdentityURL(), null);
    });
  });

  describe('getUser', () => {

    it('calls back with the parsed data', done => {
      const userData = {user: 'data'};
      const returnVal = [null, {
        target: {
          responseText: JSON.stringify(userData)
        }
      }];
      const bakery = setupBakery(returnVal);
      const userStorage = setupUserStorage(baseURL);
      const identity = new window.jujulib.identity(userStorage, bakery);
      identity.getUser('hatch', (err, data) => {
        assert.deepEqual(data, userData);
        done();
      });
    });

    it('calls back with an error if the bakery request fails', done => {
      const returnVal = [{error: 'foo'}, null];
      const bakery = setupBakery(returnVal);
      const userStorage = setupUserStorage(baseURL);
      const identity = new window.jujulib.identity(userStorage, bakery);
      identity.getUser('hatch', (err, data) => {
        assert.deepEqual(err, returnVal[0]);
        done();
      });
    });

    it('calls back with an error if the json parsing fails', done => {
      const returnVal = [null, 'invalid'];
      const bakery = setupBakery(returnVal);
      const userStorage = setupUserStorage(baseURL);
      const identity = new window.jujulib.identity(userStorage, bakery);
      identity.getUser('hatch', (err, data) => {
        assert.deepEqual(
          err, 'TypeError: Cannot read property \'responseText\' of undefined');
        done();
      });
    });

    it('calls back with an error when no identity url is available', done => {
      const returnVal = [null, 'invalid'];
      const bakery = setupBakery(returnVal);
      const userStorage = setupUserStorage(null);
      const identity = new window.jujulib.identity(userStorage, bakery);
      identity.getUser('hatch', (err, data) => {
        assert.deepEqual(
          err, 'no identity URL available');
        done();
      });
    });

  });
});
