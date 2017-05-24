/**
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

describe('Bakery', () => {
  let bakery, fakeLocalStorage, macaroonlib, storage, client;

  beforeAll((done) => {
    macaroonlib = require('js-macaroon');
    done();
  });

  beforeEach(() => {
    fakeLocalStorage = {
      store: {},
      getItem: function(item) {
        return this.store[item];
      },
      setItem: function(item, value) {
        this.store[item] = value;
      },
      removeItem: function(item) {
        delete this.store[item];
      }
    };

    client = {
      _sendRequest: sinon.stub(),
      sendGetRequest: function(...args) {
        this._sendRequest('get', ...args);
      },
      sendPostRequest: function(...args) {
        this._sendRequest('post', ...args);
      },
      sendPutRequest: function(...args) {
        this._sendRequest('put', ...args);
      },
      sendDeleteRequest: function(...args) {
        this._sendRequest('delete', ...args);
      },
      sendPatchRequest: function(...args) {
        this._sendRequest('patch', ...args);
      },
    };

    storage = new jujulib.BakeryStorage(
      fakeLocalStorage, {
        services: {
          charmstore: 'http://example.com/charmstore',
          otherService: 'http://example.com/other'
        }
      }
    );
    bakery = new jujulib.Bakery(client, storage);
  });

  afterEach(() => {
    bakery = null;
    storage = null;
  });

  describe('can send requests', () => {
    it('sets the method', () => {
      const url = 'http://example.com/';
      const headers = {header: 42};
      const callback = response => 42;
      let body = 'content';
      let args;
      ['PATCH', 'post', 'PUT'].forEach(method => {
        bakery.sendRequest(url, method, headers, body, callback);
        assert.equal(client._sendRequest.callCount, 1);
        args = client._sendRequest.args[0];
        assert.equal(args[0], method.toLowerCase());
        assert.equal(args[1], url);
        assert.deepEqual(args[2], {header: 42, 'Bakery-Protocol-Version': 1});
        assert.equal(args[3], body);
        assert.isFunction(args[8]);
        client._sendRequest.reset();
      });
      ['GET', 'delete'].forEach(method => {
        bakery.sendRequest(url, method, headers, callback);
        assert.equal(client._sendRequest.callCount, 1);
        args = client._sendRequest.args[0];
        assert.equal(args[0], method.toLowerCase());
        assert.equal(args[1], url);
        assert.deepEqual(args[2], {header: 42, 'Bakery-Protocol-Version': 1});
        assert.isFunction(args[7]);
        client._sendRequest.reset();
      });
    });

    it('properly handles cookie auth', () => {
      const sendRequest = client._sendRequest;
      const assertWithCredentials = (method, path, expectedValue) => {
        sendRequest.reset();
        bakery.sendRequest('http://example.com' + path, method);
        assert.strictEqual(
          sendRequest.args[0][6], expectedValue, `${method} ${path}`);
      };
      // When sending PUT requests to "/set-auth-cookie" endpoints, the
      // "withCredentials" attribute is properly set to true on the request.
      assertWithCredentials('PUT', '/set-auth-cookie', true);
      assertWithCredentials('PUT', '/foo/set-auth-cookie/bar', true);
      // For other endpoints the "withCredentials" attribute is set to false.
      assertWithCredentials('PUT', '/', false);
      assertWithCredentials('PUT', '/foo', false);
      // For other methods the "withCredentials" attribute is set to false.
      assertWithCredentials('POST', '/set-auth-cookie', false);
      assertWithCredentials('POST', '/foo/set-auth-cookie/bar', false);
      // In all other cases the "withCredentials" attribute is set to false.
      assertWithCredentials('POST', '/foo', false);
    });

    it('sets the headers', () => {
      bakery.sendRequest('http://example.com/', 'GET', {'foo': 'bar'});
      const expectedHeaders = {
        'Bakery-Protocol-Version': 1,
        'foo': 'bar'
      };
      assert.deepEqual(client._sendRequest.args[0][2], expectedHeaders);
    });

    it('adds macaroons to the request', () => {
      // We add two "macaroons" into the store--one for the url we're setting,
      // one that we should not get.
      fakeLocalStorage.store['charmstore'] = 'doctor';
      fakeLocalStorage.store['identity'] = 'bad wolf';

      bakery.sendRequest('http://example.com/charmstore', 'GET');
      const expectedHeaders = {
        'Bakery-Protocol-Version': 1,
        'Macaroons': 'doctor'
      };
      assert.deepEqual(client._sendRequest.args[0][2], expectedHeaders);
    });

    it('wraps callbacks with discharge functionality', () => {
      const wrapper = sinon.stub(bakery, '_wrapCallback');
      bakery.sendRequest('http://example.com/', 'GET');
      assert.equal(wrapper.callCount, 1);
    });
  });

  describe('macaroon discharges', () => {
    let dischargeStub, generateStub;

    beforeEach(() => {
      dischargeStub = sinon.stub(macaroonlib, 'dischargeMacaroon');
      generateStub = sinon.stub(macaroonlib, 'generateMacaroons');
    });

    afterEach(() => {
      dischargeStub.restore();
      generateStub.restore();
    });

    it('discharges macaroons', () => {
      const macaroon = 'this is a macaroon';
      const success = discharges => {
        assert.equal(discharges, macaroon);
      };
      const failure = msg => {
        console.error(msg);
        assert.fail();
      };
      bakery.discharge(macaroon, success, failure);
      assert.equal(
        dischargeStub.callCount, 1,
        'macaroonlib discharge not called');
    });

    it('handles failures discharging macaroons', () => {
      const macaroon = 'this is a macaroon';
      const error = { message: 'bad wolf' };
      dischargeStub.callsArgWith(2, macaroon);
      generateStub.throws(error);
      const success = () => {};
      const failure = msg => {
        assert.equal(msg, `discharge failed: ${error.message}`);
      };
      bakery.discharge('macaroons', success, failure);
    });

    it('handles third party discharge', () => {
      const condition = 'this is a caveat';
      const success = macaroons => {};
      const failure = err => {};
      bakery._getThirdPartyDischarge(
        'http://example.com/',
        'http://example.com/identity',
        condition, success, failure);
      assert.equal(client._sendRequest.callCount, 1);
      const args = client._sendRequest.args[0];
      assert.equal(args[0], 'post');
      assert.equal(args[1], 'http://example.com/identity/discharge');
      assert.deepEqual(args[2], {
        'Bakery-Protocol-Version': 1,
        'Content-Type': 'application/x-www-form-urlencoded'
      });
      assert.equal(
        args[3],
        'id=this%20is%20a%20caveat&location=http%3A%2F%2Fexample.com%2F');
    });
  });

  describe('wrapped callbacks', () => {
    const getTarget = responseObj => {
      if (!responseObj) {
        return { status: 200 };
      }
      const responseText = JSON.stringify(responseObj);
      return {
        status: 401,
        getResponseHeader: sinon.stub().returns('application/json'),
        responseText: responseText
      };
    };

    it('handles requests normally if nothing is needed', () => {
      const cb = sinon.stub();
      const wrappedCB = bakery._wrapCallback(
        'http://example.com', 'POST', {}, 'body', cb);
      const target = getTarget();
      wrappedCB({ target });
      assert.equal(cb.callCount, 1);
    });

    it('handles interaction if needed', () => {
      const interact = sinon.stub(bakery, '_interact');
      const cb = sinon.stub();
      const wrappedCB = bakery._wrapCallback(
        'http://example.com', 'POST', {}, 'body', cb);
      const target = getTarget({
        Code: 'interaction required',
        Info: {
          VisitURL: 'http://example.com/identity',
          WaitURL: 'http://example.com/identity/wait'
        }
      });
      wrappedCB({ target });
      assert.equal(interact.callCount, 1);
      const info = interact.args[0][0].Info;
      assert.equal(info.VisitURL, 'http://example.com/identity');
      assert.equal(info.WaitURL, 'http://example.com/identity/wait');
    });

    it('handles discharge if needed', () => {
      const dischargeStub = sinon.stub(bakery, 'discharge');
      const cb = sinon.stub();
      const wrappedCB = bakery._wrapCallback(
        'http://example.com', 'POST', {}, 'body', cb);
      const target = getTarget({
        Code: 'macaroon discharge required',
        Info: { Macaroon: 'macaroon' }
      });
      wrappedCB({ target });
      assert.equal(dischargeStub.callCount, 1);
      const args = dischargeStub.args[0];
      assert.equal(args[0], 'macaroon');
    });

    it('do not acquire macaroons if discharge is disabled', () => {
      bakery = bakery.withoutDischarge();
      const dischargeStub = sinon.stub(bakery, 'discharge');
      const cb = sinon.stub();
      const wrappedCB = bakery._wrapCallback(
        'http://example.com', 'POST', {}, 'body', cb);
      const target = getTarget({
        Code: 'macaroon discharge required',
        Info: { Macaroon: 'macaroon' }
      });
      wrappedCB({target: target});
      // Discharge has not been called.
      assert.equal(dischargeStub.callCount, 0, 'discharge call count');
      assert.equal(cb.callCount, 1, 'callback call count');
      const args = cb.args[0];
      assert.equal(args.length, 2, 'callback args');
      assert.strictEqual(args[0], 'discharge required but disabled');
      assert.deepEqual(args[1].target, target);
    });
  });

  describe('interact handling', () => {
    const getResponse = fail => {
      let response = {
        target: {
          status: 200,
          responseText: '',
          response: '',
        }
      };
      if (fail) {
        response.target.status = 0;
      }
      return response;
    };

    it('accepts a visit page method', () => {
      const params = {
        visitPage: () => { return 'visits'; }
      };
      bakery = new jujulib.Bakery(client, storage, params);
      assert.equal(bakery._visitPage(), 'visits');
    });

    it('opens the visit page', () => {
      const windowStub = sinon.stub(window, 'open');
      const error = {
        Info: {
          VisitURL: 'http://example.com',
        }
      };
      bakery._visitPage(error);
      assert.equal(windowStub.callCount, 1);
      assert.equal(windowStub.args[0][0], error.Info.VisitURL);
      windowStub.restore();
    });

    it('sets the content type correctly for the wait call', () => {
      const error = {
        Info: {
          WaitURL: 'http://example.com/wait',
          VisitURL: 'http://example.com/visit'
        }
      };
      bakery._interact(error, ()=>{}, ()=>{});
      assert.equal(client._sendRequest.callCount, 1);
      assert.equal(
        client._sendRequest.args[0][1], 'http://example.com/wait');
      assert.equal(
        client._sendRequest.args[0][2]['Content-Type'], 'application/json');
    });

    it('handles retry', () => {
      const error = {
        Info: {
          WaitURL: 'http://example.com/wait',
          VisitURL: 'http://example.com/visit'
        }
      };
      client._sendRequest
        .onFirstCall().callsArgWith(7, getResponse(true))
        .onSecondCall().callsArgWith(7, getResponse(false));
      bakery._interact(error, ()=>{}, ()=>{});
      assert.equal(client._sendRequest.callCount, 2);
    });

    it('limits retries', () => {
      const error = {
        Info: {
          WaitURL: 'http://example.com/wait',
          VisitURL: 'http://example.com/visit'
        }
      };
      client._sendRequest.callsArgWith(7, getResponse(true));
      bakery._interact(error, ()=>{}, ()=>{});
      assert.equal(client._sendRequest.callCount, 6); // 6 is retrycount limit
    });

    it('handles errors', () => {
      const error = {
        Info: {
          WaitURL: 'http://example.com/wait',
          VisitURL: 'http://example.com/visit'
        }
      };
      client._sendRequest.callsArgWith(7, getResponse(true));
      sinon.stub(bakery, '_getError').returns({'message': 'bad wolf'});
      const ok = sinon.stub();
      const fail = sinon.stub();
      bakery._interact(error, ok, fail);
      assert.equal(ok.callCount, 0);
      assert.equal(fail.callCount, 1);
      assert.equal(fail.args[0][0], 'cannot interact: bad wolf');
    });

    it('handles success', () => {
      const error = {
        Info: {
          WaitURL: 'http://example.com/wait',
          VisitURL: 'http://example.com/visit'
        }
      };
      client._sendRequest.callsArgWith(7, getResponse(true));
      sinon.stub(bakery, '_getError').returns(null);
      const ok = sinon.stub();
      const fail = sinon.stub();
      bakery._interact(error, ok, fail);
      assert.equal(ok.callCount, 1);
      assert.equal(fail.callCount, 0);
    });
  });

  describe('storage', () => {
    let generateStub;

    beforeEach(() => {
      generateStub = sinon.stub(macaroonlib, 'generateMacaroons');
      generateStub.returnsArg(0);
    });

    afterEach(() => {
      generateStub.restore();
    });
    it('sets items', () => {
      storage.set('http://example.com/charmstore', 'foo', () => {});
      assert.equal(fakeLocalStorage.store['charmstore'], 'foo');
    });

    it('gets items', () => {
      fakeLocalStorage.store['charmstore'] = 'foo';
      assert.equal('foo', storage.get('http://example.com/charmstore'));
    });

    it('sets cookies for charmstore', () => {
      const cookieSet = sinon.stub();
      const params = {
        services: {
          charmstore: 'http://example.com/charmstore',
        },
        charmstoreCookieSetter: cookieSet
      };
      storage = new jujulib.BakeryStorage(fakeLocalStorage, params);
      const macaroonValue = btoa(JSON.stringify('macaroon'));
      storage.set('http://example.com/charmstore', macaroonValue, () => {});
      assert.equal(cookieSet.callCount, 1);
      assert.equal(cookieSet.args[0][0], 'macaroon');
    });

    describe('keys', () => {
      it('special cases identity', () => {
        // There's no identity url in services
        Object.keys(storage._services).forEach(key => {
          assert.notEqual('identity', key);
        });
        assert.equal(
          'identity', storage._getKey('http://example.com/identity/'));
      });

      it('gets keys from services', () => {
        assert.equal(
          'charmstore', storage._getKey('http://example.com/charmstore'));
      });
    });

  });
});

