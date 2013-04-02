'use strict';

// These are nominally based on improv sample.json delta stream with
// the addition of puppet subordinate relations.

describe('Relation endpoints logic', function() {
  var Y, juju, db, models, sample_endpoints, sample_env;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'io', 'json-parse', 'array-extras'], function(Y) {
      function loadFixture(url) {
        return Y.JSON.parse(Y.io(url, {sync: true}).responseText);
      }
      sample_env = loadFixture('data/large_stream.json');
      sample_endpoints = loadFixture('data/large_endpoints.json');
      done();
    });
  });


  beforeEach(function(done) {
    Y = YUI(GlobalConfig).use(['juju-models',
                               'juju-tests-utils',
                               'juju-controllers'],
    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      db = new (Y.namespace('juju.models')).Database();
      db.on_delta({data: {'op': 'delta', result: sample_env}});
      done();
    });
  });

  afterEach(function(done) {
    db.destroy();
    done();
  });

  it('should be able to find relatable services', function() {
    var service = db.services.getById('blog-lb'),
        available_svcs = Y.Object.keys(models.getEndpoints(
            service, sample_endpoints, db));
    available_svcs.sort();
    available_svcs.should.eql(
        ['mediawiki', 'puppet', 'rsyslog-forwarder', 'wiki-lb', 'wordpress']);
  });

  it('should find valid targets including subordinates', function() {
    var service = db.services.getById('memcached'),
        available = models.getEndpoints(service, sample_endpoints, db),
        available_svcs;
    available_svcs = Y.Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(
        ['puppet', 'rsyslog-forwarder', 'wordpress']);
  });

  it('should find ambigious targets', function() {
    // Mysql already has both subordinates related.
    var service = db.services.getById('mysql'),
        available = models.getEndpoints(service, sample_endpoints, db),
        available_svcs = Y.Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(['mediawiki']);
    // mediawiki has two possible relations (read slave or write master)
    // it can establish with mysql.
    available.mediawiki.should.eql([
      [{name: 'db', service: 'mysql', type: 'mysql'},
       {name: 'slave', service: 'mediawiki', type: 'mysql'}],
      [{name: 'db', service: 'mysql', type: 'mysql'},
       {name: 'db', service: 'mediawiki', type: 'mysql'}]
    ]);

    // Demonstrate the inverse retrieval of the same.
    available = models.getEndpoints(
        db.services.getById('mediawiki'), sample_endpoints, db),
    available.mysql.should.eql([
      [{name: 'slave', service: 'mediawiki', type: 'mysql'},
       {name: 'db', service: 'mysql', type: 'mysql'}],
      [{name: 'db', service: 'mediawiki', type: 'mysql'},
       {name: 'db', service: 'mysql', type: 'mysql'}]
    ]);
  });

  it('should find valid targets for a requires', function() {
    // Wordpress already has one subordinates related (puppet)
    // ..the picture is wrong.. wordpress only has one subordinate
    var service = db.services.getById('wordpress'),
        available = models.getEndpoints(service, sample_endpoints, db),
        available_svcs = Y.Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(
        ['blog-lb', 'memcached', 'rsyslog-forwarder']);
  });

  it('should find valid targets for subordinates', function() {
    var service = db.services.getById('puppet');
    var available = models.getEndpoints(service, sample_endpoints, db);
    var available_svcs = Y.Object.keys(available);

    available_svcs.sort();
    available_svcs.should.eql(
        ['blog-lb', 'memcached', 'puppetmaster', 'rsyslog', 'wiki-lb']);

    service = db.services.getById('rsyslog-forwarder');
    available = models.getEndpoints(service, sample_endpoints, db);
    available_svcs = Y.Object.keys(available);

    available_svcs.sort();
    available_svcs.should.eql(
        ['blog-lb', 'memcached',
         'puppetmaster', 'rsyslog', 'wiki-lb', 'wordpress']);
  });

});


