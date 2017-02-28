/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

describe('jujulib charmstore', function() {
  var charmstore;

  beforeEach(function() {
    var bakery = {
      sendGetRequest: sinon.stub()
    };
    charmstore = new window.jujulib.charmstore('local/', bakery);
  });

  afterEach(function() {
    charmstore = null;
  });

  it('can be instantiated with the proper config values', function() {
    assert.strictEqual(charmstore.url, 'local/v5');
  });

  it('is smart enough to handle missing trailing slash in URL', function() {
    var bakery = {};
    charmstore = new window.jujulib.charmstore('http://example.com', bakery);
    assert.strictEqual(charmstore.url, 'http://example.com/v5');
  });

  describe('_generatePath', function() {

    it('generates a valid url using provided args', function() {
      var path = charmstore._generatePath('search/', 'text=foo');
      assert.equal(path, 'local/v5/search/?text=foo');
    });
  });

  describe('getLogoutUrl', function() {
    it('returns a valid logout url', function() {
      var path = charmstore.getLogoutUrl();
      assert.equal(path, 'local/v5/logout');
    });
  });

  describe('_transformQueryResults', function() {
    var data = {
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
      ]};
    var cb;

    beforeEach(function() {
      cb = sinon.stub();
    });

    afterEach(function() {
      assert.equal(cb.callCount, 1);
    });

    it('calls to process query response data for each record', function() {
      var process = sinon.stub(charmstore, '_processEntityQueryData');
      charmstore._transformQueryResults(cb, null, data);
      assert.equal(process.callCount, 4);
    });

    it('can use a processing function to massage data', function() {
      charmstore._processEntityQueryData = function(entity) {
        return entity;
      };
      charmstore.processEntity = function (data) {
        if (data.entityType === 'charm') {
          return 'It\'s a charm.';
        } else {
          return 'It\'s a bundle.';
        }
      };
      charmstore._transformQueryResults(cb, null, data);
      var models = cb.lastCall.args[1];
      assert.equal(models[0], 'It\'s a charm.');
      assert.equal(models[1], 'It\'s a charm.');
      assert.equal(models[2], 'It\'s a charm.');
      assert.equal(models[3], 'It\'s a bundle.');
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

    it('can properly transform v5 charm data', function() {
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
          'owner': {
            User: 'hatch'
          },
          'extra-info': {
            'bzr-revisions': 5,
            'bzr-url': 'cs:precise/mongodb'
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
          'charm-metrics': {
            Metrics: {
              metric: 'metric'
            }
          },
          stats: {
            ArchiveDownloadCount: 10
          },
          'supported-series': {
            SupportedSeries: [
              'precise',
              'trusty'
            ]
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
        metrics: {
          metric: 'metric'
        },
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
          },
          'barOptn': {
            'default': 'bar',
            description: 'bar is less awesome',
            type: 'String'
          }
        },
        series: ['precise', 'trusty']
      });
    });

    it('handles missing extra-info data', function() {
      var data = {
        Id: 'cs:trusty/mongodb-9',
        Meta: {
          'charm-metadata': {
            Name: 'mongodb',
            Provides: {}
          },
          'extra-info': {},
          'charm-config': {Options: {}},
          stats: {ArchiveDownloadCount: 42}
        }
      };
      var processed = charmstore._processEntityQueryData(data);
      assert.strictEqual(processed.owner, undefined);
      assert.strictEqual(processed.code_source.location, undefined);
      assert.deepEqual(processed.revisions, []);
    });

    it('can properly transform v4 bundle data', function() {
      var data = {
        Id: 'cs:~charmers/bundle/mongodb-cluster-4',
        Meta: {
          'bundle-metadata': {
            'Services': ''
          },
          'bundle-unit-count': {
            'Count': 7
          },
          owner: {
            User: 'hatch'
          },
          'extra-info': {
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
        deployerFileUrl: 'local/v5/~charmers/bundle/mongodb-cluster-4/' +
            'archive/bundle.yaml',
        downloads: 10,
        entityType: 'bundle',
        id: 'cs:~charmers/bundle/mongodb-cluster-4',
        is_approved: false,
        name: 'mongodb-cluster',
        owner: 'hatch',
        revisions: 5,
        services: '',
        unitCount: 7
      });
    });
  });

  describe('search', function() {
    var generatePath;

    beforeEach(function() {
      generatePath = sinon.stub(charmstore, '_generatePath').returns('path');
    });

    it('accepts custom filters & calls to generate an api path', function() {
      charmstore.search({ text: 'foo' });
      assert.equal(generatePath.callCount, 1, 'generatePath not called');
      assert.deepEqual(generatePath.lastCall.args, [
        'search',
        'text=foo&' +
            'limit=30&' +
            'autocomplete=1&' +
            'include=charm-metadata&' +
            'include=charm-config&' +
            'include=supported-series&' +
            'include=bundle-metadata&' +
            'include=extra-info&' +
            'include=tags&' +
            'include=owner&' +
            'include=stats']);
    });

    it('accepts a custom limit when generating an api path', function() {
      charmstore.search({ text: 'foo' }, null, 99);
      assert.equal(generatePath.callCount, 1, 'generatePath not called');
      assert.deepEqual(generatePath.lastCall.args, [
        'search',
        'text=foo&' +
            'limit=99&' +
            'autocomplete=1&' +
            'include=charm-metadata&' +
            'include=charm-config&' +
            'include=supported-series&' +
            'include=bundle-metadata&' +
            'include=extra-info&' +
            'include=tags&' +
            'include=owner&' +
            'include=stats']);
    });

    it('calls to make a valid charmstore request', function() {
      var transform = sinon.stub(charmstore, '_transformQueryResults');
      charmstore.search({}, 'cb');
      assert.equal(
          charmstore.bakery.sendGetRequest.callCount, 1,
          'sendGetRequest not called');
      var requestArgs = charmstore.bakery.sendGetRequest.lastCall.args;
      var successCb = requestArgs[1];
      assert.equal(requestArgs[0], 'path');
      // Call the success handler to make sure it's passed the callback.
      successCb({target: {responseText: '{}'}});
      assert.equal(transform.lastCall.args[0], 'cb');
    });
  });

  describe('list', function() {
    var generatePath;

    beforeEach(function() {
      generatePath = sinon.stub(charmstore, '_generatePath').returns('path');
    });

    it('accepts an author & calls to generate an api path', function() {
      charmstore.list('test-author', 'cb');
      assert.equal(generatePath.callCount, 1, 'generatePath not called');
      assert.deepEqual(generatePath.lastCall.args, [
        'list',
        'owner=test-author&' +
            'type=charm&' +
            'include=charm-metadata&' +
            'include=bundle-metadata&' +
            'include=bundle-unit-count&' +
            'include=extra-info&' +
            'include=supported-series&' +
            'include=stats']);
    });

    it('can list bundles', function() {
      charmstore.list('test-author', 'cb', 'bundle');
      var qs = generatePath.lastCall.args[1];
      assert.equal(qs.indexOf('type=bundle') > -1, true,
                   'bundle not set in query string');
    });

    it('calls to make a valid charmstore request', function() {
      var transform = sinon.stub(charmstore, '_transformQueryResults');
      charmstore.list('test-author', 'cb');
      assert.equal(
          charmstore.bakery.sendGetRequest.callCount, 1,
          'sendGetRequest not called');
      var requestArgs = charmstore.bakery.sendGetRequest.lastCall.args;
      var successCb = requestArgs[1];
      assert.equal(requestArgs[0], 'path');
      // Call the success handler to make sure it's passed the callback.
      successCb({target: {responseText: '{}'}});
      assert.equal(transform.lastCall.args[0], 'cb');
    });
  });

  describe('getDiagramURL', function() {
    it('can generate a URL for a bundle diagram', function() {
      assert.equal(charmstore.getDiagramURL('apache2'),
          'local/v5/apache2/diagram.svg');
    });
  });

  describe('getBundleYAML', function() {
    var cb;

    beforeEach(function() {
      cb = sinon.stub();
    });

    it('calls to get the bundle entity', function() {
      var getEntity = sinon.stub(charmstore, 'getEntity');
      var response = sinon.stub(charmstore, '_getBundleYAMLResponse');
      var bundleId = 'bundle/elasticsearch';
      charmstore.getBundleYAML(bundleId, cb);
      var getEntityArgs = getEntity.lastCall.args;
      assert.equal(getEntity.callCount, 1);
      assert.equal(getEntityArgs[0], bundleId);
      getEntityArgs[1](); // Should be a bound copy of _getBundleYAMLResponse.
      // We need to make sure it's bound with the callback.
      var responseArgs = response.lastCall.args;
      responseArgs[0](); // Should be the callback.
      assert.equal(cb.callCount, 1);
    });

    it('_getBundleYAMLResponse fetches yaml file contents', function() {
      charmstore._getBundleYAMLResponse(
          cb, null, [{ deployerFileUrl: 'deployer file' }]);
      var requestArgs = charmstore.bakery.sendGetRequest.lastCall.args;
      assert.equal(requestArgs[0], 'deployer file');
      // Should be the anon success callback handler.
      requestArgs[1]({
        target: {
          responseText: 'yaml'
        }
      });
      assert.equal(cb.callCount, 1);
      assert.equal(cb.lastCall.args[1], 'yaml');
    });
  });

  describe('getAvailableVersions', function() {
    it('makes a request to fetch the ids', function() {
      charmstore.getAvailableVersions('cs:precise/ghost-5');
      assert.equal(charmstore.bakery.sendGetRequest.callCount, 1);
    });

    it('calls the success handler with a list of charm ids', function(done) {
      var cb = function(error, list) {
        // If it gets here then it has successfully called.
        if (error) {
          assert.fail('callback should not fail.');
        }
        assert.deepEqual(list, ['cs:precise/ghost-4']);
        done();
      };
      charmstore.getAvailableVersions('cs:precise/ghost-5', cb);
      var requestArgs = charmstore.bakery.sendGetRequest.lastCall.args;
      // The path should not have cs: in it.
      assert.equal(requestArgs[0], 'local/v5/precise/ghost-5/expand-id');
      // Call the makeRequest success handler simulating a response object;
      requestArgs[1](
          {target: { responseText: '[{"Id": "cs:precise/ghost-4"}]'}});
    });

    it('calls the failure handler for json parse failures', function(done) {
      var cb = function(error, list) {
        if (error) {
          done();
        } else {
          assert.fail('callback should not succeed.');
        }
      };
      charmstore.getAvailableVersions('cs:precise/ghost-5', cb);
      // Call the makeRequest success handler simulating a response object;
      charmstore.bakery.sendGetRequest.lastCall.args[1](
          {target: { responseText: '[notvalidjson]'}});
    });
  });

  describe('whoami', function() {
    it('queries who the current user is', function() {
      charmstore.whoami();
      assert.equal(charmstore.bakery.sendGetRequest.callCount, 1);
    });

    it('calls the success handler with an auth object', function(done) {
      var cb = function(error, auth) {
        // If it gets here then it has successfully called.
        if (error) {
          assert.fail('callback should not fail.');
        }
        assert.deepEqual(auth, {user: 'test', groups: []});
        done();
      };
      charmstore.whoami(cb);
      var requestArgs = charmstore.bakery.sendGetRequest.lastCall.args;
      assert.equal(requestArgs[0], 'local/v5/whoami');
      // Make sure that we have disabled redirect on 401
      assert.strictEqual(requestArgs[3], false);
      // Call the makeRequest success handler simulating a response object;
      requestArgs[1](
          {target: { responseText: '{"User": "test", "Groups": []}'}});
    });

    it('calls the failure handler for json parse failures', function(done) {
      var cb = function(error, list) {
        if (error) {
          done();
        } else {
          assert.fail('callback should not succeed.');
        }
      };
      charmstore.whoami(cb);
      // Call the makeRequest success handler simulating a response object;
      charmstore.bakery.sendGetRequest.lastCall.args[1](
          {target: { responseText: '[notvalidjson]'}});
    });
  });

  describe('getCanonicalId', function() {
    it('makes a request to fetch the canonical id for an entity', function() {
      const callback = sinon.stub();
      charmstore.getCanonicalId('cs:xenial/ghost-4', callback);
      const sendGetRequest = charmstore.bakery.sendGetRequest;
      assert.equal(sendGetRequest.callCount, 1);
      const requestPath = sendGetRequest.args[0][0];
      assert.equal(requestPath, 'local/v5/xenial/ghost-4/meta/id');
      // Call the success request callback
      sendGetRequest.args[0][1]({
        target: {
          responseText: '{"Id": "cs:ghost"}'
        }
      });
      assert.equal(callback.callCount, 1);
      assert.deepEqual(callback.args[0], [null, 'cs:ghost']);
    });

    it('properly calls the callback when there is an error', function() {
      const callback = sinon.stub();
      charmstore.getCanonicalId('cs:xenial/ghost-4', callback);
      const sendGetRequest = charmstore.bakery.sendGetRequest;
      assert.equal(sendGetRequest.callCount, 1);
      const requestPath = sendGetRequest.args[0][0];
      assert.equal(requestPath, 'local/v5/xenial/ghost-4/meta/id');
      // Call the error request callback.
      sendGetRequest.args[0][2]('not found');
      assert.equal(callback.callCount, 1);
      assert.deepEqual(callback.args[0], ['not found', null]);
    });
  });

  describe('getEntity', function() {
    it('strips cs from bundle IDs', function() {
      charmstore.getEntity('cs:foobar', sinon.stub());
      var path = charmstore.bakery.sendGetRequest.lastCall.args[0];
      assert.equal(path.indexOf('cs:'), -1,
                   'The string "cs:" should not be found in the path');
    });

    it('calls the correct path', function() {
      charmstore.getEntity('cs:foobar', sinon.stub());
      var path = charmstore.bakery.sendGetRequest.lastCall.args[0];
      assert.equal(
        path, 'local/v5/foobar/meta/any?include=bundle-metadata' +
        '&include=bundle-machine-count' +
        '&include=charm-metadata&include=charm-config&include=common-info' +
        '&include=id-revision&include=revision-info&include=manifest' +
        '&include=stats&include=extra-info&include=tags&include=charm-metrics' +
        '&include=owner&include=resources&include=supported-series');
    });
  });

  describe('getResources', function() {
    it('can get resources for a charm', function() {
      const callback = sinon.stub();
      charmstore.getResources('cs:xenial/ghost-4', callback);
      const sendGetRequest = charmstore.bakery.sendGetRequest;
      assert.equal(sendGetRequest.callCount, 1);
      const requestPath = sendGetRequest.args[0][0];
      assert.equal(requestPath, 'local/v5/xenial/ghost-4/meta/resources');
      // Call the success request callback
      sendGetRequest.args[0][1]({
        target: {
          responseText: '[' +
            '{"Name":"file1","Type":"file","Path":"file1.zip","Description":' +
            '"desc.","Revision":5,"Fingerprint":"123","Size":168},' +
            '{"Name":"file2","Type":"file","Path":"file2.zip","Description":' +
            '"desc.","Revision":5,"Fingerprint":"123","Size":168}' +
            ']'
        }
      });
      assert.equal(callback.callCount, 1);
      assert.deepEqual(callback.args[0], [null, [{
        name: 'file1', type: 'file', path: 'file1.zip', description: 'desc.',
        revision: 5,fingerprint: '123',size: 168
      }, {
        name: 'file2', type: 'file', path: 'file2.zip', description: 'desc.',
        revision: 5,fingerprint: '123',size: 168
      }]]);
    });

    it('properly calls the callback when there is an error', function() {
      const callback = sinon.stub();
      charmstore.getResources('cs:xenial/ghost-4', callback);
      const sendGetRequest = charmstore.bakery.sendGetRequest;
      assert.equal(sendGetRequest.callCount, 1);
      const requestPath = sendGetRequest.args[0][0];
      assert.equal(requestPath, 'local/v5/xenial/ghost-4/meta/resources');
      // Call the error request callback.
      sendGetRequest.args[0][2]('not found');
      assert.equal(callback.callCount, 1);
      assert.deepEqual(callback.args[0], ['not found', {error: 'not found'}]);
    });
  });
});
