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
  var Y, juju, utils, db, app, models, sample_endpoints, sample_env, env, ecs;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['array-extras',
                               'io',
                               'json-parse',
                               'juju-tests-utils',
                               'juju-views',
                               'juju-models',
                               'juju-gui',
                               'juju-tests-utils',
                               'juju-controllers',
                               'environment-change-set'],
    function(Y) {
      utils = Y.namespace('juju-tests.utils');
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      sample_env = utils.loadFixture('data/large_stream.json', true);
      sample_endpoints = utils.loadFixture('data/large_endpoints.json', true);
      utils.makeStubMethod(Y.juju.App.prototype, '_renderComponents');
      done();
    });
  });

  beforeEach(function() {
    var conn = new utils.SocketStub();
    ecs = new juju.EnvironmentChangeSet();
    env = new juju.environments.GoEnvironment({conn: conn, ecs: ecs});
    env.connect();
    app = new Y.juju.App({env: env, consoleEnabled: true});
    app.navigate = function() { return true; };
    app.showView(new Y.View());
    db = app.db;
  });

  afterEach(function() {
    app.destroy();
    db.destroy();
    env.close();
    env.destroy();
  });

  function loadDelta(relations) {
    var delta = [];
    if (relations === false) {
      // Remove the relations from the delta.
      sample_env.forEach(function(change, index) {
        if (change[0] !== 'relationInfo') {
          delta.push(change);
        }
      });
    } else {
      delta = sample_env;
    }
    db.onDelta({data: {result: delta}});
  }

  it('should be able to find relatable services', function() {
    loadDelta(false);
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('mediawiki'),
        available_svcs = Y.Object.keys(models.getEndpoints(
            service, app.endpointsController));
    available_svcs.sort();
    available_svcs.should.eql(
        ['memcached', 'mysql', 'puppet', 'rsyslog-forwarder-ha']);
  });

  it('should find valid targets including subordinates', function() {
    loadDelta(false);
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('memcached'),
        available = models.getEndpoints(service, app.endpointsController),
        available_svcs;
    available_svcs = Y.Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(
        ['mediawiki', 'puppet', 'rsyslog-forwarder-ha', 'wordpress']);
  });

  it('should find ambigious targets', function() {
    loadDelta();
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
    loadDelta();
    // Wordpress already has one subordinates related (puppet)
    // ..the picture is wrong.. wordpress only has one subordinate
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('wordpress');
    var available = models.getEndpoints(service, app.endpointsController);
    var available_svcs = Y.Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(['memcached']);
  });

  it('should find valid targets for subordinates', function() {
    loadDelta(false);
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('puppet');
    var available = models.getEndpoints(service, app.endpointsController);
    var available_svcs = Y.Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(
        ['mediawiki', 'memcached', 'mysql', 'puppetmaster', 'rsyslog',
         'rsyslog-forwarder-ha', 'wordpress']);

    service = db.services.getById('rsyslog-forwarder-ha');
    available = models.getEndpoints(service, app.endpointsController);
    available_svcs = Y.Object.keys(available);

    available_svcs.sort();
    available_svcs.should.eql(
        ['mediawiki', 'memcached', 'mysql', 'puppet',
         'puppetmaster', 'rsyslog', 'wordpress']);
  });

});


