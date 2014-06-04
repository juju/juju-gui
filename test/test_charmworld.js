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

  describe('Charmworld API v3 interface', function() {
    var api, charmworld, conn, data, factory, hostname, juju, models, utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'datasource-local', 'json-stringify', 'juju-charm-store',
          'datasource-io', 'io', 'array-extras', 'juju-charm-models',
          'juju-tests-factory', 'juju-tests-utils', 'juju-bundle-models',
          function(Y) {
            juju = Y.namespace('juju');
            charmworld = Y.namespace('juju.charmworld');
            models = Y.namespace('juju.models');
            utils = Y.namespace('juju-tests').utils;
            factory = Y.namespace('juju-tests').factory;
            done();
          });
    });

    beforeEach(function() {
      hostname = 'http://charmworld.example/';
      api = new charmworld.APIv3({apiHost: hostname});
    });

    it('constructs the api url correctly based on apiHost', function() {
      var ds = api.get('datasource');

      ds.get('source').should.eql(hostname + 'api/3/');

      // And it should work without a trailing / as well.
      hostname = hostname.slice(0, -1);
      api = new charmworld.APIv3({apiHost: hostname});
      ds = api.get('datasource');
      ds.get('source').should.eql(hostname + '/api/3/');
    });

    it('handles loading interesting content correctly', function(done) {
      var data = [];

      data.push({responseText: Y.JSON.stringify({summary: 'wowza'})});
      api.set('datasource', new Y.DataSource.Local({source: data}));

      var requestId = api.interesting({
        success: function(data) {
          data.summary.should.equal('wowza');
          setTimeout(function() {
            assert.equal(requestId, 0);
            done();
          }, 0);
        },
        failure: function(data, request) {
        }
      }, this);
    });

    it('handles searching correctly', function(done) {
      var data = [],
          url;
      data.push({responseText: Y.JSON.stringify({name: 'foo'})});
      // Create a monkeypatched datasource we can use to track the generated
      // apiEndpoint
      var datasource = new Y.DataSource.Local({source: data});
      datasource.realSendRequest = datasource.sendRequest;
      datasource.sendRequest = function(params) {
        url = params.request;
        datasource.realSendRequest(params);
        // sendRequest would return a transaction id that we need to check for.
        return 0;
      };

      api.set('datasource', datasource);
      var requestId = api.search({text: 'foo'}, {
        success: function(data) {
          assert.equal('search?text=foo', url);
          assert.equal('foo', data.name);
          setTimeout(function() {
            assert.equal(requestId, 0);
            done();
          }, 0);
        },
        failure: function(data, request) {
        }
      }, this);
      api.destroy();
    });

    // XXX Skip until widget rendering issue is taken care of; see comment
    // in app/store/charmworld.js for more info. Makyo 2014-06-04
    it.skip('caches data loaded from charmworld', function(done) {
      var data = [];
      var stubSendRequest;
      var self = this;

      data.push({responseText: Y.JSON.stringify({summary: 'wowza'})});
      api.set('datasource', new Y.DataSource.Local({source: data}));

      // Make a first call to interesting, which should request the data
      // from the data source.
      api.interesting({
        success: function(data) {
          stubSendRequest = utils.makeStubMethod(api.apiHelper,
              'sendRequest');
          this._cleanups.push(stubSendRequest.reset);
          setTimeout(function() {
            assert.deepEqual(api.apiHelper.get('cachedResults'), {
              'search/interesting': { summary: 'wowza' }
            });
            requestAgain.call(this);
          }, 0);
        },
        failure: function(data, request) {
        }
      }, this);

      // Ensure that the sendRequest method is not called a second time.
      // Additionally, make sure that we still receive the same data from
      // the cache.
      function requestAgain() {
        api.interesting({
          success: function(data) {
            setTimeout(function() {
              assert.deepEqual(api.apiHelper.get('cachedResults'), {
                'search/interesting': { summary: 'wowza' }
              });
              // Cached results were returned without a request being made.
              assert.equal(stubSendRequest.callCount(), 0);
              done();
            }, 0);
          },
          failure: function(data, request) {
          }
        }, self);
      }
    });

    it('provides an in flight request abort method', function() {
      var transaction = {
        abort: utils.makeStubFunction()
      };
      var datasource = new Y.DataSource.IO({
        source: '/',
        io: utils.makeStubFunction(transaction)
      });
      var cb = function() {};
      api.set('datasource', datasource);
      var requestId = api.interesting({ success: cb, failure: cb });
      assert.equal(typeof requestId, 'number');
      assert.deepEqual(Y.DataSource.Local.transactions[requestId], transaction);
      api.cancelInFlightRequest(requestId);
      assert.equal(transaction.abort.calledOnce(), true);
      datasource.destroy();
      api.destroy();
    });

    it('makes charm requests to correct URL', function(done) {
      api._makeRequest = function(endpoint, callbacks, filters) {
        assert.equal(endpoint, 'charm/CHARM-ID');
        done();
      };

      api._charm('CHARM-ID');
    });

    it('can use a cache to avoid requesting charm data', function(done) {
      var should_not_happen = function() {
        assert.isTrue(false, 'Oops, this should not have been called.');
        done();
      };
      var CACHED_CHARM = 'CACHED-CHARM';

      var callbacks = {
        success: function(data, charm) {
          assert.equal(charm, CACHED_CHARM);
          done();
        },
        failure: should_not_happen
      };

      api._makeRequest = should_not_happen;

      var cache = {
        getById: function(charmID) {
          return CACHED_CHARM;
        }};

      api.charm('CHARM-ID', callbacks, false, cache);

    });

    it('will make a request on a cache miss', function(done) {
      var should_not_happen = function() {
        assert.isTrue(false, 'Oops, this should not have been called.');
        done();
      };
      var CACHED_CHARM = 'CACHED-CHARM';

      var callbacks = {
        success: function(data, charm) {
          assert.equal(charm, CACHED_CHARM);
          done();
        },
        failure: should_not_happen
      };

      api._makeRequest = function() {
        // If this was called, then the test is successful.
        done();
      };

      var cache = {
        getById: function(charmID) {
          return null;
        }};

      api.charm('CHARM-ID', callbacks, false, cache);

    });

    it('makes autocomplete requests to correct URL', function(done) {
      var noop = function() {};

      api._makeRequest = function(endpoint, callbacks, filters) {
        assert.equal(endpoint, 'search');
        done();
      };

      api.autocomplete({text: 'mys'}, {'success': noop});
    });

    it('makes autocomplete requests with right query flag', function(done) {
      var noop = function() {};

      api._makeRequest = function(endpoint, callbacks, filters) {
        assert.equal(filters.autocomplete, 'true');
        done();
      };

      api.autocomplete({text: 'mys'}, {'success': noop});
    });

    it('constructs iconpaths correctly', function() {
      var iconPath = api.iconpath('precise/mysql-1');
      assert.equal(
          iconPath,
          hostname + 'api/3/charm/precise/mysql-1/file/icon.svg');
    });

    it('constructs cateogry icon paths correctly', function() {
      var iconPath = api.buildCategoryIconPath('app-servers');
      assert.equal(
          iconPath,
          hostname + 'static/img/category-app-servers-bw.svg');
    });

    it('constructs an icon path for local charms', function() {
      var iconPath = api.iconpath('local:precise/mysql-1');
      assert.equal(iconPath, hostname + 'static/img/charm_160.svg');
    });

    it('removes cs: from the icon path when necessary', function() {
      var iconPath = api.iconpath('cs:precise/mysql-1');
      assert.equal(
          iconPath,
          hostname + 'api/3/charm/precise/mysql-1/file/icon.svg');
    });

    it('constructs bundle icon paths', function() {
      var iconPath = api.iconpath('wiki/3/wiki', true);
      assert.equal(
          iconPath,
          hostname + 'api/3/bundle/wiki/3/wiki/file/icon.svg');
    });

    it('allows for a demo mode on icon urls', function() {
      localStorage.setItem('demo-mode', true);
      var iconPath = api.iconpath('wiki/3/wiki', true);
      assert.equal(
          iconPath,
          hostname + 'api/3/bundle/wiki/3/wiki/file/icon.svg?demo=true');

      localStorage.removeItem('demo-mode');
    });

    it('can assemble proper urls to fetch files', function(done) {
      api.set('datasource', {
        sendRequest: function(options) {
          assert.equal(options.request, 'bundle/abc123/file/readme');
          assert.equal(typeof options.callback.success === 'function', true);
          assert.equal(typeof options.callback.failure === 'function', true);
          done();
        }
      });
      api.file('abc123', 'readme', 'bundle', {
        success: function() {},
        failure: function() {}
      });
    });

    it('can fetch a charm via a promise', function(done) {
      // The "promiseCharm" method is just a promise-wrapped version of the
      // "charm" method.
      var DATA = 'DATA';
      var CHARM = 'CHARM';
      api.charm = function(charmID, callbacks) {
        callbacks.success(DATA, CHARM);
      };
      api.promiseCharm('CHARM-ID', null, 'precise')
        .then(function(data) {
            assert.equal(data, DATA);
            done();
          });
    });

    it('finds upgrades for charms - upgrade available', function(done) {
      var store = factory.makeFakeStore();
      var charm = new models.Charm({url: 'cs:precise/wordpress-10'});
      store.promiseUpgradeAvailability(charm)
        .then(function(upgrade) {
            assert.equal(upgrade, 'precise/wordpress-15');
            done();
          }, function(error) {
            assert.isTrue(false, 'We should not get here.');
            done();
          });
    });

    it('finds upgrades for charms - no upgrade available', function(done) {
      var store = factory.makeFakeStore();
      var charm = new models.Charm({url: 'cs:precise/wordpress-15'});
      store.promiseUpgradeAvailability(charm)
        .then(function(upgrade) {
            assert.isUndefined(upgrade);
            done();
          }, function(error) {
            assert.isTrue(false, 'We should not get here');
            done();
          });
    });

    it('copies metadata while transforming results', function() {
      var store = factory.makeFakeStore();
      var fakebundle = {bundle: {id: 'bundle0'},
                         metadata: 'bundledata'};
      var fakecharm = {charm: {url: 'cs:precise/wordpress-15'},
                        metadata: 'charmdata'};
      var testdata = Y.clone([fakecharm, fakebundle]);
      fakebundle.bundle.metadata = fakebundle.metadata;
      fakecharm.charm.metadata = fakecharm.metadata;
      var expected = [new models.Charm(fakecharm.charm),
                      new models.Bundle(fakebundle.bundle)];
      var results = store.transformResults(testdata);
      assert.equal(expected.length, results.length);
      assert.equal(expected[0].get('id'), results[0].get('id'));
      assert.equal(expected[1].get('id'), results[1].get('id'));
      assert.equal(expected[0].get('metadata'), results[0].get('metadata'));
      assert.equal(expected[1].get('metadata'), results[1].get('metadata'));

    });

  });

  describe('Charmworld API Helper', function() {
    var Y, models, conn, data, juju, utils, charmworld, hostname;


    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'datasource-local', 'json-stringify', 'juju-charm-store',
          'datasource-io', 'io', 'array-extras', 'juju-charm-models',
          'juju-tests-utils',
          function(Y) {
            juju = Y.namespace('juju');
            charmworld = Y.namespace('juju.charmworld');
            models = Y.namespace('juju.models');
            utils = Y.namespace('juju-tests').utils;
            done();
          });
    });

    beforeEach(function() {
      hostname = 'http://charmworld.example/';
    });

    it('can normalize charm names for lookup', function() {
      var apiHelper = new charmworld.ApiHelper({});
      // If the charm ID does not include a series, the given default seriese
      // is used to fill our the charm ID.
      assert.equal(apiHelper.normalizeCharmId('wordpress', 'precise'),
          'precise/wordpress');
      // If no default series is given, "precise" is used.
      assert.equal(apiHelper.normalizeCharmId('wordpress'),
          'precise/wordpress');
      // If a series is provided, the default serise is ignored.
      assert.equal(apiHelper.normalizeCharmId('quantal/wordpress', 'precise'),
          'quantal/wordpress');
      // A charm ID with series and name but no revision is unchanged.
      assert.equal(apiHelper.normalizeCharmId('precise/wordpress'),
          'precise/wordpress');
      // A charm ID with series, name, and revision is unchanged.
      assert.equal(apiHelper.normalizeCharmId('precise/wordpress-10'),
          'precise/wordpress-10');
      // A leading charm store scheme identifier will be stripped.
      assert.equal(apiHelper.normalizeCharmId('cs:precise/wordpress-10'),
          'precise/wordpress-10');
    });

  });

})();
