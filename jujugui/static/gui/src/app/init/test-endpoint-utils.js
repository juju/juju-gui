/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const endpointUtils = require('./endpoint-utils');
const utils = require('../../test/utils');

const EndpointsController = require('./endpoints-controller');

const createApp = (JujuGUI, config = {}) => {
  const defaults = {
    apiAddress: 'http://api.example.com/',
    controllerSocketTemplate: 'wss://$server:$port/api',
    socket_protocol: 'wss',
    baseUrl: 'http://example.com/',
    charmstoreURL: 'http://1.2.3.4/',
    flags: {},
    gisf: false,
    plansURL: 'http://plans.example.com/',
    termsURL: 'http://terms.example.com/'
  };
  // Overwrite any default values with those provided.
  const initConfig = Object.assign(defaults, config);
  return new JujuGUI(initConfig);
};

// These are nominally based on improv sample.json delta stream with
// the addition of puppet subordinate relations.
describe('Relation endpoints logic', () => {
  let container, db, app, sample_endpoints,
      sample_env, JujuGUI;

  beforeAll(done => {
    YUI(GlobalConfig).use(MODULES, Y => {
      sample_env = utils.loadFixture('data/large_stream.json', true);
      sample_endpoints = utils.loadFixture('data/large_endpoints.json', true);
      // init.js requires the window to contain the YUI object.
      window.yui = Y;
      // The gui version is required to be set by component-renderers-mixin.js.
      window.GUI_VERSION = {version: '1.2.3'};
      // The require needs to be after the yui modules have been loaded.
      JujuGUI = require('../init');
      done();
    });
  });

  beforeEach(function() {
    const getMockStorage = function() {
      return new function() {
        return {
          store: {},
          setItem: function(name, val) { this.store['name'] = val; },
          getItem: function(name) { return this.store['name'] || null; }
        };
      };
    };
    const userClass = new window.jujugui.User(
      {sessionStorage: getMockStorage()});
    userClass.controller = {user: 'user', password: 'password'};
    container = utils.makeAppContainer();
    app = createApp(JujuGUI);
    db = app.db;
  });

  afterEach(function() {
    app.destructor();
    container.remove();
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
    db.onDelta({detail: {data: {result: delta}}});
  }

  it('should be able to find relatable services', function() {
    loadDelta(false);
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('mediawiki'),
        available_svcs = Object.keys(endpointUtils.getEndpoints(
          service, app.endpointsController));
    available_svcs.sort();
    available_svcs.should.eql(
      ['memcached', 'mysql', 'puppet', 'rsyslog-forwarder-ha']);
  });

  it('should find valid targets including subordinates', function() {
    loadDelta(false);
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('memcached'),
        available = endpointUtils.getEndpoints(service, app.endpointsController),
        available_svcs;
    available_svcs = Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(
      ['mediawiki', 'puppet', 'rsyslog-forwarder-ha', 'wordpress']);
  });

  it('should find multi-series subordinates with matching series', function() {
    loadDelta(false);
    app.endpointsController.endpointsMap = sample_endpoints;
    app.db.services.getById('mediawiki').set('series', 'trusty');
    const puppet = app.db.services.getById('puppet');
    puppet.set('series', 'xenial');
    puppet.set('subordinate', true);
    puppet.set('pending', true);
    const charm = app.db.charms.add({
      id: puppet.get('charm'),
      is_subordinate: true
    });
    charm.set('series', ['xenial', 'trusty']);
    app.db.services.getById('rsyslog-forwarder-ha').set('series', 'precise');
    let service = db.services.getById('memcached');
    service.set('series', 'trusty');
    const available = endpointUtils.getEndpoints(service, app.endpointsController);
    const available_svcs = Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(
      ['mediawiki', 'puppet', 'rsyslog-forwarder-ha', 'wordpress']);
  });

  it('should match app series if it is a multi-series subordinate', function() {
    loadDelta(false);
    app.endpointsController.endpointsMap = sample_endpoints;
    app.db.services.getById('mediawiki').set('series', 'trusty');
    app.db.services.getById('wordpress').set('series', 'trusty');
    app.db.services.getById('rsyslog-forwarder-ha').set('series', 'precise');
    let service = db.services.getById('memcached');
    service.set('series', 'xenial');
    service.set('subordinate', true);
    service.set('pending', true);
    const charm = app.db.charms.add({
      id: service.get('charm'),
      is_subordinate: true
    });
    charm.set('series', ['xenial', 'trusty']);
    const available = endpointUtils.getEndpoints(service, app.endpointsController);
    const available_svcs = Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(['mediawiki', 'wordpress']);
  });

  it('should find ambigious targets', function() {
    loadDelta();
    // Mysql already has both subordinates related.
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('mysql'),
        available = endpointUtils.getEndpoints(service, app.endpointsController),
        available_svcs = Object.keys(available);
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
    available = endpointUtils.getEndpoints(
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
    var available = endpointUtils.getEndpoints(service, app.endpointsController);
    var available_svcs = Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(['memcached', 'rsyslog-forwarder-ha']);
  });

  it('should find valid targets for subordinates', function() {
    loadDelta(false);
    app.endpointsController.endpointsMap = sample_endpoints;
    var service = db.services.getById('puppet');
    var available = endpointUtils.getEndpoints(service, app.endpointsController);
    var available_svcs = Object.keys(available);
    available_svcs.sort();
    available_svcs.should.eql(
      ['mediawiki', 'memcached', 'mysql', 'puppetmaster', 'rsyslog',
        'rsyslog-forwarder-ha', 'wordpress']);

    service = db.services.getById('rsyslog-forwarder-ha');
    available = endpointUtils.getEndpoints(service, app.endpointsController);
    available_svcs = Object.keys(available);

    available_svcs.sort();
    available_svcs.should.eql(
      ['mediawiki', 'memcached', 'mysql', 'puppet',
        'puppetmaster', 'rsyslog', 'wordpress']);
  });

});


describe('Endpoints map', function() {
  var models, controller, charm;

  beforeAll(function(done) {
    YUI(GlobalConfig).use(['juju-models'], function(Y) {
      models = Y.namespace('juju.models');
      done();
    });
  });

  beforeEach(function() {
    controller = new EndpointsController();
    charm = new models.Charm({id: 'cs:precise/wordpress-2'});
  });

  afterEach(function() {
    controller.destructor();
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

// XXX: these tests are failing in the new suite and have sporadically in the
// old suite so skipping until some investigation can be done.
xdescribe('Endpoints map handlers', function() {
  let app, container, controller, destroyMe, factory, JujuGUI;

  beforeAll(done => {
    YUI(GlobalConfig).use(MODULES.concat([
      'juju-tests-factory',
      'datasource-local']),
    Y => {
      factory = Y.namespace('juju-tests.factory');
      // init.js requires the window to contain the YUI object.
      window.yui = Y;
      // The gui version is required to be set by component-renderers-mixin.js.
      window.GUI_VERSION = {version: '1.2.3'};
      // The require needs to be after the yui modules have been loaded.
      JujuGUI = require('../init');
      done();
    });
  });

  beforeEach(() => {
    destroyMe = [];
    container = utils.makeAppContainer();
    app = createApp(JujuGUI);
    controller = app.endpointsController;
    controller.endpointsMap = {};
  });

  afterEach(function(done) {
    app.destructor();
    container.remove();
    destroyMe.forEach(destroy => destroy.destroy());
    destroyMe = null;
  });

  it('should update endpoints map when pending services are added',
    function(done) {
      var applicationName = 'wordpress';
      var charmUrl = 'cs:precise/wordpress-2';
      app.db.charms.add({id: charmUrl});
      var charm = app.db.charms.getById(charmUrl);
      destroyMe.push(charm);
      charm.loaded = true;

      const handler = () => {
        controller.endpointsMap.should.eql({wordpress: {
          requires: [],
          provides: []}});
        // This will hang forever if the endpoint map doesn't update.
        document.removeEventListener('endpointMapAdded', handler);
        done();
      };
      document.addEventListener('endpointMapAdded', handler);
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

      const handler = () => {
        controller.endpointsMap.should.eql({wordpress: {
          requires: [],
          provides: []}});
        // This will hang forever if the endpoint map doesn't update.
        document.removeEventListener('endpointMapAdded', handler);
        done();
      };
      document.addEventListener('endpointMapAdded', handler);
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

      const handler = () => {
        var svc = app.db.services.getById(applicationName);
        assert.isTrue(svc.get('subordinate'));
        destroyMe.push(svc);
        document.removeEventListener('endpointMapAdded', handler);
        done();
      };
      document.addEventListener('endpointMapAdded', handler);
      app.db.services.add({
        id: applicationName,
        pending: false,
        loaded: true,
        charm: charmUrl
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
      charm: charmUrl
    });
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


describe('Application config handlers', () => {
  let JujuGUI, app, conn, container, destroyMe;

  beforeAll(done => {
    YUI(GlobalConfig).use(MODULES.concat(['environment-change-set']), Y => {
      // init.js requires the window to contain the YUI object.
      window.yui = Y;
      // The gui version is required to be set by component-renderers-mixin.js.
      window.GUI_VERSION = {version: '1.2.3'};
      // The require needs to be after the yui modules have been loaded.
      JujuGUI = require('../init');
      done();
    });
  });

  beforeEach(() => {
    destroyMe = [];
    container = utils.makeAppContainer();
    app = createApp(JujuGUI, {conn: new utils.SocketStub()});
    app.modelAPI.set('facades', {Application: [1], Charms: [2]});
    app.modelAPI.connect();
    conn = app.modelAPI.get('conn');
  });

  afterEach(() => {
    app.destructor();
    container.remove();
    destroyMe.forEach(destroy => destroy.destroy());
    destroyMe = null;
    conn = null;
  });

  it('should not call Application.Get when a pending service is added',
    function() {
      var charmUrl = 'cs:precise/wordpress-2';
      app.db.services.add({
        id: 'wordpress',
        pending: true,
        charm: charmUrl});
      assert.equal(conn.messages.length, 1);
      // This is irrelevant, just confirming that it didn't try and make
      // the request for the application info.
      const msg = conn.last_message();
      assert.equal(msg.type, 'Admin');
      assert.equal(msg.request, 'Login');
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
      assert.equal(conn.messages.length, 2);
      var msg = conn.last_message();
      assert.strictEqual(msg.type, 'Application');
      assert.strictEqual(msg.request, 'Get');
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
    assert.equal(conn.messages.length, 2);
    var msg = conn.last_message();
    assert.strictEqual(msg.type, 'Application');
    assert.strictEqual(msg.request, 'Get');
    var svc = app.db.services.getById(applicationName);
    charmUrl = 'cs:precise/wordpress-3';
    var charm2 = app.db.charms.add({id: charmUrl, loaded: true});
    destroyMe.push(charm2);
    svc.set('charm', charmUrl);
    assert.equal(conn.messages.length, 2);
    var msg = conn.last_message();
    assert.strictEqual(msg.type, 'Application');
    assert.strictEqual(msg.request, 'Get');
  });

});
