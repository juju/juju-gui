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
      it('requests an upload from the environment', function(done) {
        var fileObj = { name: 'foo' },
            defSeries = 'precise',
            reqAttr = 'defaultSeries',
            envObj = {
              uploadLocalCharm: function(file, series, progress, callback) {
                assert.deepEqual(file, fileObj);
                assert.equal(series, defSeries);
                assert.isFunction(progress);
                assert.isFunction(callback);
                // Test to make sure that the callback is called with the
                // correct arguments.
                callback();
                // called the proper env method
                done();
              },
              get: function(attr) {
                assert.equal(attr, reqAttr);
                return defSeries;
              }
            };

        var stub = testUtils.makeStubMethod(helper, '_uploadLocalCharmLoad');
        helper.deployLocalCharm(fileObj, envObj, dbObj);
        var args = stub.lastArguments();
        assert.deepEqual(args[0], fileObj);
        assert.deepEqual(args[1], envObj);
        assert.deepEqual(args[2], dbObj);
        stub.reset();
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
