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

// These are nominally based on improv sample.json delta stream with
// the addition of puppet subordinate relations.

describe('Relation endpoints logic', function() {
  var Y, juju, utils, db, app, models, sample_endpoints, sample_env, env;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'array-extras', 'io', 'json-parse', 'juju-tests-utils'], function(Y) {
      utils = Y.namespace('juju-tests.utils');
      sample_env = utils.loadFixture('data/large_stream.json', true);
      sample_endpoints = utils.loadFixture('data/large_endpoints.json', true);
      done();
    });
  });


  beforeEach(function(done) {
    Y = YUI(GlobalConfig).use(['juju-views',
                               'juju-models',
                               'juju-gui',
                               'juju-tests-utils',
                               'juju-controllers'],
    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      var conn = new utils.SocketStub();
      env = juju.newEnvironment({conn: conn});
      env.connect();
      app = new Y.juju.App({env: env});
      app.navigate = function() { return true; };
      app.showView(new Y.View());
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

  it('should ignore pending services', function() {
    db.services.getById('wordpress').set('pending', true);
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('blog-lb'),
        available_svcs = Y.Object.keys(models.getEndpoints(
            service, app.endpointsController));
    available_svcs.sort();
    available_svcs.should.eql(
        ['mediawiki', 'puppet', 'rsyslog-forwarder', 'wiki-lb']);
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
  var Y, juju, utils, models, app, conn, env, controller, destroyMe;

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
    destroyMe = [];
    conn = new utils.SocketStub();
    env = juju.newEnvironment({conn: conn});
    env.connect();
    app = new Y.juju.App({env: env, consoleEnabled: true});
    destroyMe.push(app);
    app.showView(new Y.View());
    controller = app.endpointsController;
    destroyMe.push(controller);
    controller.endpointsMap = {};
  });

  afterEach(function() {
    Y.each(destroyMe, function(thing) {
      thing.destroy();
    });
  });

  it('should not update endpoints map when pending services are added',
     function(done) {
       var charm_id = 'cs:precise/wordpress-2';
       app.db.services.add({
         id: 'wordpress',
         pending: true,
         charm: charm_id});
       // This timeout is here because we now add the endpoints async via
       // a response from a promise so checking for an id will always be null
       // immediately after requesting it. So in 100ms if it's not there,
       // it won't be because the code would have had a chance to execute.
       setTimeout(function() {
         assert.deepEqual(controller.endpointsMap, {});
         // No charm should have tried to load (see bug 1166222).
         assert.isNull(app.db.charms.getById(charm_id));
         done();
       }, 100);
     });

  it('should update endpoints map when non-pending services are added',
     function(done) {
       var service_name = 'wordpress';
       var charm_id = 'cs:precise/wordpress-2';
       app.db.charms.add({id: charm_id});
       var charm = app.db.charms.getById(charm_id);
       destroyMe.push(charm);
       charm.loaded = true;
       app.db.services.add({
         id: service_name,
         pending: true,
         loaded: true,
         charm: charm_id});

       controller.on('endpointMapAdded', function() {
         controller.endpointsMap.should.eql({wordpress: {
           requires: [],
           provides: []}});
         done();
       });

       var svc = app.db.services.getById(service_name);
       svc.set('pending', false);
     });

  it('should update endpoints map when a service\'s charm changes', function() {
    var service_name = 'wordpress';
    var charm_id = 'cs:precise/wordpress-2';
    app.db.charms.add({id: charm_id});
    var charm = app.db.charms.getById(charm_id);
    destroyMe.push(charm);
    charm.loaded = true;
    app.db.services.add({
      id: service_name,
      pending: true,
      loaded: true,
      charm: charm_id});
    var svc = app.db.services.getById(service_name);
    svc.set('pending', false);
    controller.on('endpointMapAdded', function() {
      controller.endpointsMap.should.eql({wordpress: {
        requires: [],
        provides: []}});

      charm_id = 'cs:precise/wordpress-3';
      app.db.charms.add({id: charm_id});
      var charm2 = app.db.charms.getById(charm_id);
      destroyMe.push(charm2);
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
    });
  });

  it('should remove service from endpoints map when it is deleted', function() {
    var service_name = 'wordpress';
    var charm_id = 'cs:precise/wordpress-2';
    var charm = app.db.charms.add({id: charm_id});
    destroyMe.push(charm);
    app.db.services.add({
      id: service_name,
      loaded: true,
      charm: charm_id});
    controller.endpointsMap = {wordpress: 'foo'};
    var service = app.db.services.getById(service_name);
    app.db.services.remove(service);
    controller.endpointsMap.should.eql({});
  });

  it('should reset the map when the services reset', function() {
    var service_name = 'wordpress';
    var charm_id = 'cs:precise/wordpress-2';
    var charm = app.db.charms.add({id: charm_id});
    destroyMe.push(charm);
    app.db.services.add({
      id: service_name,
      loaded: true,
      charm: charm_id});
    controller.endpointsMap = {wordpress: 'foo'};
    app.db.services.reset();
    controller.endpointsMap.should.eql({});
  });

  it('should add the service to the endpoints map when the charm is loaded',
     function(done) {
       var service_name = 'wordpress';
       var charm_id = 'cs:precise/wordpress-2';
       var charm = app.db.charms.add({id: charm_id});
       destroyMe.push(charm);
       controller.endpointsMap.should.eql({});
       var data = [
         { responseText: Y.JSON.stringify(
         { summary: 'wowza', subordinate: true, store_revision: 7 })}];
       var charmStore = new juju.CharmStore({
         datasource: new Y.DataSource.Local({source: data})});

       app.db.services.add({
         id: service_name,
         pending: false,
         loaded: true,
         charm: charm_id});

       charm.load(charmStore, function(err, data) {
         if (err) { assert.fail('should succeed!'); }
         assert(charm.loaded);
         charm.get('summary').should.equal('wowza');
         controller.on('endpointMapAdded', function() {
           controller.endpointsMap.should.eql({
             'wordpress': {
               provides: [],
               requires: []
             }});
            done();
          });
       });
     }
  );

});



describe('Service config handlers', function() {
  var Y, juju, utils, models, app, conn, env, controller, destroyMe;

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
    destroyMe = [];
    conn = new utils.SocketStub();
    env = juju.newEnvironment({conn: conn});
    env.connect();
    app = new Y.juju.App({env: env, consoleEnabled: true });
    destroyMe.push(app);
    app.showView(new Y.View());
    controller = app.endpointsController;
    destroyMe.push(controller);
  });

  afterEach(function() {
    Y.each(destroyMe, function(thing) {
      thing.destroy();
    });
  });

  it('should not call get_service when a pending service is added',
     function() {
       var charm_id = 'cs:precise/wordpress-2';
       app.db.services.add({
         id: 'wordpress',
         pending: true,
         charm: charm_id});
       assert.equal(0, conn.messages.length);
     });

  it('should call get_service when non-pending services are added',
     function() {
       var service_name = 'wordpress';
       var charm_id = 'cs:precise/wordpress-2';
       var charm = app.db.charms.add({id: charm_id});
       destroyMe.push(charm);
       charm.loaded = true;
       app.db.services.add({
         id: service_name,
         pending: true,
         charm: charm_id});
       var svc = app.db.services.getById(service_name);
       svc.set('pending', false);
       assert.equal(1, conn.messages.length);
       assert.equal('get_service', conn.last_message().op);
     });

  it('should call get_service when a service\'s charm changes', function() {
    var service_name = 'wordpress';
    var charm_id = 'cs:precise/wordpress-2';
    var charm = app.db.charms.add({id: charm_id});
    destroyMe.push(charm);
    charm.loaded = true;
    app.db.services.add({
      id: service_name,
      pending: false,
      charm: charm_id});
    assert.equal(1, conn.messages.length);
    assert.equal('get_service', conn.last_message().op);
    var svc = app.db.services.getById(service_name);
    charm_id = 'cs:precise/wordpress-3';
    var charm2 = app.db.charms.add({id: charm_id, loaded: true});
    destroyMe.push(charm2);
    svc.set('charm', charm_id);
    assert.equal(1, conn.messages.length);
    assert.equal('get_service', conn.last_message().op);
  });

});
