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

(function() {

  describe('local-charm-import-helpers', function() {
    var dbObj, env, helper, notificationParams, testUtils, Y;

    before(function(done) {
      var modules = ['juju-charm-models', 'local-charm-import-helpers',
        'juju-tests-utils', 'node-event-simulate', 'request-series-view'];
      Y = YUI(GlobalConfig).use(modules, function(Y) {
        helper = Y.juju.localCharmHelpers;
        testUtils = Y['juju-tests'].utils;
        done();
      });
    });

    beforeEach(function() {
      dbObj = {
        notifications: {
          add: function(info) {
            notificationParams = info;
          }
        }
      };
    });

    afterEach(function() {
      dbObj = undefined;
    });

    describe('deployLocalCharm', function() {
      it('requests the series from the user', function() {
        var fileObj = { name: 'foo' },
            envObj = {};
        var stub = testUtils.makeStubMethod(helper, '_requestSeries');
        helper.deployLocalCharm(fileObj, envObj, dbObj);
        var args = stub.lastArguments();
        assert.deepEqual(args[0], fileObj);
        assert.deepEqual(args[1], envObj);
        assert.deepEqual(args[2], dbObj);
        stub.reset();
      });
    });

    describe('_requestSeries', function() {
      var stubs = {}, fileObj, defSeries, reqAttr, envObj;

      beforeEach(function() {
        // makeContainer will auto cleanup
        var container = testUtils.makeContainer(this, 'content'),
            template = testUtils.makeContainer(this, 'template');
        fileObj = { name: 'foo', size: '100' };
        defSeries = 'precise';
        reqAttr = 'defaultSeries';
        envObj = {
          get: function(attr) {
            assert.equal(attr, reqAttr);
            return defSeries;
          }
        };
      });

      afterEach(function() {
        Object.keys(stubs).forEach(function(key) {
          stubs[key].reset();
        });
        stubs = {};
      });

      it('renders the viewletManager', function() {
        var renderStub = testUtils.makeStubFunction();
        var RequestStub = testUtils.makeStubMethod(
            Y.juju.views, 'RequestSeriesInspector', { render: renderStub });
        this._cleanups.push(RequestStub.reset);
        helper._requestSeries(fileObj, envObj, dbObj);
        assert.deepEqual(RequestStub.lastArguments()[0], {
          file: fileObj,
          env: envObj,
          db: dbObj
        });
        assert.equal(RequestStub.calledOnce(), true);
        assert.equal(renderStub.calledOnce(), true);
      });
    });

    describe('uploadLocalCharm', function() {
      var stubs = {}, fileObj, defSeries;

      beforeEach(function() {
        fileObj = { name: 'foo' };
        defSeries = 'precise';

        stubs.localCharmLoadStub = testUtils.makeStubMethod(
            helper, '_uploadLocalCharmLoad');
        stubs.envFn = testUtils.makeStubFunction();
        stubs.uploadLocalCharmStub = testUtils.makeStubMethod(
            stubs.envFn, 'uploadLocalCharm');
        stubs.getDefault = testUtils.makeStubMethod(
            stubs.envFn, 'get', defSeries);
      });

      afterEach(function() {
        Object.keys(stubs).forEach(function(key) {
          var stub = stubs[key];
          if (stub.reset) {
            stubs[key].reset();
          }
        });
        stubs = {};
      });

      it('requests an upload from the environment', function() {
        var option = { option: 'option' };
        helper.uploadLocalCharm(defSeries, fileObj, stubs.envFn, dbObj, option);
        assert.equal(stubs.uploadLocalCharmStub.called(), true);
        var args = stubs.uploadLocalCharmStub.lastArguments();
        assert.deepEqual(args[0], fileObj);
        assert.deepEqual(args[1], defSeries);
        assert.isFunction(args[2]);
        assert.isFunction(args[3]);

        // Call the load callback to test to make sure it was called with the
        // attributes that were bound to it.
        args[3]();
        assert.equal(stubs.localCharmLoadStub.called(), true);
        var cbArgs = stubs.localCharmLoadStub.lastArguments();
        assert.deepEqual(cbArgs[0], fileObj);
        assert.deepEqual(cbArgs[1], stubs.envFn);
        assert.deepEqual(cbArgs[2], dbObj);
        assert.deepEqual(cbArgs[3], option);
      });

      it('pulls series from the defaultSeries if none is supplied', function() {
        helper.uploadLocalCharm(null, fileObj, stubs.envFn);
        assert.equal(stubs.uploadLocalCharmStub.called(), true);
        assert.equal(stubs.getDefault.calledOnce(), true);
        var args = stubs.uploadLocalCharmStub.lastArguments();
        assert.deepEqual(args[1], defSeries);
      });
    });

    describe('loadCharmDetails', function() {
      it('calls supplied callback after the charm is loaded', function(done) {
        var envObj = {};
        var oldMethod = Y.juju.models.Charm.prototype.load;
        Y.juju.models.Charm.prototype.load = function(env) {
          assert.deepEqual(env, envObj);
          this.fire('load');
        };
        // provided by mocha monkeypatch see test/index.html
        this._cleanups.push(function() {
          Y.juju.models.Charm.prototype.load = oldMethod;
        });
        helper.loadCharmDetails('local:precise/ghost-4', envObj,
            function(charm) {
              assert.isObject(charm);
              done();
            });
      });
    });

    describe('_loadCharmDetailsCallback', function() {
      it('fires the initiateDeploy event', function() {
        var stub = testUtils.makeStubMethod(Y, 'fire');
        helper._loadCharmDetailsCallback('foo');
        var args = stub.lastArguments();
        assert.equal(args[0], 'initiateDeploy');
        assert.equal(args[1], 'foo');
        assert.deepEqual(args[2], {});
        stub.reset();
      });
    });

    describe('_uploadLocalCharmProgress', function() {
      it('is a function', function() {
        // Currently this method is a no-op, update when
        // we add this functionality.
        assert.isFunction(helper._uploadLocalCharmProgress);
      });
    });

    describe('_uploadLocalCharmLoad', function() {
      function stubParseUploadResponse(test, response) {
        response = response || { CharmURL: 'foo' };
        var stub = testUtils.makeStubMethod(
            helper, '_parseUploadResponse', response);
        // `test` is the context of each individual test.
        // Provided by mocha monkey patch in test/index.html
        test._cleanups.push(function() {
          stub.reset();
        });
        return stub;
      }

      function stubLoadCharmDetails(test) {
        var stub = testUtils.makeStubMethod(helper, 'loadCharmDetails');
        // `test` is the context of each individual test.
        // Provided by mocha monkey patch in test/index.html
        test._cleanups.push(function() {
          stub.reset();
        });
        return stub;
      }

      it('calls _parseUploadResponse() on success or failure', function() {
        var fileObj = { name: 'foo' },
            eventObj = { target: { responseText: '' }},
            envObj = {};

        var loadCharmDetailsStub = stubLoadCharmDetails(this);
        stubParseUploadResponse(this);

        helper._uploadLocalCharmLoad(fileObj, envObj, dbObj, null, eventObj);
        assert.equal(loadCharmDetailsStub.called(), true);
      });

      it('calls loadsCharmDetails() on successful upload', function() {
        var charmURLString = 'foo',
            fileObj = { name: 'foo' },
            eventObj = { target: { responseText: '' }},
            envObj = {};

        var loadCharmDetailsStub = stubLoadCharmDetails(this);
        stubParseUploadResponse(this);

        helper._uploadLocalCharmLoad(fileObj, envObj, dbObj, null, eventObj);

        assert.equal(loadCharmDetailsStub.called(), true);
        var args = loadCharmDetailsStub.lastArguments();
        assert.equal(args[0], charmURLString);
        assert.deepEqual(args[1], envObj);
        assert.isFunction(args[2]);

      });

      it('shows a notification if local charm upload is not supported',
          function() {
            var fileObj = { name: 'foo' },
                eventObj = { target: { status: 500 } },
                envObj = {};

            stubLoadCharmDetails(this);
            stubParseUploadResponse(this);

            helper._uploadLocalCharmLoad(
                fileObj, envObj, dbObj, null, eventObj);
            assert.deepEqual(notificationParams, {
              title: 'Import failed',
              message: 'Import from "foo" failed. Your version of ' +
                  'Juju does not support local charm uploads. Please use at ' +
                  'least version 1.18.0.',
              level: 'error'
            });
          });

      it('shows a notification on a successful upload', function() {
        var fileObj = { name: 'foo' },
            eventObj = { target: { responseText: '' }},
            envObj = {};

        stubLoadCharmDetails(this);
        stubParseUploadResponse(this);

        helper._uploadLocalCharmLoad(fileObj, envObj, dbObj, null, eventObj);
        assert.deepEqual(notificationParams, {
          title: 'Imported local charm file',
          message: 'Import from "foo" successful.',
          level: 'important'
        });
      });

      it('shows a notification on a failed upload', function() {
        var fileObj = { name: 'foo' },
            eventObj = {
              target: { responseText: '' },
              type: 'error'
            },
            envObj = {};

        stubLoadCharmDetails(this);
        stubParseUploadResponse(this, {
          Error: 'oops'
        });

        helper._uploadLocalCharmLoad(fileObj, envObj, dbObj, null, eventObj);
        assert.deepEqual(notificationParams, {
          title: 'Import failed',
          message: 'Import from "foo" failed. oops',
          level: 'error'
        });
      });

    });

    describe('_parseUploadResponse', function() {
      it('returns a parsed JSON string', function() {
        var data = '{"foo": "bar"}';
        assert.deepEqual(helper._parseUploadResponse(data), {
          foo: 'bar'
        });
      });

      it('returns the raw data if JSON parsing fails', function() {
        var data = '<div>Error</div>';
        assert.strictEqual(helper._parseUploadResponse(data), data);
      });
    });

    describe('_upgradeServices', function() {
      var charmGet, charm, charmUrl, envObj, setCharmStub, service,
          serviceGet, showServiceStub;

      beforeEach(function() {
        charmUrl = 'local:precise/ghost-4';
        charmGet = testUtils.makeStubFunction(charmUrl, charmUrl);
        charm = { get: charmGet };
        setCharmStub = testUtils.makeStubFunction();
        serviceGet = testUtils.makeStubFunction('srv1', 'srv2');
        showServiceStub = testUtils.makeStubMethod(
            helper, '_showServiceUpgradedNotification');
        envObj = { setCharm: setCharmStub };
      });

      afterEach(function() {
        showServiceStub.reset();
      });

      it('upgrades a single service', function() {
        service = { get: serviceGet };
        helper._upgradeServices([service], envObj, dbObj, charm);
        assert.equal(setCharmStub.calledOnce(), true);
        var setCharmArgs = setCharmStub.lastArguments();
        assert.equal(setCharmArgs[0], 'srv1');
        assert.equal(setCharmArgs[1], charmUrl);
        assert.equal(setCharmArgs[2], false);
        assert.isFunction(setCharmArgs[3]);
        // Check to make sure the callback is called with the proper args
        setCharmArgs[3]();
        assert.equal(showServiceStub.calledOnce(), true);
        assert.deepEqual(showServiceStub.lastArguments()[0], dbObj);
      });

      it('upgrades multiple services', function() {
        service = { get: serviceGet };
        helper._upgradeServices([service, service], envObj, dbObj, charm);
        assert.equal(setCharmStub.callCount(), 2);
        var setCharmArgs = setCharmStub.allArguments();
        assert.equal(setCharmArgs[0][0], 'srv1');
        assert.equal(setCharmArgs[0][1], charmUrl);
        assert.equal(setCharmArgs[0][2], false);
        assert.isFunction(setCharmArgs[0][3]);
        assert.equal(setCharmArgs[1][0], 'srv2');
        assert.equal(setCharmArgs[1][1], charmUrl);
        assert.equal(setCharmArgs[1][2], false);
        assert.isFunction(setCharmArgs[1][3]);
      });
    });

    describe('_showServiceUpgradedNotification', function() {
      it('shows a notification on a failed upgrade', function() {
        helper._showServiceUpgradedNotification(dbObj, { err: 'oops' });
        assert.deepEqual(notificationParams, {
          title: 'Error upgrading charm.',
          message: 'oops',
          level: 'error'
        });
      });

      it('shows a notification on a successful upgrade', function() {
        var service_name = 'ghost';
        var charm_url = 'local:precise/ghost-4';
        helper._showServiceUpgradedNotification(dbObj, {
          service_name: service_name,
          charm_url: charm_url
        });
        assert.deepEqual(notificationParams, {
          title: 'Charm upgrade accepted',
          message: 'Upgrade for "' + service_name + '" from "' +
              charm_url + '" accepted.',
          level: 'important'
        });
      });
    });

    describe('integration tests', function() {
      var envObj, fileObj, setCharmStub, uploadLocalCharmStub;

      beforeEach(function() {
        uploadLocalCharmStub = testUtils.makeStubFunction();
        setCharmStub = testUtils.makeStubFunction();
        envObj = {
          get: testUtils.makeStubFunction('precise'),
          uploadLocalCharm: uploadLocalCharmStub,
          setCharm: setCharmStub
        };
        fileObj = { name: 'foo', size: '100' };
      });

      it('deployLocalCharm: can be stopped when asking for series', function() {
        testUtils.makeContainer(this, 'content');
        var destroyVM = testUtils.makeStubMethod(
            Y.juju.viewlets.RequestSeries.prototype, 'destroyViewletManager');
        this._cleanups.push(destroyVM.reset);
        helper.deployLocalCharm(fileObj, envObj, dbObj);
        Y.one('.controls .cancel').simulate('click');
        // We are only testing that it gets to the destroy method. The request
        // series tests themselves test the methods internals.
        assert.equal(destroyVM.calledOnce(), true);
      });

      it('deployLocalCharm: can deploy a local charm', function() {
        testUtils.makeContainer(this, 'content');
        helper.deployLocalCharm(fileObj, envObj, dbObj);
        Y.one('.controls .confirm').simulate('click');
        assert.equal(uploadLocalCharmStub.calledOnce(), true);
        // loadCharmDetails calls the Charm model code, it's functionality is
        // tested in the unit tests.
        var loadCharmDetailsStub = testUtils.makeStubMethod(
            helper, 'loadCharmDetails');
        this._cleanups.push(loadCharmDetailsStub.reset);
        // Call the success callback for the env uploadLocalCharm call
        uploadLocalCharmStub.lastArguments()[3]({
          target: { responseText: '{"CharmURL":"local:precise/ghost-4"}' }
        });
        // Stub out the event firing to deploy the charm
        var fireStub = testUtils.makeStubMethod(Y, 'fire');
        this._cleanups.push(fireStub.reset);
        // Call the loadCharmDetails callback
        loadCharmDetailsStub.lastArguments()[2]();
        assert.equal(fireStub.calledOnce(), true);
      });

      it('upgradeServiceUsingLocalCharm: upgrade from local charm', function() {
        var localUrl = 'local:precise/ghost-4';
        var services = [{ get: testUtils.makeStubFunction(localUrl) }];
        helper.upgradeServiceUsingLocalCharm(services, fileObj, envObj, dbObj);
        assert.equal(uploadLocalCharmStub.calledOnce(), true);
        // loadCharmDetails calls the Charm model code, it's functionality is
        // tested in the unit tests.
        var loadCharmDetailsStub = testUtils.makeStubMethod(
            helper, 'loadCharmDetails');
        this._cleanups.push(loadCharmDetailsStub.reset);
        // Call the success callback for the env uploadLocalCharm call
        uploadLocalCharmStub.lastArguments()[3]({
          target: { responseText: '{"CharmURL":"local:precise/ghost-4"}' }
        });
        // Call the loadCharmDetails callback for the upgradeServices path.
        loadCharmDetailsStub.lastArguments()[2]({
          get: testUtils.makeStubFunction(localUrl)
        });
        assert.equal(setCharmStub.calledOnce(), true);
        // Call the setCharm callback
        setCharmStub.lastArguments()[3]({
          service_name: 'ghost',
          charm_url: localUrl
        });
        assert.deepEqual(notificationParams, {
          title: 'Charm upgrade accepted',
          message: 'Upgrade for "ghost" from "' +
              localUrl + '" accepted.',
          level: 'important'
        });
      });
    });

  });
})();