describe('Endpoints map', function() {
  var Y, juju, models;

  beforeEach(function(done) {
    Y = YUI(GlobalConfig).use(['juju-models',
                               'juju-tests-utils',
                               'juju-controllers'],
    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      done();
    });
  });

  it('should add a service to the map', function() {
    models.endpoints_map = {};
    var charm = new models.Charm({id: 'cs:precise/wordpress-2'});
    charm.set('provides', {
      url: {
        'interface': 'http',
        optional: 'false'
      },
      'logging-dir': {
        'interface': 'logging',
        scope: 'container'
      }
    });
    charm.set('requires', {
      db: {
        'interface': 'mysql',
        optional: 'false'
      },
      cache: {
        'interface': 'varnish',
        optional: 'true'
      }
    });
    models.addServiceToEndpointsMap('wordpress', charm);
    models.endpoints_map.should.eql({wordpress: {
      provides: [
        {
          name: 'url',
          'interface': 'http',
          optional: 'false'
        }, {
          name: 'logging-dir',
          'interface': 'logging',
          scope: 'container'
        }
      ],
      requires: [
        {
          name: 'db',
          'interface': 'mysql',
          optional: 'false'
        }, {
          name: 'cache',
          'interface': 'varnish',
          optional: 'true'
        }
      ]
    }});
  });

  it('should add a service to the map, requires only', function() {
    models.endpoints_map = {};
    var charm = new models.Charm({id: 'cs:precise/wordpress-2'});
    charm.set('requires', {
      db: {
        'interface': 'mysql',
        optional: 'false'
      },
      cache: {
        'interface': 'varnish',
        optional: 'true'
      }
    });
    models.addServiceToEndpointsMap('wordpress', charm);
    models.endpoints_map.should.eql({wordpress: {
      provides: [],
      requires: [
        {
          name: 'db',
          'interface': 'mysql',
          optional: 'false'
        }, {
          name: 'cache',
          'interface': 'varnish',
          optional: 'true'
        }
      ]
    }});
  });

  it('should add a service to the map, provides only', function() {
    models.endpoints_map = {};
    var charm = new models.Charm({id: 'cs:precise/wordpress-2'});
    charm.set('provides', {
      url: {
        'interface': 'http',
        optional: 'false'
      },
      'logging-dir': {
        'interface': 'logging',
        scope: 'container'
      }
    });
    models.addServiceToEndpointsMap('wordpress', charm);
    models.endpoints_map.should.eql({wordpress: {
      requires: [],
      provides: [
        {
          name: 'url',
          'interface': 'http',
          optional: 'false'
        }, {
          name: 'logging-dir',
          'interface': 'logging',
          scope: 'container'
        }
      ] }});
  });

  it('should add a service to the map, neither provides nor requires',
     function() {
       models.endpoints_map = {};
       var charm = new models.Charm({id: 'cs:precise/wordpress-2'});
       models.addServiceToEndpointsMap('wordpress', charm);
       models.endpoints_map.should.eql({wordpress: {
         requires: [],
         provides: []}});
     });

});

describe('Endpoints map handlers', function() {
  var Y, juju, utils, models, app, conn, env;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-gui',
                               'juju-models',
                               'juju-tests-utils',
                               'juju-controllers'],
    function(Y) {
      juju = Y.namespace('juju');
      utils = Y.namespace('juju-tests.utils');
      models = Y.namespace('juju.models');
      done();
    });
  });

  beforeEach(function() {
    conn = new utils.SocketStub();
    env = juju.newEnvironment({conn: conn});
    env.connect();
    app = new Y.juju.App({env: env});
    models.endpoints_map = {};
  });

  afterEach(function() {
    env.destroy();
    app.destroy();
  });

  it('should not update endpoints map when pending services are added',
     function() {
       var service_name = 'wordpress';
       var charm_id = 'cs:precise/wordpress-2';
       app.db.charms.add({id: charm_id});
       var charm = app.db.charms.getById(charm_id);
       charm.loaded = true;
       app.db.services.add({
         id: service_name,
         pending: true,
         charm: charm_id});
       models.endpoints_map.should.eql({});
     });

  it('should update endpoints map when non-pending services are added',
     function() {
       var service_name = 'wordpress';
       var charm_id = 'cs:precise/wordpress-2';
       app.db.charms.add({id: charm_id});
       var charm = app.db.charms.getById(charm_id);
       charm.loaded = true;
       app.db.services.add({
         id: service_name,
         pending: true,
         charm: charm_id});
       var svc = app.db.services.getById(service_name);
       svc.set('pending', false);
       models.endpoints_map.should.eql({wordpress: {
         requires: [],
         provides: []}});
     });

  it('should update endpoints map when a service\'s charm changes', function() {
    var service_name = 'wordpress';
    var charm_id = 'cs:precise/wordpress-2';
    app.db.charms.add({id: charm_id});
    var charm = app.db.charms.getById(charm_id);
    charm.loaded = true;
    app.db.services.add({
      id: service_name,
      pending: true,
      charm: charm_id});
    var svc = app.db.services.getById(service_name);
    svc.set('pending', false);
    models.endpoints_map.should.eql({wordpress: {
      requires: [],
      provides: []}});

    charm_id = 'cs:precise/wordpress-3';
    app.db.charms.add({id: charm_id});
    charm = app.db.charms.getById(charm_id);
    charm.set('provides', {
      url: {
        'interface': 'http'
      }
    });

    charm.loaded = true;
    svc.set('charm', charm_id);
    models.endpoints_map.should.eql({wordpress: {
      requires: [],
      provides: [
        {
          name: 'url',
          'interface': 'http'
        }]}});

  });

  it('should remove service from endpoints map when it is deleted', function() {
    var service_name = 'wordpress';
    var charm_id = 'cs:precise/wordpress-2';
    app.db.charms.add({id: charm_id});
    app.db.services.add({
      id: service_name,
      charm: charm_id});
    models.endpoints_map = {wordpress: 'foo'};
    var service = app.db.services.getById(service_name);
    app.db.services.remove(service);
    models.endpoints_map.should.eql({});
  });

});
