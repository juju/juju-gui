/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

describe('jujulib charmstore', function() {
  var charmstore;

  beforeEach(function() {
    var bakery = {
      sendGetRequest: sinon.stub()
    }
    charmstore = new window.jujulib.charmstore('local/', 'v4', bakery);
  });

  afterEach(function() {
    charmstore = null;
  });


  it('can be instantiated with the proper config values', function() {
    assert.equal(charmstore.url, 'local/');
    assert.equal(charmstore.version, 'v4');
  });

  describe('_makeRequest', function() {

    it('calls the requestHandler to make a GET request', function() {
      charmstore._makeRequest('path', 'success', 'failure');
      assert.equal(charmstore.bakery.sendGetRequest.callCount, 1);
      charmstore.bakery.sendGetRequest.calledWith('path', 'success', 'failure');
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
      success = sinon.stub();
    });

    afterEach(function() {
      assert.equal(success.callCount, 1);
    });

    it('calls to process query response data for each record', function() {
      var process = sinon.stub(charmstore, '_processEntityQueryData');
      charmstore._transformQueryResults(success, response);
      assert.equal(process.callCount, 4);
    });

    it('can use a processing function to massage data', function() {
      charmstore._processEntityQueryData = function(entity) {
        return entity;
      };
      charmstore.processEntity = function (data) {
        if (data.entityType === 'charm') {
          return "It's a charm.";  
        } else {
          return "It's a bundle."; 
        }
      }
      charmstore._transformQueryResults(success, response);
      var models = success.lastCall.args[0];
      assert.equal(models[0], "It's a charm.");
      assert.equal(models[1], "It's a charm.");
      assert.equal(models[2], "It's a charm.");
      assert.equal(models[3], "It's a bundle.");
    });
  });

  describe('_lowerCaseKeys', function() {

    it('can recursively transform an objects keys to lowercase', function() {
      var uppercase = { Baz: '1', Foo: { Bar: { Baz: '1' }}};
      var host = {};
      charmstore._lowerCaseKeys(uppercase, host);
      assert.deepEqual(host, { baz: '1', foo: { bar: { baz: '1'}}});
    });

    it('can skip one level of keys in an object', function() {
      var uppercase = { Baz: '1', Foo: { Bar: { Baz: '1' }}, Fee: '2'};
      var host = {};
      charmstore._lowerCaseKeys(uppercase, host, 0);
      assert.deepEqual(host, { Baz: '1', Foo: { bar: { baz: '1'}}, Fee: '2'});
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
          'charm-related': {
            Requires: {
              'ceph-client': { id: 'cs:foo' }
            },
            Provides: {
              haproxy: { id: 'cs:bar' }
            }
          },
          'charm-config': {
            Options: {
              'foo-optn': {
                Default: 'foo',
                Description: 'foo is awesome',
                Type: 'String'
              },
              'barOptn': {
                Default: 'bar',
                Description: 'bar is less awesome',
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
        relatedCharms: {
          requires: {
            'ceph-client': { id: 'cs:foo' }
          },
          provides: {
            haproxy: { id: 'cs:bar' }
          }
        },
        options: {
          'foo-optn': {
            'default': 'foo',
            description: 'foo is awesome',
            type: 'String'
          },
          'barOptn': {
            'default': 'bar',
            description: 'bar is less awesome',
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

  describe('search', function() {
    var generatePath, makeRequest;

    beforeEach(function() {
      generatePath = sinon.stub(charmstore, '_generatePath').returns('path');
      makeRequest = sinon.stub(charmstore, '_makeRequest');
    });

    it('accepts custom filters & calls to generate an api path', function() {
      charmstore.search({ text: 'foo' });
      assert.equal(generatePath.callCount, 1, 'generatePath not called');
      assert.deepEqual(generatePath.lastCall.args, [
        'search',
        'text=foo&' +
            'limit=30&' +
            'include=charm-metadata&' +
            'include=charm-config&' +
            'include=bundle-metadata&' +
            'include=extra-info&' +
            'include=stats']);
    });

    it('accepts a custom limit when generating an api path', function() {
      charmstore.search({ text: 'foo' }, null, null, 99);
      assert.equal(generatePath.callCount, 1, 'generatePath not called');
      assert.deepEqual(generatePath.lastCall.args, [
        'search',
        'text=foo&' +
            'limit=99&' +
            'include=charm-metadata&' +
            'include=charm-config&' +
            'include=bundle-metadata&' +
            'include=extra-info&' +
            'include=stats']);
    });

    it('calls to make a valid charmstore request', function() {
      var transform = sinon.stub(charmstore, '_transformQueryResults');
      charmstore.search({}, 'success', 'failure');
      assert.equal(makeRequest.callCount, 1, 'makeRequest not called');
      var makeRequestArgs = makeRequest.lastCall.args;
      assert.equal(makeRequestArgs[0], 'path');
      assert.equal(typeof makeRequestArgs[1], 'function');
      assert.equal(makeRequestArgs[2], 'failure');
      // Call the success handler to make sure it's passed the success handler.
      makeRequestArgs[1]();
      assert.equal(transform.lastCall.args[0], 'success');
    });
  });

  describe('getDiagramURL', function() {
    it('can generate a URL for a bundle diagram', function() {
      assert.equal(charmstore.getDiagramURL('apache2'),
          'local/v4/apache2/diagram.svg');
    });
  });

  describe('getBundleYAML', function() {
    var success, failure;

    beforeEach(function() {
      success = sinon.stub();
      failure = sinon.stub();
    });

    it('calls to get the bundle entity', function() {
      var getEntity = sinon.stub(charmstore, 'getEntity');
      var response = sinon.stub(charmstore, '_getBundleYAMLResponse');
      var bundleId = 'bundle/elasticsearch';
      charmstore.getBundleYAML(bundleId, success, failure);
      var getEntityArgs = getEntity.lastCall.args;
      assert.equal(getEntity.callCount, 1);
      assert.equal(getEntityArgs[0], bundleId);
      getEntityArgs[1](); // Should be a bound copy of _getBundleYAMLResponse.
      // We need to make sure it's bound with the proper callbacks.
      var responseArgs = response.lastCall.args;
      responseArgs[0](); // Should be the success callback.
      assert.equal(success.callCount, 1);
      responseArgs[1](); // Should be the failure callback.
      assert.equal(failure.callCount, 1);
      getEntityArgs[2](); // Should be the failure callback.
      assert.equal(failure.callCount, 2);
    });

    it('_getBundleYAMLResponse fetches yaml file contents', function() {
      var getStub = sinon.stub().returns('deployer file');
      var makeRequest = sinon.stub(charmstore, '_makeRequest');
      charmstore._getBundleYAMLResponse(success, failure, [{ get: getStub }]);
      assert.equal(getStub.callCount, 1);
      var requestArgs = makeRequest.lastCall.args;
      assert.equal(requestArgs[0], 'deployer file');
      // Should be the anon success callback handler.
      requestArgs[1]({
        currentTarget: {
          responseText: 'yaml'
        }
      });
      assert.equal(success.callCount, 1);
      assert.equal(success.lastCall.args[0], 'yaml');
      requestArgs[2](); // Should be the failure handler.
      assert.equal(failure.callCount, 1);
    });
  });

  describe('getAvailableVersions', function() {
    var request;

    beforeEach(function() {
      request = sinon.stub(charmstore, '_makeRequest');
    });

    it('makes a request to fetch the ids', function() {
      charmstore.getAvailableVersions('cs:precise/ghost-5');
      assert.equal(request.callCount, 1);
    });

    it('calls the success handler with a list of charm ids', function(done) {
      var success = function(list) {
        // If it gets here then it has successfully called.
        assert.deepEqual(list, ['cs:precise/ghost-4']);
        done();
      };
      var failure = function() {
        assert.fail('Failure callback should not be called');
      };
      charmstore.getAvailableVersions('cs:precise/ghost-5', success, failure);
      var requestArgs = request.lastCall.args;
      // The path should not have cs: in it.
      assert.equal(requestArgs[0], 'local/v4/precise/ghost-5/expand-id');
      // Call the makeRequest success handler simulating a response object;
      requestArgs[1](
          {currentTarget: { responseText: '[{"Id": "cs:precise/ghost-4"}]'}});
    });

    it('calls the failure handler for json parse failures', function(done) {
      var success = function(list) {
        assert.fail('Success callback should not be called');
      };
      var failure = function() {
        // If it gets here then it has successfully called.
        done();
      };
      charmstore.getAvailableVersions('cs:precise/ghost-5', success, failure);
      // Call the makeRequest success handler simulating a response object;
      request.lastCall.args[1](
          {currentTarget: { responseText: '[notvalidjson]'}});
    });
  });
});
