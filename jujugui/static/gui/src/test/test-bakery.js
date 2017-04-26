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

fdescribe('Bakery', () => {
  let bakery, fakeLocalStorage, macaroonlib, Y, storage, client;

  beforeAll((done) => {
    Y = YUI().use(['juju-env-bakery', 'macaroon'], (y) => {
      Y = y;
      macaroonlib = Y.macaroon;
      done();
    });
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

    storage = new Y.juju.environments.web.BakeryStorage(
      fakeLocalStorage, {services: {charmstore: 'http://example.com/'}});
    bakery = new Y.juju.environments.web.Bakery(client, storage);
  });

  afterEach(() => {
    bakery = null;
  });

  it('exists', () => {
    bakery = new Y.juju.environments.web.Bakery({});
    assert.isObject(bakery);
  });

  describe('can send requests', () => {
    it('sets the method', () => {
      bakery.sendRequest('http://example.com/', 'GET');
      assert.equal(client._sendRequest.args[0][0], 'get');
      client._sendRequest.reset();

      bakery.sendRequest('http://example.com/', 'POST');
      assert.equal(client._sendRequest.args[0][0], 'post');
      client._sendRequest.reset();

      bakery.sendRequest('http://example.com/', 'PUT');
      assert.equal(client._sendRequest.args[0][0], 'put');
      client._sendRequest.reset();

      bakery.sendRequest('http://example.com/', 'DELETE');
      assert.equal(client._sendRequest.args[0][0], 'delete');
      client._sendRequest.reset();

      bakery.sendRequest('http://example.com/', 'PATCH');
      assert.equal(client._sendRequest.args[0][0], 'patch');
      client._sendRequest.reset();
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

      bakery.sendRequest('http://example.com/', 'GET');
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
    let dischargeStub, importStub, exportStub;

    beforeEach(() => {
      dischargeStub = sinon.stub(macaroonlib, 'discharge');
      importStub = sinon.stub(macaroonlib, 'import');
      exportStub = sinon.stub(macaroonlib, 'export').returnsArg(0);
    });

    afterEach(() => {
      dischargeStub.restore();
      importStub.restore();
      exportStub.restore();
    });

    it('discharges macaroons', () => {
      const macaroon = 'this is a macaroon';
      dischargeStub.callsArgWith(2, macaroon);
      const success = discharges => {
        assert.equal(discharges, macaroon);
      };
      const failure = msg => {
        console.error(msg);
        assert.fail();
      }
      bakery.discharge('macaroons', success, failure);
      assert.equal(
        dischargeStub.callCount, 1,
        'macaroonlib discharge not called');
      assert.equal(importStub.callCount, 1, 'macaroonlib import not called');
      assert.equal(exportStub.callCount, 1, 'macaroonlib export not called');
    });

    it('handles failures discharging macaroons', () => {
      const macaroon = 'this is a macaroon';
      const error = { message: 'bad wolf' };
      dischargeStub.callsArgWith(2, macaroon);
      importStub.throws(error);
      const success = () => {};
      const failure = msg => {
        assert.equal(msg, `discharge failed: ${error.message}`);
      }
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
});

