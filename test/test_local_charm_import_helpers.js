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
        'juju-tests-utils'];
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

        stubs = {
          // The order of these Y.x stubs is important, without this order the
          // Y.one stub will return the same value as the Y.Node.create stub
          createStub: testUtils.makeStubMethod(Y.Node, 'create', template),
          oneStub: testUtils.makeStubMethod(Y, 'one', container),
          templateStub: testUtils.makeStubMethod(
              Y.namespace('juju.views.Templates'), 'service-inspector'),
          // Viewlet manager stubs
          ViewletManager: testUtils.makeStubMethod(
              Y.namespace('juju.viewlets'), 'ViewletManager'),
          // Local charm helper stubs
          attachEventsStub: testUtils.makeStubMethod(
              helper, '_attachViewletEvents')
        };

        stubs.renderStub = testUtils.makeStubMethod(
            stubs.ViewletManager.prototype, 'render');
        stubs.showViewletStub = testUtils.makeStubMethod(
            stubs.ViewletManager.prototype, 'showViewlet');
      });

      afterEach(function() {
        Object.keys(stubs).forEach(function(key) {
          stubs[key].reset();
        });
        stubs = {};
      });

      it('renders the viewletManager', function() {
        helper._requestSeries(fileObj, envObj, dbObj);

        assert.equal(stubs.templateStub.called(), true);
        assert.equal(stubs.oneStub.called(), true);
        assert.equal(stubs.ViewletManager.called(), true);
        assert.isObject(stubs.ViewletManager.lastArguments()[0]);
        assert.equal(stubs.renderStub.called(), true);
        assert.equal(stubs.showViewletStub.called(), true);
        assert.equal(stubs.showViewletStub.lastArguments()[0], 'requestSeries');
        assert.equal(stubs.attachEventsStub.called(), true);
      });

      it('calls _attachViewletEvents()', function() {
        helper._requestSeries(fileObj, envObj, dbObj);

        assert.equal(stubs.attachEventsStub.called(), true);
        var args = stubs.attachEventsStub.lastArguments();
        assert.equal(args[0] instanceof stubs.ViewletManager, true);
        assert.deepEqual(args[1], fileObj);
        assert.deepEqual(args[2], envObj);
        assert.deepEqual(args[3], dbObj);
      });
    });

    describe('_attachViewletEvents', function() {
      it('attaches events to the upload and cancel buttons', function() {
        var viewletManager = {},
            fileObj = { name: 'foo', size: '100' },
            envObj = {};
        // Because there are a bunch of chained methods we need to create a
        // nested method structure which we can then inspect.
        var stubOnFn = testUtils.makeStubFunction();
        var stubOn = testUtils.makeStubMethod(stubOnFn, 'on');
        var stubOneFn = testUtils.makeStubFunction();
        var stubOne = testUtils.makeStubMethod(stubOneFn, 'one', stubOnFn);
        var stubGet = testUtils.makeStubMethod(
            viewletManager, 'get', stubOneFn);

        helper._attachViewletEvents(viewletManager, fileObj, envObj, dbObj);

        assert.equal(stubGet.called(), true);
        assert.equal(stubOne.callCount(), 2, 'stubOne not called twice.');
        assert.equal(stubOn.callCount(), 2, 'stubOn not called twice');
        var stubOneArgs = stubOne.allArguments();
        assert.equal(stubOneArgs[0][0], 'button.cancel');
        assert.equal(stubOneArgs[1][0], 'button.confirm');
        // Because on() gets called twice we get all of the arguments from each
        // call and then check those against their required values.
        var stubOnArgs = stubOn.allArguments();
        // first pass
        assert.equal(stubOnArgs[0][0], 'click');
        assert.isFunction(stubOnArgs[0][1]);
        assert.isNull(stubOnArgs[0][2]);
        assert.deepEqual(stubOnArgs[0][3], viewletManager);
        assert.isArray(stubOnArgs[0][4]);
        // second pass
        assert.equal(stubOnArgs[1][0], 'click');
        assert.isFunction(stubOnArgs[1][1]);
        assert.isNull(stubOnArgs[1][2]);
        assert.deepEqual(stubOnArgs[1][3], viewletManager);
        assert.isArray(stubOnArgs[1][4]);
        assert.deepEqual(stubOnArgs[1][5], fileObj);
        assert.deepEqual(stubOnArgs[1][6], envObj);
        assert.deepEqual(stubOnArgs[1][7], dbObj);

      });
    });

    describe('_cleanUp', function() {
      it('cleans up the Viewlet Manager and it\'s events', function() {
        var viewletManagerFn = testUtils.makeStubFunction();
        var destroyStub = testUtils.makeStubMethod(viewletManagerFn, 'destroy');
        var handlersFn = testUtils.makeStubFunction();
        var forEachStub = testUtils.makeStubMethod(handlersFn, 'forEach');

        helper._cleanUp(null, viewletManagerFn, handlersFn);

        // Make sure that it destroys the viewlet manager
        assert.equal(destroyStub.called(), true);
        assert.equal(forEachStub.called(), true);
        var args = forEachStub.lastArguments();
        assert.isFunction(args[0]);
        var eventFn = testUtils.makeStubFunction();
        var detachStub = testUtils.makeStubMethod(eventFn, 'detach');
        args[0](eventFn);
        // checks to make sure that it calls the detach method of the event
        // objects passed in via the handlers.
        assert.equal(detachStub.called(), true);
      });
    });

    describe('_uploadLocalCharm', function() {
      var stubs = {}, fileObj, defSeries;

      beforeEach(function() {
        fileObj = { name: 'foo' };
        defSeries = 'precise';

        stubs = {
          seriesStub: testUtils.makeStubMethod(
              helper, '_getSeriesValue', defSeries),
          cleanUpStub: testUtils.makeStubMethod(helper, '_cleanUp'),
          localCharmLoadStub: testUtils.makeStubMethod(
              helper, '_uploadLocalCharmLoad')
        };

        stubs.envFn = testUtils.makeStubFunction();
        stubs.uploadLocalCharmStub = testUtils.makeStubMethod(
            stubs.envFn, 'uploadLocalCharm');
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
        helper._uploadLocalCharm(null, null, null, fileObj, stubs.envFn, dbObj);
        assert.equal(stubs.seriesStub.called(), true);
        assert.equal(stubs.cleanUpStub.called(), true);
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
      });

      it('calls the _getSeriesValue() method', function() {
        var vmgr = 'viewlet manager';
        helper._uploadLocalCharm(null, vmgr, null, fileObj, stubs.envFn, dbObj);
        assert.equal(stubs.seriesStub.called(), true);
        assert.equal(stubs.seriesStub.lastArguments()[0], vmgr);
      });

      it('calls the _cleanUp() method', function() {
        var vmgr = 'viewlet manager',
            hndl = 'handlers';
        helper._uploadLocalCharm(null, vmgr, hndl, fileObj, stubs.envFn, dbObj);
        assert.equal(stubs.cleanUpStub.called(), true);
        var args = stubs.cleanUpStub.lastArguments();
        assert.isNull(args[0]);
        assert.equal(args[1], vmgr);
        assert.equal(args[2]. hndl);
      });
    });

    describe('_getSeriesValue', function() {
      it('gets the series value from the viewlets input', function(done) {
        var viewletManager = {
          get: function(val) {
            assert.equal(val, 'container');
            return {
              one: function(val) {
                assert.equal(val, 'input[defaultSeries]');
                return {
                  get: function(val) {
                    assert.equal(val, 'value');
                    done();
                  }
                };
              }
            };
          }
        };
        helper._getSeriesValue(viewletManager);
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

        helper._uploadLocalCharmLoad(fileObj, envObj, dbObj, eventObj);
        assert.equal(loadCharmDetailsStub.called(), true);
      });

      it('calls loadsCharmDetails() on successful upload', function() {
        var charmURLString = 'foo',
            fileObj = { name: 'foo' },
            eventObj = { target: { responseText: '' }},
            envObj = {};

        var loadCharmDetailsStub = stubLoadCharmDetails(this);
        stubParseUploadResponse(this);

        helper._uploadLocalCharmLoad(fileObj, envObj, dbObj, eventObj);

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

            helper._uploadLocalCharmLoad(fileObj, envObj, dbObj, eventObj);
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

        helper._uploadLocalCharmLoad(fileObj, envObj, dbObj, eventObj);
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

        helper._uploadLocalCharmLoad(fileObj, envObj, dbObj, eventObj);
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

  });
})();
