/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

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


describe('Endpoints map handlers', function() {
  let app, destroyMe, JujuGUI;

  beforeAll(done => {
    YUI(GlobalConfig).use([
    ],
    Y => {
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

  beforeEach(() => {
    destroyMe = [];
    app = createApp(JujuGUI);
  });

  afterEach(function() {
    app.destructor();
    destroyMe.forEach(destroy => destroy.destroy());
    destroyMe = null;
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
  });
});
