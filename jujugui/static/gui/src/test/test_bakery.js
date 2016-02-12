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
  var bakery, macaroon, utils, Y;

  before(function (done) {
    var modules = ['juju-env-bakery', 'juju-env-web-handler',
                   'juju-tests-utils', 'macaroon' ];
    Y = YUI(GlobalConfig).use(modules, function (Y) {
      utils = Y['juju-tests'].utils;
      macaroon = Y['macaroon'];
      done();
    });
  });

  beforeEach(function () {
    bakery = new Y.juju.environments.web.Bakery({
      webhandler: new Y.juju.environments.web.WebHandler(),
      serviceName: 'test'
    });
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

  describe('_fetchMacaroonFromStaticPath', function() {

    it('can return a saved macaroon', function() {
      var getStub = utils.makeStubMethod(bakery, 'getMacaroon', 'macaroons');
      this._cleanups.push(getStub.reset);
      var callback = utils.makeStubFunction();
      bakery.fetchMacaroonFromStaticPath(callback);
      assert.equal(callback.callCount(), 1);
      assert.deepEqual(callback.lastArguments(), [null, 'macaroons']);
    });

    it('fails gracefully if no static path is defined', function() {
      var getStub = utils.makeStubMethod(bakery, 'getMacaroon', null);
      this._cleanups.push(getStub.reset);
      var callback = utils.makeStubFunction();
      bakery.staticMacaroonPath = false;
      bakery.fetchMacaroonFromStaticPath(callback);
      assert.equal(callback.callCount(), 1);
      assert.deepEqual(
        callback.lastArguments(), ['Static macaroon path was not defined.']);
    });

    it('sends get request to fetch macaroon', function() {
      var getStub = utils.makeStubMethod(bakery, 'getMacaroon', null);
      var sendGet = utils.makeStubMethod(bakery.webhandler, 'sendGetRequest');
      this._cleanups.push(sendGet.reset);
      this._cleanups.push(getStub.reset);
      var callback = utils.makeStubFunction();
      bakery.staticMacaroonPath = 'path/to/macaroon';
      bakery.fetchMacaroonFromStaticPath(callback);
      assert.equal(sendGet.callCount(), 1);
      assert.equal(sendGet.lastArguments()[0], bakery.staticMacaroonPath);
      assert.equal(sendGet.lastArguments()[1], null);
      assert.equal(sendGet.lastArguments()[2], null);
      assert.equal(sendGet.lastArguments()[3], null);
      assert.equal(sendGet.lastArguments()[4], false);
      assert.equal(sendGet.lastArguments()[5], null);
      assert.equal(typeof sendGet.lastArguments()[6], 'function');
    });

    it('authenticates the macaroon after fetching', function() {
      var getStub = utils.makeStubMethod(
        bakery, 'getMacaroon', null, 'macaroons');
      var authStub = utils.makeStubMethod(bakery, '_authenticate');
      var sendGet = utils.makeStubMethod(bakery.webhandler, 'sendGetRequest');
      this._cleanups.concat([sendGet.reset, getStub.reset, authStub.reset]);
      var callback = utils.makeStubFunction();
      bakery.staticMacaroonPath = 'path/to/macaroon';
      bakery.fetchMacaroonFromStaticPath(callback);
      var responseText = '{"valid": "json"}';
      var response = {
        target: {
          responseText: responseText
        }
      };
      sendGet.lastArguments()[6](response); // Call the get request callback
      assert.equal(authStub.callCount(), 1);
      assert.deepEqual(authStub.lastArguments()[0], JSON.parse(responseText));
      assert.equal(typeof authStub.lastArguments()[1], 'function');
      assert.equal(typeof authStub.lastArguments()[2], 'function');
      // Call the authenticate callback
      authStub.lastArguments()[1]();
      assert.equal(callback.callCount(), 1);
      assert.deepEqual(callback.lastArguments(), [null, 'macaroons']);
    });

    it('fails gracefully if it cannot parse the macaroon response', function() {
      var getStub = utils.makeStubMethod(
        bakery, 'getMacaroon', null, 'macaroons');
      var authStub = utils.makeStubMethod(bakery, '_authenticate');
      var sendGet = utils.makeStubMethod(bakery.webhandler, 'sendGetRequest');
      this._cleanups.concat([sendGet.reset, getStub.reset, authStub.reset]);
      var callback = utils.makeStubFunction();
      bakery.staticMacaroonPath = 'path/to/macaroon';
      bakery.fetchMacaroonFromStaticPath(callback);
      var response = {
        target: {
          responseText: 'invalidjson'
        }
      };
      sendGet.lastArguments()[6](response); // Call the get request callback
      assert.equal(callback.callCount(), 1);
      assert.equal(
        callback.lastArguments()[0].message,
        'JSON Parse error: Unexpected identifier "invalidjson"');
      assert.equal(authStub.callCount(), 0);
    });

  });

  describe('_requestHandler', function() {
    var success, failure;

    beforeEach(function() {
      success = utils.makeStubFunction();
      failure = utils.makeStubFunction();
    });

    it('calls the failure callback if status > 400', function() {
      bakery._requestHandler(success, failure, {
        target: { status: 404 }
      });
      assert.equal(success.callCount(), 0);
      assert.equal(failure.callCount(), 1);
    });

    it('calls the success callback if status < 400', function() {
      bakery._requestHandler(success, failure, {
        target: { status: 200 }
      });
      assert.equal(success.callCount(), 1);
      assert.equal(failure.callCount(), 0);
    });
  });

  describe('_requestHandlerWithInteraction', function() {
    var success, failure;

    beforeEach(function() {
      success = utils.makeStubFunction();
      failure = utils.makeStubFunction();
    });

    it('calls original send with macaroon without auth needed', function() {
      bakery = new Y.juju.environments.web.Bakery({
        webhandler: new Y.juju.environments.web.WebHandler(),
        serviceName: 'test',
        setCookiePath: 'set-auth-cookie'
      });
      var putCalled = 0;
      bakery.webhandler.sendPutRequest = function(a,b,c,d,e,f,g,h) {
        putCalled++;
        h({'target' : {
          status: 200
        }});
      };
      var originalCalled = 0;
      bakery._sendOriginalRequest = function(a,b,c) {
        originalCalled++;
        assert.equal(a, 'path');
        assert.equal(b, success);
        assert.equal(c, failure);
      };
      var m = macaroon.export(
        macaroon.newMacaroon(nacl.util.decodeUTF8('secret'), 'some id',
            'a location')
      );
      bakery._requestHandlerWithInteraction(
        'path', success, failure, {
          target: {
            status: 401,
            responseText: JSON.stringify({'Info': {'Macaroon': m}}),
            getResponseHeader: function(k) {return 'Macaroon';}
          }
        }
      );
      assert.equal(putCalled, 1);
      assert.equal(originalCalled, 1);
    });

    describe('with third party caveat', function() {
      var m, thirdParty;
      var originalCalled, postCalled, postSuccess;

      beforeEach(function() {
        var originalMacaroon = macaroon.newMacaroon(
          nacl.util.decodeUTF8('secret'), 'some id', 'a location');
        var firstParty = nacl.box.keyPair();
        thirdParty = nacl.box.keyPair();
        bakery.addThirdPartyCaveat(originalMacaroon,
          '[some third party secret]', 'elsewhere',
          thirdParty.publicKey, firstParty);
        m = macaroon.export(originalMacaroon);
        originalCalled = 0;
        postCalled = 0;
        postSuccess = false;
      });

      it('calls original send with macaroon with third party ' +
        'and no interaction needed', function () {
        bakery = new Y.juju.environments.web.Bakery({
          webhandler: new Y.juju.environments.web.WebHandler(),
          visitMethod: null,
          serviceName: 'test',
        });
        bakery._sendOriginalRequest = function (path, sucessCallback,
                                                failureCallback) {
          originalCalled++;
          assert.equal(path, 'path');
          assert.equal(sucessCallback, success);
          assert.equal(failureCallback, failure);
        };

        bakery.webhandler.sendPostRequest = function (path, headers, query,
                                                      d, e, f, g, completed) {
          postCalled++;
          postSuccess = (path == 'elsewhere/discharge')
            && (headers['Bakery-Protocol-Version'] == 1)
            && (headers['Content-Type'] ==
            'application/x-www-form-urlencoded');

          var caveatObj = {};
          try {
            query.split('&').forEach(function (part) {
              var item = part.split('=');
              caveatObj[item[0]] = decodeURIComponent(item[1]);
            });
          } catch (ex) {
            fail('unable to read url query params from sendPost request');
          }

          var dischargeMacaroon = bakery.dischargeThirdPartyCaveat(caveatObj.id,
            thirdParty, function (m) {
            });
          // Call completed with 200 leads to no interaction
          completed({
            'target': {
              status: 200,
              responseText: JSON.stringify({
                'Macaroon': macaroon.export(dischargeMacaroon)
              })
            }
          });
        };

        bakery._requestHandlerWithInteraction(
          'path', success, failure, {
            target: {
              status: 401,
              responseText: JSON.stringify({'Info': {'Macaroon': m}}),
              getResponseHeader: function (k) {
                return 'Macaroon';
              }
            }
          }
        );

        assert.equal(postCalled, 1);
        assert.equal(postSuccess, true);
        assert.equal(originalCalled, 1);
      });

      it('calls original send with macaroon with third party ' +
        'and with interaction', function () {
        var visitMethod = utils.makeStubFunction();
        bakery = new Y.juju.environments.web.Bakery({
          webhandler: new Y.juju.environments.web.WebHandler(),
          visitMethod: visitMethod,
          serviceName: 'test',
        });
        bakery._sendOriginalRequest = function (path, sucessCallback,
                                                failureCallback) {
          originalCalled++;
          assert.equal(path, 'path');
          assert.equal(sucessCallback, success);
          assert.equal(failureCallback, failure);
        };

        var dischargeMacaroon;
        bakery.webhandler.sendPostRequest = function (path, headers, query, d,
                                                      e, f, g, completed) {
          postCalled++;
          postSuccess = (path == 'elsewhere/discharge')
            && (headers['Bakery-Protocol-Version'] == 1)
            && (headers['Content-Type'] ==
            'application/x-www-form-urlencoded');

          var caveatObj = {};
          try {
            query.split('&').forEach(function (part) {
              var item = part.split('=');
              caveatObj[item[0]] = decodeURIComponent(item[1]);
            });
          } catch (ex) {
            fail('unable to read url query params from sendPost request');
          }

          dischargeMacaroon = bakery.dischargeThirdPartyCaveat(caveatObj.id,
            thirdParty, function (m) {
            });

          // Call completed with a 400
          // and Interaction Required to simulate interaction
          completed({
            'target': {
              status: 400,
              responseText: '{"Code": "interaction required", ' +
              '"Info": {"WaitURL": "/mywaiturl"}}'
            }
          });
        };

        var getCalled = 0, getSuccess = false;
        bakery.webhandler.sendGetRequest = function (path, headers, query, d,
                                                     e, f, completed) {
          getCalled++;
          getSuccess = (path == '/mywaiturl');

          completed({
            'target': {
              status: 200,
              responseText: JSON.stringify({
                'Macaroon': macaroon.export(dischargeMacaroon)
              })
            }
          });
        };

        bakery._requestHandlerWithInteraction(
          'path', success, failure, {
            target: {
              status: 401,
              responseText: JSON.stringify({'Info': {'Macaroon': m}}),
              getResponseHeader: function (k) {
                return 'Macaroon';
              }
            }
          }
        );

        assert.equal(postCalled, 1);
        assert.equal(postSuccess, true);
        assert.equal(visitMethod.callCount(), 1);
        assert.equal(getCalled, 1);
        assert.equal(getSuccess, true);
        assert.equal(originalCalled, 1);
      });
    });

    it('no PUT when no cookie path provided', function() {
      var putCalled = 0;
      bakery.webhandler.sendPutRequest = function(a,b,c,d,e,f,g,h) {
        putCalled++;
        h({'target' : {
          status: 200
        }});
      };
      var originalCalled = 0;
      bakery._sendOriginalRequest = function(a,b,c) {
        originalCalled++;
        assert.equal(a, 'path');
        assert.equal(b, success);
        assert.equal(c, failure);
      };
      var m = macaroon.export(
        macaroon.newMacaroon(
            nacl.util.decodeUTF8('secret'), 'some id', 'a location')
      );
      bakery._requestHandlerWithInteraction(
        'path', success, failure, {
          target: {
            status: 401,
            responseText: JSON.stringify({'Info': {'Macaroon': m}}),
            getResponseHeader: function(k) {return 'Macaroon';}
          }
        }
      );
      assert.equal(putCalled, 0);
      assert.equal(originalCalled, 1);
    });

    it('no need for authentication when not 401', function() {
      var requestHandler = utils.makeStubMethod(bakery, '_requestHandler');

      this._cleanups.push(requestHandler.reset);

      bakery._requestHandlerWithInteraction(
        'path', success, failure, {
          target: {
            status: 200,
            responseText: '{"Info": "Success"}'
          }
        }
      );
      assert.equal(requestHandler.callCount(), 1);
    });
  });
});
