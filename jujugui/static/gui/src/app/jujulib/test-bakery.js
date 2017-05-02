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
      bakery.sendRequest('http://example.com/set-auth-cookie', 'PUT');
      // check that withCredentials is properly sent to the client
      assert.deepEqual(client._sendRequest.args[0][6], true);
      bakery.sendRequest('http://example.com/', 'PUT');
      assert.deepEqual(client._sendRequest.args[0][6], false);
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
      const args = interact.args[0];
      assert.equal(args[0], 'http://example.com/identity');
      assert.equal(args[1], 'http://example.com/identity/wait');
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
      const url = 'http://example.com';
      bakery._visitPage(url);
      assert.equal(windowStub.callCount, 1);
      assert.equal(windowStub.args[0][0], url);
      windowStub.restore();
    });

    it('sets the content type correctly for the wait call', () => {
      bakery._interact(
        'http://example.com/visit', 'http://example.com/wait', ()=>{}, ()=>{});
      assert.equal(client._sendRequest.callCount, 1);
      assert.equal(
        client._sendRequest.args[0][1], 'http://example.com/wait');
      assert.equal(
        client._sendRequest.args[0][2]['Content-Type'], 'application/json');
    });

    it('handles retry', () => {
      client._sendRequest
        .onFirstCall().callsArgWith(7, getResponse(true))
        .onSecondCall().callsArgWith(7, getResponse(false));
      bakery._interact(
        'http://example.com/visit', 'http://example.com/wait', ()=>{}, ()=>{});
      assert.equal(client._sendRequest.callCount, 2);
    });

    it('limits retries', () => {
      client._sendRequest.callsArgWith(7, getResponse(true));
      bakery._interact(
        'http://example.com/visit', 'http://example.com/wait', ()=>{}, ()=>{});
      assert.equal(client._sendRequest.callCount, 6); // 6 is retrycount limit
    });

    it('handles errors', () => {
      client._sendRequest.callsArgWith(7, getResponse(true));
      sinon.stub(bakery, '_getError').returns({'message': 'bad wolf'});
      const ok = sinon.stub();
      const fail = sinon.stub();
      bakery._interact(
        'http://example.com/visit', 'http://example.com/wait', ok, fail);
      assert.equal(ok.callCount, 0);
      assert.equal(fail.callCount, 1);
      assert.equal(fail.args[0][0], 'cannot interact: bad wolf');
    });

    it('handles success', () => {
      client._sendRequest.callsArgWith(7, getResponse(true));
      sinon.stub(bakery, '_getError').returns(null);
      const ok = sinon.stub();
      const fail = sinon.stub();
      bakery._interact(
        'http://example.com/visit', 'http://example.com/wait', ok, fail);
      assert.equal(ok.callCount, 1);
      assert.equal(fail.callCount, 0);
    });
  });

  describe('storage', () => {
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

