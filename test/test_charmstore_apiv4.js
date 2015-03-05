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

describe('Charmstore API v4', function() {
  var APIv4, charmstore, utils, Y;

  before(function(done) {
    var modules = ['charmstore-api', 'juju-tests-utils'];
    Y = YUI(GlobalConfig).use(modules, function(Y) {
      APIv4 = Y.juju.charmstore.APIv4;
      utils = Y['juju-tests'].utils;
      done();
    });
  });

  beforeEach(function() {
    charmstore = new APIv4({
      env: {
        getLocalCharmFileUrl: utils.makeStubFunction('localcharmpath')
      },
      charmstoreURL: 'local/'
    });
  });

  afterEach(function() {
    charmstore = null;
  });

  it('can be instantiated with the proper config values', function() {
    assert.equal(charmstore.charmstoreURL, 'local/');
    assert.equal(charmstore.apiPath, 'v4');
    assert.equal(
        charmstore.requestHandler instanceof Y.juju.environments.web.WebHandler,
        true);
  });

  describe('_makeRequest', function() {

    it('calls the requestHandler to make a GET request', function() {
      var getRequest = utils.makeStubMethod(
          charmstore.requestHandler, 'sendGetRequest');
      var requestHandler = utils.makeStubMethod(charmstore, '_requestHandler');
      this._cleanups.concat([
        getRequest.reset,
        requestHandler.reset
      ]);
      charmstore._makeRequest('path', 'success', 'failure');
      assert.equal(getRequest.callCount(), 1);
      var getArgs = getRequest.lastArguments();
      assert.equal(getArgs[0], 'path');
      assert.strictEqual(getArgs[1], null);
      assert.strictEqual(getArgs[2], null);
      assert.strictEqual(getArgs[3], null);
      assert.strictEqual(getArgs[4], null);
      // Make sure that the request handler is called with the callbacks.
      getArgs[5]();
      assert.equal(requestHandler.callCount(), 1);
      assert.deepEqual(requestHandler.lastArguments(), [
        'success', 'failure']);
    });
  });

  describe('_requestHandler', function() {
    var success, failure;

    beforeEach(function() {
      success = utils.makeStubFunction();
      failure = utils.makeStubFunction();
    });

    it('calls the failure callback if status > 400', function() {
      charmstore._requestHandler(success, failure, {
        target: { status: 404 }
      });
      assert.equal(success.callCount(), 0);
      assert.equal(failure.callCount(), 1);
    });

    it('calls the success callback if status < 400', function() {
      charmstore._requestHandler(success, failure, {
        target: { status: 200 }
      });
      assert.equal(success.callCount(), 1);
      assert.equal(failure.callCount(), 0);
    });
  });

  describe('_generatePath', function() {

    it('generates a valid url using provided args', function() {
      var path = charmstore._generatePath('search/', 'text=foo');
      assert.equal(path, 'local/v4/search/?text=foo');
    });
  });

  describe('_transformQueryResults', function() {
    var responseText = JSON.stringify({
      Results: [
        { entityType: 'charm', id: 'cs:precise/foo',
          Id: 'cs:precise/foo',
          Meta: { 'extra-info' : { 'bzr-owner': ''}}},
        { entityType: 'charm', id: 'cs:~charmers/precise/foo',
          Id: 'cs:~charmers/precise/foo',
          Meta: { 'extra-info' : { 'bzr-owner': 'charmers'}}},
        { entityType: 'charm', id: 'cs:~juju-gui-charmers/precise/foo',
          Id: 'cs:~juju-gui-charmers/precise/foo',
          Meta: { 'extra-info' : { 'bzr-owner': 'juju-gui-charmers'}}},
        { entityType: 'bundle', id: 'cs:bundle/foo',
          Id: 'cs:bundle/foo',
          Meta: { 'extra-info' : { 'bzr-owner': ''}}}
      ]});
    var success;
    var response = { target: { responseText: responseText } };

    beforeEach(function() {
      success = utils.makeStubFunction();
    });

    afterEach(function() {
      assert.equal(success.callCount(), 1);
    });

    it('calls to process query response data for each record', function() {
      var process = utils.makeStubMethod(
          charmstore, '_processEntityQueryData', {});
      this._cleanups.push(process.reset);
      charmstore._transformQueryResults(success, response);
      // If this is only called twice that means it has correctly skipped the
      // ~charmers records.
      assert.equal(process.callCount(), 2);
    });

    it('can generate a charm and bundle model', function() {
      charmstore._processEntityQueryData = function(entity) {
        return entity;
      };
      charmstore._transformQueryResults(success, response);
      var models = success.lastArguments()[0];
      assert.equal(models[0] instanceof Y.juju.models.Charm, true);
      assert.equal(models[1] instanceof Y.juju.models.Bundle, true);
    });
  });

  describe('_lowerCaseKeys', function() {

    it('can recursively transform an objects keys to lowercase', function() {
      var uppercase = { Baz: '1', Foo: { Bar: { Baz: '1' }}};
      var host = {};
      charmstore._lowerCaseKeys(uppercase, host);
      assert.deepEqual(host, { baz: '1', foo: { bar: { baz: '1'}}});
    });
  });

  describe('_processEntityQueryData', function() {

    it('can properly transform v4 charm data to v3', function() {
      var data = {
        Id: 'cs:trusty/mongodb-9',
        Meta: {
          'charm-metadata': {
            Name: 'mongodb',
            Provides: {
              db: {
                'Name': 'db',
                'Role': 'requirer',
                'Interface': 'mongo',
                'Optional': false,
                'Limit': 1,
                'Scope': 'global'
              }
            }
          },
          'extra-info': {
            'bzr-owner': 'hatch',
            'bzr-revisions': 5,
            'bzr-url': 'cs:precise/mongodb'
          },
          'charm-config': {
            Options: {
              'foo-optn': {
                Default: 'foo',
                Description: 'foo is awesome',
                Type: 'String'
              }
            }
          },
          stats: {
            ArchiveDownloadCount: 10
          }
        }
      };
      var processed = charmstore._processEntityQueryData(data);
      assert.deepEqual(processed, {
        id: 'cs:trusty/mongodb-9',
        downloads: 10,
        entityType: 'charm',
        is_approved: true,
        is_subordinate: false,
        owner: 'hatch',
        revisions: 5,
        code_source: {
          location: 'cs:precise/mongodb'
        },
        name: 'mongodb',
        relations: {
          provides: {
            db: {
              'name': 'db',
              'role': 'requirer',
              'interface': 'mongo',
              'optional': false,
              'limit': 1,
              'scope': 'global'
            }
          },
          requires: {}
        },
        options: {
          'foo-optn': {
            'default': 'foo',
            description: 'foo is awesome',
            type: 'String'
          }
        }
      });
    });

    it('can properly transform v4 bundle data to v3', function() {
      var data = {
        Id: 'cs:~charmers/bundle/mongodb-cluster-4',
        Meta: {
          'bundle-metadata': {
            'Services': ''
          },
          'extra-info': {
            'bzr-owner': 'hatch',
            'bzr-revisions': 5,
            'bzr-url': 'lp:~charmers/charms/bundles/mongodb-cluster/bundle'
          },
          stats: {
            ArchiveDownloadCount: 10
          }
        }
      };
      var processed = charmstore._processEntityQueryData(data);
      assert.deepEqual(processed, {
        code_source: {
          location: 'lp:~charmers/charms/bundles/mongodb-cluster/bundle'
        },
        deployerFileUrl: 'local/v4/~charmers/bundle/mongodb-cluster-4/' +
            'archive/bundle.yaml',
        downloads: 10,
        entityType: 'bundle',
        id: 'cs:~charmers/bundle/mongodb-cluster-4',
        is_approved: false,
        name: 'mongodb-cluster',
        owner: 'hatch',
        revisions: 5,
        services: ''
      });
    });
  });

  describe('getIconpath', function() {

    it('returns local default bundle icon location for bundles', function() {
      var path = charmstore.getIconPath('bundle:elasticsearch', true);
      assert.equal(path, '/juju-ui/assets/images/non-sprites/bundle.svg');
    });

    it('returns a qualified charmstoreURL icon location', function() {
      var path = charmstore.getIconPath('~paulgear/precise/quassel-core-2');
      assert.equal(
          path,
          'local/v4/~paulgear/precise/quassel-core-2/icon.svg');
    });
  });

  describe('search', function() {
    var generatePath, makeRequest;

    beforeEach(function() {
      generatePath = utils.makeStubMethod(charmstore, '_generatePath', 'path');
      makeRequest = utils.makeStubMethod(charmstore, '_makeRequest');
      this._cleanups.concat([
        generatePath.reset,
        makeRequest.reset
      ]);
    });

    it('accepts custom filters & calls to generate an apiv4 path', function() {
      charmstore.search({ text: 'foo' });
      assert.equal(generatePath.callCount(), 1, 'generatePath not called');
      assert.deepEqual(generatePath.lastArguments(), [
        'search',
        'text=foo&' +
            'limit=30&' +
            'include=charm-metadata&' +
            'include=charm-config&' +
            'include=bundle-metadata&' +
            'include=extra-info&' +
            'include=stats']);
    });

    it('calls to make a valid charmstore v4 request', function() {
      var transform = utils.makeStubMethod(
          charmstore, '_transformQueryResults');
      this._cleanups.push(transform.reset);
      charmstore.search({}, 'success', 'failure');
      assert.equal(makeRequest.callCount(), 1, 'makeRequest not called');
      var makeRequestArgs = makeRequest.lastArguments();
      assert.equal(makeRequestArgs[0], 'path');
      assert.equal(typeof makeRequestArgs[1], 'function');
      assert.equal(makeRequestArgs[2], 'failure');
      // Call the success handler to make sure it's passed the success handler.
      makeRequestArgs[1]();
      assert.equal(transform.lastArguments()[0], 'success');
    });
  });

  describe('getBundleYAML', function() {
    var success, failure;

    beforeEach(function() {
      success = utils.makeStubFunction();
      failure = utils.makeStubFunction();
    });

    it('calls to get the bundle entity', function() {
      var getEntity = utils.makeStubMethod(charmstore, 'getEntity');
      var response = utils.makeStubMethod(charmstore, '_getBundleYAMLResponse');
      var bundleId = 'bundle/elasticsearch';
      charmstore.getBundleYAML(bundleId, success, failure);
      var getEntityArgs = getEntity.lastArguments();
      assert.equal(getEntity.callCount(), 1);
      assert.equal(getEntityArgs[0], bundleId);
      getEntityArgs[1](); // Should be a bound copy of _getBundleYAMLResponse.
      // We need to make sure it's bound with the proper callbacks.
      var responseArgs = response.lastArguments();
      responseArgs[0](); // Should be the success callback.
      assert.equal(success.callCount(), 1);
      responseArgs[1](); // Should be the failure callback.
      assert.equal(failure.callCount(), 1);
      getEntityArgs[2](); // Should be the failure callback.
      assert.equal(failure.callCount(), 2);
    });

    it('_getBundleYAMLResponse fetches yaml file contents', function() {
      var getStub = utils.makeStubFunction('deployer file');
      var makeRequest = utils.makeStubMethod(charmstore, '_makeRequest');
      charmstore._getBundleYAMLResponse(success, failure, [{ get: getStub }]);
      assert.equal(getStub.callCount(), 1);
      var requestArgs = makeRequest.lastArguments();
      assert.equal(requestArgs[0], 'deployer file');
      // Should be the anon success callback handler.
      requestArgs[1]({
        currentTarget: {
          responseText: 'yaml'
        }
      });
      assert.equal(success.callCount(), 1);
      assert.equal(success.lastArguments()[0], 'yaml');
      requestArgs[2](); // Should be the failure handler.
      assert.equal(failure.callCount(), 1);
    });
  });

  describe('downConvertBundleYAML', function() {
    it('wraps a supplied bundle yaml', function() {
      var wrapped = charmstore.downConvertBundleYAML('bundle:\n  test');
      assert.equal(wrapped, '"bundle-deploy": \n  bundle: test\n');
    });
  });
});
