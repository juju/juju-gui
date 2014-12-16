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
            Name: 'mongodb'
          },
          'extra-info': {
            'bzr-owner': 'hatch',
            'bzr-revisions': 5,
            'bzr-url': 'cs:precise/mongodb'
          },
          stats: {
            ArchiveDownloadCount: 10
          }
        }
      };
      var processed = charmstore._processEntityQueryData(data);
      assert.deepEqual(processed, {
        code_source: {
          location: 'cs:precise/mongodb'
        },
        downloads: 10,
        entityType: 'charm',
        id: 'cs:trusty/mongodb-9',
        is_approved: true,
        name: 'mongodb',
        owner: 'hatch',
        revisions: 5
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
            'archive/bundles.yaml.orig',
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
});
