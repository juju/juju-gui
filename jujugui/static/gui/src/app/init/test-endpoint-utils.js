/* Copyright (C) 2017 Canonical Ltd. */
'use strict';
/* eslint-disable */
const endpointUtils = require('./endpoint-utils');
const factory = require('./testing-factory');
const User = require('../user/user');
const utils = require('./testing-utils');

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
    ratesURL: 'http://rates.example.com/',
    termsURL: 'http://terms.example.com/',
    identityURL: 'http://identity.example.com/'
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
    YUI(GlobalConfig).use([], Y => {
      sample_env = utils.loadFixture('data/large_stream.json', true);
      sample_endpoints = utils.loadFixture('data/large_endpoints.json', true);
      // init.js requires the window to contain the YUI object.
      window.yui = Y;
      // The gui version is required to be set by component-renderers-mixin.js.
      window.GUI_VERSION = {version: '1.2.3'};
      require('../yui-modules');
      window.yui.use(window.MODULES, function() {
        // The require needs to be after the yui modules have been loaded.
        JujuGUI = require('../init');
        done();
      });
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
    const userClass = new User({sessionStorage: getMockStorage()});
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
});
/* eslint-enable */
