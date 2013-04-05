'use strict';

// These are nominally based on improv sample.json delta stream with
// the addition of puppet subordinate relations.

describe('Relation endpoints logic', function() {
  var Y, juju, utils, db, app, models, sample_endpoints, sample_env, env;

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
                               'juju-gui',
                               'juju-tests-utils',
                               'juju-controllers'],
    function(Y) {
      juju = Y.namespace('juju');
      utils = Y.namespace('juju-tests.utils');
      models = Y.namespace('juju.models');
      var conn = new utils.SocketStub();
      env = juju.newEnvironment({conn: conn});
      env.connect();
      app = new Y.juju.App({env: env});
      db = app.db;
      db.onDelta({data: {'op': 'delta', result: sample_env}});
      done();
    });
  });

  afterEach(function(done) {
    app.destroy();
    db.destroy();
    env.destroy();
    done();
  });

  it('should be able to find relatable services', function() {
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('blog-lb'),
        available_svcs = Y.Object.keys(models.getEndpoints(
            service, app.endpointsController));
    available_svcs.sort();
    available_svcs.should.eql(
        ['mediawiki', 'puppet', 'rsyslog-forwarder', 'wiki-lb', 'wordpress']);
  });

  it('should find valid targets including subordinates', function() {
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('memcached'),
        available = models.getEndpoints(service, app.endpointsController),
        available_svcs;
    available_svcs = Y.Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(
        ['puppet', 'rsyslog-forwarder', 'wordpress']);
  });

  it('should find ambigious targets', function() {
    // Mysql already has both subordinates related.
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('mysql'),
        available = models.getEndpoints(service, app.endpointsController),
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
        db.services.getById('mediawiki'), app.endpointsController);
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
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('wordpress'),
        available = models.getEndpoints(service, app.endpointsController),
        available_svcs = Y.Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(
        ['blog-lb', 'memcached', 'rsyslog-forwarder']);
  });

  it('should find valid targets for subordinates', function() {
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('puppet');
    var available = models.getEndpoints(service, app.endpointsController);
    var available_svcs = Y.Object.keys(available);

    available_svcs.sort();
    available_svcs.should.eql(
        ['blog-lb', 'memcached', 'puppetmaster', 'rsyslog', 'wiki-lb']);

    service = db.services.getById('rsyslog-forwarder');
    available = models.getEndpoints(service, app.endpointsController);
    available_svcs = Y.Object.keys(available);

    available_svcs.sort();
    available_svcs.should.eql(
        ['blog-lb', 'memcached',
         'puppetmaster', 'rsyslog', 'wiki-lb', 'wordpress']);
  });

});


describe('Endpoints map', function() {
  var Y, juju, models, controller;

  beforeEach(function(done) {
    Y = YUI(GlobalConfig).use(['juju-models',
                               'juju-tests-utils',
                               'juju-endpoints-controller',
                               'juju-controllers'],
    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      var EndpointsController = Y.namespace('juju.EndpointsController');
      controller = new EndpointsController();
      done();
    });
  });

  afterEach(function(done) {
    controller.destroy();
    done();
  });

  it('should add a service to the map', function() {
    controller.endpointsMap = {};
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
    controller.addServiceToEndpointsMap('wordpress', charm);
    controller.endpointsMap.should.eql({wordpress: {
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
    charm.destroy();
  });

  it('should add a service to the map, requires only', function() {
    controller.endpointsMap = {};
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
    controller.addServiceToEndpointsMap('wordpress', charm);
    controller.endpointsMap.should.eql({wordpress: {
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
    charm.destroy();
  });

  it('should add a service to the map, provides only', function() {
    controller.endpointsMap = {};
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
    controller.addServiceToEndpointsMap('wordpress', charm);
    controller.endpointsMap.should.eql({wordpress: {
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
    charm.destroy();
  });

  it('should add a service to the map, neither provides nor requires',
     function() {
       controller.endpointsMap = {};
       var charm = new models.Charm({id: 'cs:precise/wordpress-2'});
       controller.addServiceToEndpointsMap('wordpress', charm);
       controller.endpointsMap.should.eql({wordpress: {
         requires: [],
         provides: []}});
       charm.destroy();
     });

  it('should reset the map', function() {
    var testmap = {'columbus': 'sailed the ocean blue'};
    controller.endpointsMap = testmap;
    controller.endpointsMap.should.eql(testmap);
    controller.reset();
    controller.endpointsMap.should.eql({});
  });

});

describe('Endpoints map handlers', function() {
  var Y, juju, utils, models, app, conn, env, controller;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-gui',
                               'juju-models',
                               'juju-tests-utils',
                               'juju-endpoints-controller',
                               'juju-controllers',
                               'juju-charm-store',
                               'datasource-local'],
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
    controller = app.endpointsController;
    controller.endpointsMap = {};
  });

  afterEach(function() {
    controller.destroy();
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
       controller.endpointsMap.should.eql({});
       charm.destroy();
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
       controller.endpointsMap.should.eql({wordpress: {
         requires: [],
         provides: []}});
       charm.destroy();
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
    controller.endpointsMap.should.eql({wordpress: {
      requires: [],
      provides: []}});

    charm_id = 'cs:precise/wordpress-3';
    app.db.charms.add({id: charm_id});
    var charm2 = app.db.charms.getById(charm_id);
    charm2.set('provides', {
      url: {
        'interface': 'http'
      }
    });

    charm2.loaded = true;
    svc.set('charm', charm_id);
    controller.endpointsMap.should.eql({wordpress: {
      requires: [],
      provides: [
        {
          name: 'url',
          'interface': 'http'
        }]}});
    charm.destroy();
    charm2.destroy();
  });

  it('should remove service from endpoints map when it is deleted', function() {
    var service_name = 'wordpress';
    var charm_id = 'cs:precise/wordpress-2';
    app.db.charms.add({id: charm_id});
    app.db.services.add({
      id: service_name,
      charm: charm_id});
    controller.endpointsMap = {wordpress: 'foo'};
    var service = app.db.services.getById(service_name);
    app.db.services.remove(service);
    controller.endpointsMap.should.eql({});
    app.db.charms.getById(charm_id).destroy();
  });

  it('should reset the map when the services reset', function() {
    var service_name = 'wordpress';
    var charm_id = 'cs:precise/wordpress-2';
    app.db.charms.add({id: charm_id});
    app.db.services.add({
      id: service_name,
      charm: charm_id});
    controller.endpointsMap = {wordpress: 'foo'};
    app.db.services.reset();
    controller.endpointsMap.should.eql({});
    app.db.charms.getById(charm_id).destroy();
  });

  it('should add the service to the endpoints map when the charm is loaded',
     function(done) {
       var service_name = 'wordpress';
       var charm_id = 'cs:precise/wordpress-2';
       app.db.charms.add({id: charm_id});
       controller.endpointsMap.should.eql({});
       var charm = app.db.charms.getById(charm_id);
       var data = [
         { responseText: Y.JSON.stringify(
         { summary: 'wowza', subordinate: true, store_revision: 7 })}];
       var charmStore = new juju.CharmStore({
         datasource: new Y.DataSource.Local({source: data})});

       app.db.services.add({
         id: service_name,
         pending: false,
         charm: charm_id});

       charm.load(charmStore, function(err, data) {
         if (err) { assert.fail('should succeed!'); }
         assert(charm.loaded);
         charm.get('summary').should.equal('wowza');

         controller.endpointsMap.should.eql({
           'wordpress': {
             provides: [],
             requires: []
           }});

         charmStore.destroy();
         done();
       });


     }
  );

});
