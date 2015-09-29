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
      visitMethod: null,
      serviceName: 'test'
    });
  });

  afterEach(function () {
    bakery = null;
  });

  it('can be instantiated with the proper config values', function() {
    assert.equal(
        bakery.webhandler instanceof Y.juju.environments.web.WebHandler,
        true);
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
        visitMethod: null,
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
        macaroon.newMacaroon(['secret'], 'some id', 'a location')
      );
      bakery._requestHandlerWithInteraction(
        'path', success, failure, {
          target: {
            status: 401,
            responseText: '{"Info": {"Macaroon": ' + JSON.stringify(m) + '}}',
            getResponseHeader: function(k) {return 'Macaroon';}
          }
        }
      );
      assert.equal(putCalled, 1);
      assert.equal(originalCalled, 1);
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
        macaroon.newMacaroon(['secret'], 'some id', 'a location')
      );
      bakery._requestHandlerWithInteraction(
        'path', success, failure, {
          target: {
            status: 401,
            responseText: '{"Info": {"Macaroon": ' + JSON.stringify(m) + '}}',
            getResponseHeader: function(k) {return 'Macaroon';}
          }
        }
      );
      assert.equal(putCalled, 0);
      assert.equal(originalCalled, 1);
    });

    it('no need for authentication when not 401', function() {
      var requestHandler = utils.makeStubMethod(
        bakery, '_requestHandler');

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
