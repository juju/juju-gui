/**
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2015 Canonical Ltd.

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

describe('Bakery', function() {
  var bakery, fakeLocalStorage, macaroon, Y;

  before(function (done) {
    var modules = ['juju-env-bakery', 'juju-env-web-handler', 'macaroon' ];
    Y = YUI(GlobalConfig).use(modules, function (Y) {
      macaroon = Y.macaroon;
      done();
    });
  });

  beforeEach(function () {
    bakery = new Y.juju.environments.web.Bakery({
      webhandler: new Y.juju.environments.web.WebHandler(),
      serviceName: 'test'
    });
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
  });

  afterEach(function () {
    bakery = null;
  });

  it('can be instantiated with the proper config values', function() {
    assert(bakery.webhandler instanceof Y.juju.environments.web.WebHandler);
    assert.equal(bakery.visitMethod, bakery._defaultVisitMethod);
  });

  it('can be configured to use a noninteractive visit method', function() {
    bakery = new Y.juju.environments.web.Bakery({
      webhandler: new Y.juju.environments.web.WebHandler(),
      interactive: false,
      serviceName: 'test'
    });
    assert.equal(bakery.visitMethod, bakery._nonInteractiveVisitMethod);
  });

  it('can be configured to use a custom visit method', function() {
    var newVisitMethod = function() {};
    bakery = new Y.juju.environments.web.Bakery({
      webhandler: new Y.juju.environments.web.WebHandler(),
      serviceName: 'test',
      visitMethod: newVisitMethod
    });
    assert.equal(bakery.visitMethod, newVisitMethod);
  });

  it('can accept an already baked macaroon', function() {
    bakery = new Y.juju.environments.web.Bakery({
      webhandler: new Y.juju.environments.web.WebHandler(),
      serviceName: 'test',
      macaroon: 'foo-bar'
    });
    assert.equal(bakery.getMacaroon(), 'foo-bar');
  });

  it('can be configured to use localStorage', function() {
    bakery = new Y.juju.environments.web.Bakery({
      webhandler: new Y.juju.environments.web.WebHandler(),
      serviceName: 'test',
      macaroon: 'foo-bar',
      dischargeToken: 'discharge-foo',
      cookieStore: fakeLocalStorage,
      dischargeStore: fakeLocalStorage
    });
    assert.equal(fakeLocalStorage.getItem('Macaroons-test'), 'foo-bar');
    assert.equal(fakeLocalStorage.getItem('discharge-token'), 'discharge-foo');
  });

  it('can be configured to use a specified cookie name', function() {
    bakery = new Y.juju.environments.web.Bakery({
      webhandler: new Y.juju.environments.web.WebHandler(),
      serviceName: 'test',
      existingCookie: 'existing-cookie',
      macaroon: 'foo-bar',
      cookieStore: fakeLocalStorage
    });
    assert.equal(fakeLocalStorage.getItem('existing-cookie'), 'foo-bar');
  });

  it('can clear a macaroon from the cookieStore', function() {
    bakery = new Y.juju.environments.web.Bakery({
      webhandler: new Y.juju.environments.web.WebHandler(),
      serviceName: 'test',
      existingCookie: 'existing-cookie',
      macaroon: 'foo-bar',
      dischargeStore: fakeLocalStorage,
      cookieStore: fakeLocalStorage,
    });
    bakery.clearCookie();
    assert.deepEqual(fakeLocalStorage.store, {});
  });

  describe('_fetchMacaroonFromStaticPath', function() {

    it('can return a saved macaroon', function() {
      var getStub = sinon.stub(bakery, 'getMacaroon').returns('macaroons');
      this._cleanups.push(getStub.restore);
      var callback = sinon.stub();
      bakery.fetchMacaroonFromStaticPath(callback);
      assert.equal(callback.callCount, 1);
      assert.deepEqual(callback.lastCall.args, [null, 'macaroons']);
    });

    it('fails gracefully if no static path is defined', function() {
      var getStub = sinon.stub(bakery, 'getMacaroon').returns(null);
      this._cleanups.push(getStub.restore);
      var callback = sinon.stub();
      bakery.staticMacaroonPath = false;
      bakery.fetchMacaroonFromStaticPath(callback);
      assert.equal(callback.callCount, 1);
      assert.deepEqual(
        callback.lastCall.args, ['Static macaroon path was not defined.']);
    });

    it('sends get request to fetch macaroon', function() {
      var getStub = sinon.stub(bakery, 'getMacaroon').returns(null);
      var sendGet = sinon.stub(bakery.webhandler, 'sendGetRequest');
      this._cleanups.push(sendGet.restore);
      this._cleanups.push(getStub.restore);
      var callback = sinon.stub();
      bakery.staticMacaroonPath = 'path/to/macaroon';
      bakery.fetchMacaroonFromStaticPath(callback);
      assert.equal(sendGet.callCount, 1);
      assert.equal(sendGet.lastCall.args[0], bakery.staticMacaroonPath);
      assert.equal(sendGet.lastCall.args[1], null);
      assert.equal(sendGet.lastCall.args[2], null);
      assert.equal(sendGet.lastCall.args[3], null);
      assert.equal(sendGet.lastCall.args[4], false);
      assert.equal(sendGet.lastCall.args[5], null);
      assert.equal(typeof sendGet.lastCall.args[6], 'function');
    });

    it('authenticates the macaroon after fetching', function() {
      var getStub = sinon.stub(bakery, 'getMacaroon');
      getStub.onFirstCall().returns(null);
      getStub.onSecondCall().returns('macaroons');
      var authStub = sinon.stub(bakery, '_authenticate');
      var sendGet = sinon.stub(bakery.webhandler, 'sendGetRequest');
      this._cleanups.concat(
        [sendGet.restore, getStub.restore, authStub.restore]);
      var callback = sinon.stub();
      bakery.staticMacaroonPath = 'path/to/macaroon';
      bakery.fetchMacaroonFromStaticPath(callback);
      var responseText = '{"valid": "json"}';
      var response = {
        target: {
          responseText: responseText
        }
      };
      sendGet.lastCall.args[6](response); // Call the get request callback
      assert.equal(authStub.callCount, 1);
      assert.deepEqual(authStub.lastCall.args[0], JSON.parse(responseText));
      assert.equal(typeof authStub.lastCall.args[1], 'function');
      assert.equal(typeof authStub.lastCall.args[2], 'function');
      // Call the authenticate callback
      authStub.lastCall.args[1]();
      assert.equal(callback.callCount, 1);
      assert.deepEqual(callback.lastCall.args, [null, 'macaroons']);
    });

    it('fails gracefully if it cannot parse the macaroon response', function() {
      var getStub = sinon.stub(
        bakery, 'getMacaroon').returns(null, 'macaroons');
      var authStub = sinon.stub(bakery, '_authenticate');
      var sendGet = sinon.stub(bakery.webhandler, 'sendGetRequest');
      this._cleanups.concat(
        [sendGet.restore, getStub.restore, authStub.restore]);
      var callback = sinon.stub();
      bakery.staticMacaroonPath = 'path/to/macaroon';
      bakery.fetchMacaroonFromStaticPath(callback);
      var response = {
        target: {
          responseText: 'invalidjson'
        }
      };
      sendGet.lastCall.args[6](response); // Call the get request callback
      assert.equal(callback.callCount, 1);
      assert.equal(
        callback.lastCall.args[0].message,
        'Unexpected token i in JSON at position 0');
      assert.equal(authStub.callCount, 0);
    });

  });

  describe('_requestHandler', function() {
    var success, failure;

    beforeEach(function() {
      success = sinon.stub();
      failure = sinon.stub();
    });

    it('calls the failure callback if status > 400', function() {
      bakery._requestHandler(success, failure, {
        target: { status: 404 }
      });
      assert.equal(success.callCount, 0);
      assert.equal(failure.callCount, 1);
    });

    it('calls the success callback if status < 400', function() {
      bakery._requestHandler(success, failure, {
        target: { status: 200 }
      });
      assert.equal(success.callCount, 1);
      assert.equal(failure.callCount, 0);
    });
  });

  describe('_requestHandlerWithInteraction', function() {

    it('calls original send with macaroon without auth needed', function() {
      bakery = new Y.juju.environments.web.Bakery({
        webhandler: new Y.juju.environments.web.WebHandler(),
        serviceName: 'test',
        setCookiePath: 'set-auth-cookie'
      });
      const onAuthRequired = sinon.stub().withArgs();
      const onAuthDone = sinon.stub();
      const onFailure = sinon.stub();
      const redirect = true;
      const m = macaroon.export(macaroon.newMacaroon(
        nacl.util.decodeUTF8('secret'), 'some id', 'a location'));
      const response = {
        target: {
          status: 401,
          responseText: JSON.stringify({'Info': {'Macaroon': m}}),
          getResponseHeader: sinon.stub().withArgs(
            'Www-Authenticate').returns('Macaroon')
        }
      };
      let putCalled = 0;
      bakery.webhandler.sendPutRequest = function(
        path, headers, data, username, password, withCredentials,
        progressCallback, completedCallback
      ) {
        putCalled++;
        completedCallback({'target' : {status: 200}});
      };
      bakery._requestHandlerWithInteraction(
        onAuthRequired, onAuthDone, onFailure, redirect, response);
      assert.equal(onAuthRequired.callCount, 1, 'onAuthRequired');
      assert.equal(onAuthDone.callCount, 0, 'onAuthDone');
      assert.equal(onFailure.callCount, 0, 'onFailure');
      assert.equal(putCalled, 1, 'putCalled');
    });

    describe('with third party caveat', function() {
      let m, postCalled, postSuccess, thirdParty;

      beforeEach(function() {
        const originalMacaroon = macaroon.newMacaroon(
          nacl.util.decodeUTF8('secret'), 'some id', 'a location');
        const firstParty = nacl.box.keyPair();
        thirdParty = nacl.box.keyPair();
        bakery.addThirdPartyCaveat(originalMacaroon,
          '[some third party secret]', 'elsewhere',
          thirdParty.publicKey, firstParty);
        m = macaroon.export(originalMacaroon);
        postCalled = 0;
        postSuccess = false;
      });

      it('calls original send with macaroon with third party ' +
        'and no interaction needed', function () {
        bakery = new Y.juju.environments.web.Bakery({
          webhandler: new Y.juju.environments.web.WebHandler(),
          visitMethod: null,
          serviceName: 'test',
          dischargeStore: fakeLocalStorage
        });
        const onAuthRequired = sinon.stub().withArgs();
        const onAuthDone = sinon.stub();
        const onFailure = sinon.stub();
        const redirect = true;
        const response = {
          target: {
            status: 401,
            responseText: JSON.stringify({'Info': {'Macaroon': m}}),
            getResponseHeader: sinon.stub().withArgs(
              'Www-Authenticate').returns('Macaroon')
          }
        };
        bakery.webhandler.sendPostRequest = function (
          path, headers, data, username, password, withCredentials,
          progressCallback, completedCallback
        ) {
          postCalled++;
          postSuccess = (
            path === 'elsewhere/discharge' &&
            headers['Bakery-Protocol-Version'] === 1 &&
            headers['Content-Type'] === 'application/x-www-form-urlencoded'
          );
          const caveatObj = {};
          try {
            data.split('&').forEach(function (part) {
              const item = part.split('=');
              caveatObj[item[0]] = decodeURIComponent(item[1]);
            });
          } catch (ex) {
            throw new Error('cannot read URL query params');
          }
          const dischargeMacaroon = bakery.dischargeThirdPartyCaveat(
            caveatObj.id, thirdParty, m => {});
          // Call completed with 200 leads to no interaction.
          completedCallback({
            'target': {
              status: 200,
              responseText: JSON.stringify({
                'Macaroon': macaroon.export(dischargeMacaroon),
                'DischargeToken': 'discharge-foo'
              })
            }
          });
        };
        bakery._requestHandlerWithInteraction(
          onAuthRequired, onAuthDone, onFailure, redirect, response);
        assert.equal(onAuthRequired.callCount, 1, 'onAuthRequired');
        assert.equal(onAuthDone.callCount, 0, 'onAuthDone');
        assert.equal(onFailure.callCount, 0, 'onFailure');
        assert.equal(postCalled, 1, 'postCalled');
        assert.equal(postSuccess, true, 'postSuccess');
        assert.equal(
          fakeLocalStorage.getItem('discharge-token'),
          btoa(JSON.stringify('discharge-foo'))
        );
      });

      it('calls original send with macaroon with third party ' +
        'and no interaction needed with discharge-token', function () {
        bakery = new Y.juju.environments.web.Bakery({
          webhandler: new Y.juju.environments.web.WebHandler(),
          visitMethod: null,
          serviceName: 'test',
          dischargeStore: fakeLocalStorage,
          dischargeToken: 'discharge-foo'
        });
        const onAuthRequired = sinon.stub().withArgs();
        const onAuthDone = sinon.stub();
        const onFailure = sinon.stub();
        const redirect = true;
        const response = {
          target: {
            status: 401,
            responseText: JSON.stringify({'Info': {'Macaroon': m}}),
            getResponseHeader: sinon.stub().withArgs(
              'Www-Authenticate').returns('Macaroon')
          }
        };
        bakery.webhandler.sendPostRequest = function (
          path, headers, data, username, password, withCredentials,
          progressCallback, completedCallback
        ) {
          postCalled++;
          postSuccess = (
            path === 'elsewhere/discharge' &&
            headers['Bakery-Protocol-Version'] === 1 &&
            headers['Content-Type'] === 'application/x-www-form-urlencoded' &&
            headers['Macaroons'] == 'discharge-foo'
          );
          const caveatObj = {};
          try {
            data.split('&').forEach(function (part) {
              const item = part.split('=');
              caveatObj[item[0]] = decodeURIComponent(item[1]);
            });
          } catch (ex) {
            throw new Error('cannot read URL query params');
          }
          const dischargeMacaroon = bakery.dischargeThirdPartyCaveat(
            caveatObj.id, thirdParty, m => {});
          // Call completed with 200 leads to no interaction.
          completedCallback({
            'target': {
              status: 200,
              responseText: JSON.stringify({
                'Macaroon': macaroon.export(dischargeMacaroon),
                'DischargeToken': 'discharge-foo'
              })
            }
          });
        };
        bakery._requestHandlerWithInteraction(
          onAuthRequired, onAuthDone, onFailure, redirect, response);
        assert.equal(onAuthRequired.callCount, 1, 'onAuthRequired');
        assert.equal(onAuthDone.callCount, 0, 'onAuthDone');
        assert.equal(onFailure.callCount, 0, 'onFailure');
        assert.equal(postCalled, 1, 'postCalled');
        assert.equal(postSuccess, true, 'postSuccess');
        assert.equal(
          fakeLocalStorage.getItem('discharge-token'),
          btoa(JSON.stringify('discharge-foo'))
        );
      });

      it('calls original send with macaroon with third party ' +
        'and with interaction', function () {
        const visitMethod = sinon.stub();
        bakery = new Y.juju.environments.web.Bakery({
          webhandler: new Y.juju.environments.web.WebHandler(),
          visitMethod: visitMethod,
          serviceName: 'test',
          dischargeStore: fakeLocalStorage
        });
        const onAuthRequired = sinon.stub().withArgs();
        const onAuthDone = sinon.stub();
        const onFailure = sinon.stub();
        const redirect = true;
        const response = {
          target: {
            status: 401,
            responseText: JSON.stringify({'Info': {'Macaroon': m}}),
            getResponseHeader: sinon.stub().withArgs(
              'Www-Authenticate').returns('Macaroon')
          }
        };
        let dischargeMacaroon;
        bakery.webhandler.sendPostRequest = function (
          path, headers, data, username, password, withCredentials,
          progressCallback, completedCallback
        ) {
          postCalled++;
          postSuccess = (
            path === 'elsewhere/discharge' &&
            headers['Bakery-Protocol-Version'] === 1 &&
            headers['Content-Type'] === 'application/x-www-form-urlencoded'
          );
          const caveatObj = {};
          try {
            data.split('&').forEach(function (part) {
              const item = part.split('=');
              caveatObj[item[0]] = decodeURIComponent(item[1]);
            });
          } catch (ex) {
            throw new Error('cannot read URL query params');
          }
          dischargeMacaroon = bakery.dischargeThirdPartyCaveat(
            caveatObj.id, thirdParty, m => {});
          // Call completed with 200 leads to no interaction.
          completedCallback({
            'target': {
              status: 400,
              responseText: JSON.stringify({
                Code: 'interaction required',
                Info: {WaitURL: '/mywaiturl'}
              })
            }
          });
        };
        let getCalled = 0;
        let getSuccess = false;
        bakery.webhandler.sendGetRequest = function (
          path, headers, username, password, withCredentials, progressCallback,
          completedCallback
        ) {
          assert.deepEqual(headers, {'Content-Type': 'application/json'});
          getCalled++;
          getSuccess = path == '/mywaiturl';
          completedCallback({
            'target': {
              status: 200,
              responseText: JSON.stringify({
                'Macaroon': macaroon.export(dischargeMacaroon)
              })
            }
          });
        };
        bakery._requestHandlerWithInteraction(
          onAuthRequired, onAuthDone, onFailure, redirect, response);
        assert.equal(onAuthRequired.callCount, 1, 'onAuthRequired');
        assert.equal(onAuthDone.callCount, 0, 'onAuthDone');
        assert.equal(onFailure.callCount, 0, 'onFailure');
        assert.equal(postCalled, 1, 'postCalled');
        assert.equal(postSuccess, true, 'postSuccess');
        assert.equal(getCalled, 1);
        assert.equal(getSuccess, true);
        assert.equal(visitMethod.callCount, 1);
      });
    });

    it('no PUT when no cookie path provided', function() {
      const onAuthRequired = sinon.stub().withArgs();
      const onAuthDone = sinon.stub();
      const onFailure = sinon.stub();
      const redirect = true;
      const m = macaroon.export(macaroon.newMacaroon(
        nacl.util.decodeUTF8('secret'), 'some id', 'a location'));
      const response = {
        target: {
          status: 401,
          responseText: JSON.stringify({'Info': {'Macaroon': m}}),
          getResponseHeader: sinon.stub().withArgs(
            'Www-Authenticate').returns('Macaroon')
        }
      };
      let putCalled = 0;
      bakery.webhandler.sendPutRequest = function(
        path, headers, data, username, password, withCredentials,
        progressCallback, completedCallback
      ) {
        putCalled++;
        completedCallback({'target' : {status: 200}});
      };
      bakery._requestHandlerWithInteraction(
        onAuthRequired, onAuthDone, onFailure, redirect, response);
      assert.equal(onAuthRequired.callCount, 1, 'onAuthRequired');
      assert.equal(onAuthDone.callCount, 0, 'onAuthDone');
      assert.equal(onFailure.callCount, 0, 'onFailure');
      assert.equal(putCalled, 0, 'putCalled');
    });

    it('no need for authentication when not 401', function() {
      const onAuthRequired = sinon.stub().withArgs();
      const onAuthDone = sinon.stub();
      const onFailure = sinon.stub();
      const redirect = true;
      const response = {
        target: {
          status: 200,
          responseText: JSON.stringify({Info: 'Success'})
        }
      };
      bakery._requestHandlerWithInteraction(
        onAuthRequired, onAuthDone, onFailure, redirect, response);
      assert.equal(onAuthRequired.callCount, 0, 'onAuthRequired');
      assert.equal(onAuthDone.callCount, 1, 'onAuthDone');
      const args = onAuthDone.args[0];
      assert.equal(args.length, 1);
      assert.deepEqual(args[0], response);
      assert.equal(onFailure.callCount, 0, 'onFailure');
    });
  });
});
