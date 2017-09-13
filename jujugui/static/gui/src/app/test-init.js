/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const keysim = require('keysim');
const utils = require('../test/utils');

describe('init', () => {
  let app, container, JujuGUI;

  const createApp = config => {
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

  beforeAll(done => {
    // The module list is copied from index.html.mako and is required by
    // init.js.
    YUI(GlobalConfig).use(MODULES, Y => {
      // init.js requires the window to contain the YUI object.
      window.yui = Y;
      // The gui version is required to be set by component-renderers-mixin.js.
      window.GUI_VERSION = {version: '1.2.3'};
      // The require needs to be after the yui modules have been loaded.
      JujuGUI = require('../app/init');
      done();
    });
  });

  beforeEach(() => {
    container = utils.makeAppContainer();
    app = createApp();
  });

  afterEach(() => {
    app.destructor();
    container.remove();
  });

  it('activates the listeners for keyboard events', () => {
    const keyboard = keysim.Keyboard.US_ENGLISH;
    const keystroke = new keysim.Keystroke(keysim.Keystroke.SHIFT, 191);
    keyboard.dispatchEventsForKeystroke(keystroke, container);
    const shortcuts = document.getElementById('modal-shortcuts');
    assert.equal(shortcuts.children.length > 0, true,
      'The shortcuts component did not render');
  });
});