describe('Endpoints map', function() {
  var models, controller, EndpointsController, charm;

  before(function(done) {
    YUI(GlobalConfig).use(['juju-models',
                               'juju-tests-utils',
                               'juju-endpoints-controller',
                               'juju-controllers'],
    function(Y) {
      models = Y.namespace('juju.models');
      EndpointsController = Y.namespace('juju.EndpointsController');
      done();
    });
  });

  beforeEach(function() {
    controller = new EndpointsController();
    charm = new models.Charm({id: 'cs:precise/wordpress-2'});
  });

  afterEach(function() {
    controller.destroy();
    charm.destroy();
  });

  it('should add a service to the map', function() {
    controller.endpointsMap = {};
    charm.set('relations', {
      provides: {
        url: {
          'interface': 'http',
          optional: 'false'
        },
        'logging-dir': {
          'interface': 'logging',
          scope: 'container'
        }
      },
      requires: {
        db: {
          'interface': 'mysql',
          optional: 'false'
        },
        cache: {
          'interface': 'varnish',
          optional: 'true'
        }
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
  });

  it('should add a service to the map, requires only', function() {
    controller.endpointsMap = {};
    charm.set('relations', {
      requires: {
        db: {
          'interface': 'mysql',
          optional: 'false'
        },
        cache: {
          'interface': 'varnish',
          optional: 'true'
        }
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
  });

  it('should add a service to the map, provides only', function() {
    controller.endpointsMap = {};
    charm.set('relations', {
      provides: {
        url: {
          'interface': 'http',
          optional: 'false'
        },
        'logging-dir': {
          'interface': 'logging',
          scope: 'container'
        }
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
  });

  it('should add a service to the map, neither provides nor requires',
     function() {
       controller.endpointsMap = {};
       controller.addServiceToEndpointsMap('wordpress', charm);
       controller.endpointsMap.should.eql({wordpress: {
         requires: [],
         provides: []}});
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
  var app, conn, controller, destroyMe, ecs,
      env, factory, juju, utils, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-gui',
                               'juju-tests-utils',
                               'juju-tests-factory',
                               'juju-endpoints-controller',
                               'juju-controllers',
                               'datasource-local'],
    function(Y) {
      juju = Y.namespace('juju');
      utils = Y.namespace('juju-tests.utils');
      factory = Y.namespace('juju-tests.factory');
      utils.makeStubMethod(Y.juju.App.prototype, '_renderComponents');
      done();
    });
  });

  beforeEach(function() {
    destroyMe = [];
    conn = new utils.SocketStub();
    ecs = new juju.EnvironmentChangeSet();
    env = new juju.environments.GoEnvironment({
      user: 'user',
      password: 'password',
      ecs: ecs,
      conn: conn
    });
    env.connect();
    this._cleanups.push(env.close.bind(env));
    destroyMe.push(env);
    var _renderDeployerBarView = utils.makeStubMethod(
        Y.juju.App.prototype, '_renderDeployerBarView');
    this._cleanups.push(_renderDeployerBarView.reset);
    var _renderComponents = utils.makeStubMethod(
        Y.juju.App.prototype, '_renderComponents');
    this._cleanups.push(_renderComponents.reset);
    app = new Y.juju.App({
      env: env,
      consoleEnabled: true,
      charmstore: factory.makeFakeCharmstore()
    });
    app.showView(new Y.View());
    destroyMe.push(app);
    controller = app.endpointsController;
    controller.endpointsMap = {};
    destroyMe.push(controller);
  });

  afterEach(function() {
    Y.each(destroyMe, function(thing) {
      thing.destroy();
    });
  });

  it('should update endpoints map when pending services are added',
     function(done) {
       var applicationName = 'wordpress';
       var charmUrl = 'cs:precise/wordpress-2';
       app.db.charms.add({id: charmUrl});
       var charm = app.db.charms.getById(charmUrl);
       destroyMe.push(charm);
       charm.loaded = true;

       controller.on('endpointMapAdded', function() {
         controller.endpointsMap.should.eql({wordpress: {
           requires: [],
           provides: []}});
         // This will hang forever if the endpoint map doesn't update.
         done();
       });
       app.db.services.add({
         id: applicationName,
         pending: true,
         loaded: true,
         charmstore: factory.makeFakeCharmstore(),
         charm: charmUrl
       });
     });

  it('should update endpoints map when non-pending services are added',
     function(done) {
       var applicationName = 'wordpress';
       var charmUrl = 'cs:precise/wordpress-2';
       app.db.charms.add({id: charmUrl});
       var charm = app.db.charms.getById(charmUrl);
       destroyMe.push(charm);
       charm.loaded = true;

       controller.on('endpointMapAdded', function() {
         controller.endpointsMap.should.eql({wordpress: {
           requires: [],
           provides: []}});
         // This will hang forever if the endpoint map doesn't update.
         done();
       });
       app.db.services.add({
         id: applicationName,
         pending: false,
         loaded: true,
         charmstore: factory.makeFakeCharmstore(),
         charm: charmUrl
       });
     });

  it('updates subordinate value when non-pending services are added',
      function(done) {
        var applicationName = 'puppet';
        var charmUrl = 'cs:precise/puppet-2';
        app.db.charms.add({id: charmUrl, is_subordinate: true});
        var charm = app.db.charms.getById(charmUrl);
        destroyMe.push(charm);
        charm.loaded = true;

        controller.on('endpointMapAdded', function() {
          var svc = app.db.services.getById(applicationName);
          assert.isTrue(svc.get('subordinate'));
          destroyMe.push(svc);
          done();
        });

        app.db.services.add({
          id: applicationName,
          pending: false,
          loaded: true,
          charm: charmUrl
        });

      });

  it('should update endpoints map when a service\'s charm changes', function() {
    var applicationName = 'wordpress';
    var charmUrl = 'cs:precise/wordpress-2';
    app.db.charms.add({id: charmUrl});
    var charm = app.db.charms.getById(charmUrl);
    destroyMe.push(charm);
    charm.loaded = true;
    app.db.services.add({
      id: applicationName,
      pending: true,
      loaded: true,
      charm: charmUrl});
    var svc = app.db.services.getById(applicationName);
    svc.set('pending', false);
    controller.on('endpointMapAdded', function() {
      controller.endpointsMap.should.eql({wordpress: {
        requires: [],
        provides: []}});

      charmUrl = 'cs:precise/wordpress-3';
      app.db.charms.add({id: charmUrl});
      var charm2 = app.db.charms.getById(charmUrl);
      destroyMe.push(charm2);
      charm2.set('provides', {
        url: {
          'interface': 'http'
        }
      });

      charm2.loaded = true;
      svc.set('charm', charmUrl);
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
    var applicationName = 'wordpress';
    var charmUrl = 'cs:precise/wordpress-2';
    var charm = app.db.charms.add({id: charmUrl});
    destroyMe.push(charm);
    app.db.services.add({
      id: applicationName,
      loaded: true,
      charm: charmUrl});
    controller.endpointsMap = {wordpress: 'foo'};
    var service = app.db.services.getById(applicationName);
    app.db.services.remove(service);
    controller.endpointsMap.should.eql({});
  });

  it('should reset the map when the services reset', function() {
    var applicationName = 'wordpress';
    var charmUrl = 'cs:precise/wordpress-2';
    var charm = app.db.charms.add({id: charmUrl});
    destroyMe.push(charm);
    app.db.services.add({
      id: applicationName,
      loaded: true,
      charm: charmUrl});
    controller.endpointsMap = {wordpress: 'foo'};
    app.db.services.reset();
    controller.endpointsMap.should.eql({});
  });
});


describe('Application config handlers', function() {
  var Y, juju, utils, app, conn, env, controller, destroyMe;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-gui',
                               'juju-tests-utils',
                               'juju-endpoints-controller',
                               'juju-controllers',
                               'datasource-local',
                               'environment-change-set'],
    function(Y) {
      juju = Y.namespace('juju');
      utils = Y.namespace('juju-tests.utils');

      utils.makeStubMethod(Y.juju.App.prototype, '_renderComponents');
      done();
    });
  });

  beforeEach(function() {
    destroyMe = [];
    conn = new utils.SocketStub();
    var ecs = new juju.EnvironmentChangeSet();
    env = new juju.environments.GoEnvironment({
      conn: conn,
      ecs: ecs,
      user: 'user',
      password: 'password'
    });
    env.connect();
    env.set('facades', {Application: [1]});
    this._cleanups.push(env.close.bind(env));
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

  // Ensure the last message in the connection is a ServiceGet request.
  var assertServiceGetCalled = function() {
    assert.equal(1, conn.messages.length);
    var msg = conn.last_message();
    assert.strictEqual(msg.type, 'Application');
    assert.strictEqual(msg.request, 'Get');
  };

  it('should not call Application.Get when a pending service is added',
     function() {
       var charmUrl = 'cs:precise/wordpress-2';
       app.db.services.add({
         id: 'wordpress',
         pending: true,
         charm: charmUrl});
       assert.equal(0, conn.messages.length);
     });

  it('should call Application.Get when non-pending services are added',
     function() {
       var applicationName = 'wordpress';
       var charmUrl = 'cs:precise/wordpress-2';
       var charm = app.db.charms.add({id: charmUrl});
       destroyMe.push(charm);
       charm.loaded = true;
       app.db.services.add({
         id: applicationName,
         pending: false,
         charm: charmUrl});
       assertServiceGetCalled();
     });

  it('should call Application.Get when a charm changes', function() {
    var applicationName = 'wordpress';
    var charmUrl = 'cs:precise/wordpress-2';
    var charm = app.db.charms.add({id: charmUrl});
    destroyMe.push(charm);
    charm.loaded = true;
    app.db.services.add({
      id: applicationName,
      pending: false,
      charm: charmUrl});
    assertServiceGetCalled();
    var svc = app.db.services.getById(applicationName);
    charmUrl = 'cs:precise/wordpress-3';
    var charm2 = app.db.charms.add({id: charmUrl, loaded: true});
    destroyMe.push(charm2);
    svc.set('charm', charmUrl);
    assertServiceGetCalled();
  });

});
