/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const Keysim = require('keysim');
const utils = require('./utils');

fdescribe('init', () => {
  let app, container, env, juju, JujuGUI;

  beforeAll(done => {
    // The module list is copied from index.html.mako and is required by
    // init.js.
    YUI(GlobalConfig).use([
      'acl',
      'analytics',
      'changes-utils',
      'juju-charm-models',
      'juju-bundle-models',
      'juju-controller-api',
      'juju-endpoints-controller',
      'juju-env-base',
      'juju-env-api',
      'juju-env-web-handler',
      'juju-models',
      'jujulib-utils',
      'bakery-utils',
      'net-utils',
      // juju-views group
      'd3-components',
      'juju-view-utils',
      'juju-topology',
      'juju-view-environment',
      'juju-landscape',
      // end juju-views group
      'io',
      'json-parse',
      'app-base',
      'app-transitions',
      'base',
      'bundle-importer',
      'bundle-import-notifications',
      'node',
      'model',
      'app-cookies-extension',
      'app-renderer-extension',
      'cookie',
      'querystring',
      'event-key',
      'event-touch',
      'model-controller',
      'FileSaver',
      'ghost-deployer-extension',
      'environment-change-set',
      'relation-utils',
      'yui-patches'], function(Y) {
      // init.js requires the window to contain the YUI object.
      window.yui = Y;
      window.yui.juju.views = {utils: {}};
      window.yui.juju.components = {};
      juju = Y.namespace('juju');
      Y.namespace('juju.environments');
      // The require needs to be after the yui modules have been loaded.
      JujuGUI = require('../app/init');
      done();
    });
  });

  beforeEach(() => {
    container = utils.makeAppContainer();
    const userClass = new window.jujugui.User({storage: getMockStorage()});
    userClass.controller = {user: 'user', password: 'password'};
    env = new juju.environments.GoEnvironment({
      conn: new utils.SocketStub(),
      ecs: new juju.EnvironmentChangeSet(),
      user: userClass
    });
    env.connect();
    app = new JujuGUI({
      baseUrl: 'http://example.com/',
      flags: {},
      charmstoreURL: 'http://1.2.3.4/',
      plansURL: 'http://plans.example.com/',
      termsURL: 'http://terms.example.com/',
      consoleEnabled: true,
      controllerAPI: new juju.ControllerAPI({
        conn: new utils.SocketStub(),
        user: userClass
      }),
      env: env,
      jujuCoreVersion: '2.0.0',
      controllerSocketTemplate: '',
      user: userClass
    });
  });

  afterAll(done => {
    env.close(() => {
      app.destructor();
      container.remove(true);
      done();
    });
  });

  const getMockStorage = () => {
    return () => {
      return {
        store: {},
        setItem: (name, val) => {this.store.name = val;},
        getItem: name => this.store.name || null
      };
    };
  };

  it('should listen for keyboard events', function() {
    window.GUI_VERSION = {version: '1.2.3', commit: '123abc]'};
    const keyboard = Keysim.Keyboard.US_ENGLISH;
    const keystroke = new Keysim.Keystroke(Keysim.Keystroke.SHIFT, 191);
    keyboard.dispatchEventsForKeystroke(keystroke, container);
    const shortcuts = document.getElementById('modal-shortcuts');
    assert.equal(shortcuts.children.length > 0, true,
      'The shortcuts component did not render');
  });
});
