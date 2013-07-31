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
        { path: '/charms/*charm_path/', callbacks: 'show_charm' }
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
    var appConfig = {
      api_url: 'http://google.com',
      html5: 'updated'
    },
        subappConfig,
        ConfigSubApp = Y.Base.create('config-subapp', Y.juju.SubApp, [], {
          initializer: function(cfg) {
            subappConfig = this.getAttrs();
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
        app = new ConfigApp(appConfig);

    // App config is passed to the subapp.
    assert.equal(subappConfig.api_url, 'http://google.com');
    // The hard coded config is kept over any application config.
    assert.equal(subappConfig.keepme, 'clobber');
    // Some config is blacklisted because the subapp should define their own
    // values.
    assert.equal(subappConfig.html5, 'original');
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
