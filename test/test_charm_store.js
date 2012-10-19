'use strict';

(function() {

  describe('juju charm store', function() {
    var Y, models, conn, env, app, container, charm_store, data, juju;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'datasource-local', 'json-stringify', 'juju-charm-store',
          'datasource-io', 'io', 'array-extras',
          function(Y) {
            juju = Y.namespace('juju');
            done();
          });
    });

    beforeEach(function() {
      data = [];
      charm_store = new juju.CharmStore(
        {datasource: new Y.DataSource.Local({source: data})});
    });

    it('creates a remote datasource if you simply supply a uri', function() {
      charm_store.set('datasource', 'http://example.com/');
      var datasource = charm_store.get('datasource');
      assert(datasource instanceof Y.DataSource.IO);
      datasource.get('source').should.equal('http://example.com/');
    });

    it('handles loadByPath success correctly', function(done) {
      data.push(
          { responseText: Y.JSON.stringify(
          { summary: 'wowza' })});
      charm_store.loadByPath(
        'whatever',
        { success: function(data) {
            data.summary.should.equal('wowza');
            done();
          },
          failure: assert.fail
        }
      );
    });

    it('handles loadByPath failure correctly', function(done) {
      // datasource._defRequestFn is designed to be overridden to achieve more
      // complex behavior when a request is received.  We simply declare that
      // an error occurred.
      var datasource = charm_store.get('datasource'),
          original = datasource._defResponseFn;
      datasource._defResponseFn = function(e) {
        e.error = true;
        original.apply(datasource, [e]);
      };
      data.push({responseText: Y.JSON.stringify({darn_it: 'uh oh!'})});
      charm_store.loadByPath(
        'whatever',
        { success: assert.fail,
          failure: function(e) {
            e.error.should.equal(true);
            done();
          }
        }
      );
    });

    it('sends a proper request for loadByPath', function() {
      var args;
      charm_store.set('datasource', {
        sendRequest: function(params) {
          args = params;
        }
      });
      charm_store.loadByPath('/foo/bar', {});
      args.request.should.equal('/foo/bar');
    });

    it('sends a proper request for a string call to find', function() {
      var args;
      charm_store.set('datasource', {
        sendRequest: function(params) {
          args = params;
        }
      });
      charm_store.find('foobar', {});
      args.request.should.equal('search/json?search_text=foobar');
    });

    it('sends a proper request for a hash call to find', function() {
      var args;
      charm_store.set('datasource', {
        sendRequest: function(params) {
          args = params;
        }
      });
      charm_store.find({foo: 'bar', sha: 'zam'}, {});
      args.request.should.equal('search/json?search_text=' + escape('foo:bar sha:zam'));
    });

    it('processes and orders search text requests properly', function(done) {
      // This is data from
      // http://jujucharms.com/search/json?search_text=cassandra .
      data.push(Y.io('data/search_results.json', {sync: true}));
      charm_store.find('cassandra',
        { success: function(results) {
            results.length.should.equal(2);
            results[0].series.should.equal('precise');
            Y.Array.map(results[0].charms, function(charm) {
              return charm.owner;
            }).should.eql([null, 'jjo', 'ev', 'ev', 'ev']);
            Y.Array.map(results[0].charms, function(charm) {
              return charm.baseId;
            }).should.eql([
              'cs:precise/cassandra',
              'cs:~jjo/precise/cassandra',
              'cs:~ev/precise/errors',
              'cs:~ev/precise/daisy',
              'cs:~ev/precise/daisy-retracer']);
            done();
          },
          failure: assert.fail
        });
    });

    it('honors defaultSeries in sorting search results', function(done) {
      // This is data from
      // http://jujucharms.com/search/json?search_text=cassandra .
      data.push(Y.io('data/search_results.json', {sync: true}));
      charm_store.find('cassandra',
        { defaultSeries: 'oneiric',
          success: function(results) {
            results.length.should.equal(2);
            results[0].series.should.equal('oneiric');
            done();
          },
          failure: assert.fail
        });
    });

    it('processes and orders search series requests properly', function(done) {
      // This is data from
      // http://jujucharms.com/search/json?search_text=series:quantal+owner:charmers .
      data.push(Y.io('data/series_search_results.json', {sync: true}));
      charm_store.find('cassandra',
        { success: function(results) {
            results.length.should.equal(1);
            results[0].series.should.equal('quantal');
            Y.Array.map(results[0].charms, function(charm) {
              return charm.name;
            }).should.eql([
              'glance',
              'nova-cloud-controller',
              'nova-compute',
              'nova-volume',
              'nyancat']);
            done();
          },
          failure: assert.fail
        });
    });

  });
})();