'use strict';

describe('SubApplication App Extension', function() {
  var Y, juju, app, mocks, MockApp;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-routing',
                               'juju-gui', 'app-subapp-extension'],
    function(Y) {
      juju = Y.namespace('juju');
      MockApp = Y.Base.create('mock-app', Y.App,
          [Y.juju.SubAppRegistration], {});
      done();
    });

  });

  beforeEach(function() {
    app = new MockApp();

    Y.namespace('mock');

    mocks = {
      subAppRoutes: [
        { path: '/', callbacks: 'showRootView', namespace: 'charmStore' },
        { path: '/charm/:id', callbacks: 'showCharmDetailView',
          namespace: 'charmStore' }
      ],
      parentAppRoutes: [
        { path: '*', callbacks: 'check_user_credentials' },
        { path: '*', callbacks: 'show_notifications_view' },
        { path: '/charms/', callbacks: 'show_charm_collection' },
        { path: '/charms/*charm_store_path/', callbacks: 'show_charm' }
      ]
    };

    function subAppMock() {}
    subAppMock.prototype.getSubAppRoutes = function() {
      return mocks.subAppRoutes;
    };
    subAppMock.prototype.get = function(attribute) {
      if (attribute === 'urlNamespace') { return 'charmStore'; }
    };
    Y.mock.subapp = subAppMock;

    mocks.subAppProperty = {
      type: Y.mock.subapp,
      config: {}
    };
  });

  it('should supply application config to sub apps', function() {
    var app_config = {
      api_url: 'http://google.com',
      html5: 'updated'
    },
        subapp_config,
        ConfigSubApp = Y.Base.create('config-subapp', Y.juju.SubApp, [], {
          initializer: function(cfg) {
            subapp_config = this.getAttrs();
          }
        }, {
          ATTRS: {
            'keepme': {
              value: 'original'
            },
            'api_url': {},
            'html5': {
              value: 'original'
            }
          }
        }),
        ConfigApp = Y.Base.create('config-app', Y.App, [
          Y.juju.SubAppRegistration], {
          subApplications: [{
            type: ConfigSubApp,
            config: {'keepme': 'clobber'}
          }],
          initializer: function(cfg) {
            this.addSubApplications(cfg);
          }
        }),
        app = new ConfigApp(app_config);

    // App config is passed to the subapp.
    assert.equal(subapp_config.api_url, 'http://google.com');
    // The hard coded config is kept over any application config.
    assert.equal(subapp_config.keepme, 'clobber');
    // Some config is blacklisted because the subapp should define their own
    // values.
    assert.equal(subapp_config.html5, 'original');
  });

  it('should add subapps to the parent app', function() {
    app.set('routes', mocks.parentAppRoutes);
    app.addSubApp(mocks.subAppProperty.type, mocks.subAppProperty.config);
    var subapps = app.get('subApps');
    assert(typeof subapps.charmStore === 'object');
  });

  it('should extract the routes from the subapp', function() {
    app.set('subApps', [new Y.mock.subapp()]);
    assert.deepEqual(app._extractRoutes(), mocks.subAppRoutes,
        'Routes do not match');
  });

  it('should augment the parent routes with the subapp routes', function() {
    var augmentedRoutes, numberOfRoutes;

    numberOfRoutes = mocks.subAppRoutes.length + mocks.parentAppRoutes.length;
    app.set('routes', mocks.parentAppRoutes);

    augmentedRoutes = app._augmentRoutes(mocks.subAppRoutes),

    assert.equal(augmentedRoutes.length, numberOfRoutes,
        'Number of routes does not match');
  });

});
