/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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

describe('Model Controller Promises', function() {
  var modelController, yui, env, db, conn, environment, load, serviceError,
      getService, cleanups, aEach;

  before(function(done) {
    YUI(GlobalConfig).use(
        'juju-models', 'model-controller', 'juju-charm-models',
        'juju-view-environment', 'juju-tests-utils', function(Y) {
          var environments = Y.juju.environments;
          yui = Y;
          load = Y.juju.models.BrowserCharm.prototype.load;
          getService = environments.PythonEnvironment.prototype.get_service;
          aEach = Y.Array.each;
          done();
        });
  });

  beforeEach(function() {
    conn = new yui['juju-tests'].utils.SocketStub();
    environment = env = yui.juju.newEnvironment(
        {conn: conn});
    db = new yui.juju.models.Database();
    env.connect();
    modelController = new yui.juju.ModelController({
      db: db,
      env: env
    });
    cleanups = [];
  });

  afterEach(function() {
    serviceError = false;
    aEach([env, db, modelController], function(instance) {
      instance.destroy();
    });
    yui.Array.each(cleanups, function(cleanup) {
      cleanup();
    });
  });

  /**
    Monkeypatching the BrowserCharm model's load method to allow the load calls
    to execute successfully.

    @method clobberLoad
    @static
  */
  function clobberLoad() {
    yui.juju.models.BrowserCharm.prototype.load = function(env, callback) {
      assert.deepEqual(env, environment);
      callback();
    };
    cleanups.push(restoreLoad);
  }

  /**
    Restores the BrowserCharm model's load method to its original value.

    @method restoreLoad
    @static
  */
  function restoreLoad() {
    yui.juju.models.BrowserCharm.prototype.load = load;
  }

  /**
    Monkeypatching the python environments get_service method to allow
    the get_service calls to execute successfully.

    @method clobberGetService
    @static
  */
  function clobberGetService() {
    yui.juju.environments.PythonEnvironment.prototype.get_service = function(
        serviceName, callback) {
      assert(typeof serviceName, 'string');
      // This is to test the error reject path of the getService tests
      if (serviceError === true) {
        callback({err: true});
      }
      // This adds the service for the getService success path
      db.services.add({id: serviceName});
      callback({
        service_name: serviceName,
        result: {
          config: '',
          constraints: ''
        }
      });
    };
    cleanups.push(restoreGetService);
  }

  /**
    Restores the Services model's load get_service to its original value.

    @method restireGetService
    @static
  */
  function restoreGetService() {
    yui.juju.environments.PythonEnvironment.prototype.get_service = getService;
  }

  it('will return a promise with a stored loaded charm', function(done) {
    // this tests the first resolve path
    var charmId = 'cs:precise/wordpress-7',
        charm = db.charms.add({id: charmId});
    charm.loaded = true;
    var promise = modelController.getCharm(charmId);
    assert(yui.Promise.isPromise(promise), true);
    assert(!!db.charms.getById(charmId), true);
    promise.then(
        function(charm) {
          assert(charm.get('id'), charmId);
          assert(!!db.charms.getById(charmId), true);
          done();
        },
        function() {
          assert.fail('This should not have failed.');
          done();
        });
  });

  it('will return a promise with a loaded charm', function(done) {
    // This tests the second resolve path
    clobberLoad();
    var charmId = 'cs:precise/wordpress-7',
        promise = modelController.getCharm(charmId);
    assert(yui.Promise.isPromise(promise), true);
    assert(db.charms.getById(charmId), null);
    promise.then(
        function(charm) {
          assert(charm.get('package_name'), 'wordpress');
          done();
        },
        function() {
          assert.fail('This should not have failed.');
          done();
        });
  });

  it('will return a promise with a stored loaded service', function(done) {
    // This tests the first resolve path
    var serviceId = 'wordpress',
        service = db.services.add({
          id: serviceId,
          loaded: true});
    var promise = modelController.getService(serviceId);
    assert(yui.Promise.isPromise(promise), true);
    assert(!!db.services.getById(serviceId), true);
    promise.then(
        function(service) {
          assert(service.get('id'), serviceId);
          assert(!!db.services.getById(serviceId), true);
          done();
        },
        function() {
          assert.fail('This should not have failed.');
          done();
        });

  });

  it('will return a promise with a loaded service', function(done) {
    // This tests the second resolve path
    clobberGetService();
    var serviceId = 'wordpress',
        promise = modelController.getService(serviceId);
    assert(yui.Promise.isPromise(promise), true);
    assert(db.services.getById(serviceId), null);
    promise.then(
        function(service) {
          assert(service.get('id'), serviceId);
          assert(!!db.services.getById(serviceId), true);
          done();
        },
        function() {
          assert.fail('This should not have failed.');
          done();
        });
  });

  it('will reject the promise if the service does not exist', function(done) {
    serviceError = true;
    clobberGetService();
    var serviceId = 'wordpress',
        promise = modelController.getService(serviceId);
    assert(yui.Promise.isPromise(promise), true);
    assert(db.services.getById(serviceId), null);
    promise.then(
        function() {
          assert.fail('This should not have been successful.');
          done();
        },
        function(err) {
          assert(err.err, true);
          done();
        });
  });

  it('will return a promise with a loaded charm and service',
      function(done) {
        clobberLoad();
        clobberGetService();
        var serviceId = 'wordpress',
            charmId = 'cs:precise/wordpress-7';
        db.services.add({
          id: serviceId,
          loaded: true,
          charm: charmId
        });
        var promise = modelController.getServiceWithCharm(serviceId);
        assert(yui.Promise.isPromise(promise), true);
        promise.then(
            function(result) {
              assert(result.service.get('id'), serviceId);
              assert(result.charm.get('id'), charmId);
              assert(!!db.services.getById(serviceId), true);
              assert(!!db.charms.getById(charmId), true);
              done();
            },
            function() {
              assert.fail('This should not have failed.');
              done();
            });
      });
});
