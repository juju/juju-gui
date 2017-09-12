/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const Keysim = require('keysim');
const utils = require('./utils');

describe('init', () => {
  let app, container, JujuGUI;

  const createApp = config => {
    const defaults = {
      apiAddress: 'http://api.example.com/',
      bundleServiceURL: 'http://examle.com/bundleservice',
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
      // The require needs to be after the yui modules have been loaded.
      JujuGUI = require('../app/init');
      done();
    });
  });

  beforeEach(() => {
    container = utils.makeAppContainer();
    app = createApp();
  });

  afterAll(() => {
    app.destructor();
    container.remove();
  });

  it('activates the listeners for keyboard events', () => {
    window.GUI_VERSION = {version: '1.2.3', commit: '123abc]'};
    const keyboard = Keysim.Keyboard.US_ENGLISH;
    const keystroke = new Keysim.Keystroke(Keysim.Keystroke.SHIFT, 191);
    keyboard.dispatchEventsForKeystroke(keystroke, container);
    const shortcuts = document.getElementById('modal-shortcuts');
    assert.equal(shortcuts.children.length > 0, true,
      'The shortcuts component did not render');
  });
});
