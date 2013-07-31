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

describe('charm panel', function() {
  var Y, container, models, views, juju, ENTER,
      searchResult = '{"results": [{"data_url": "this is my URL", ' +
      '"name": "membase", "series": "precise", "summary": ' +
      '"Membase Server", "relevance": 8.728194117350437, ' +
      '"owner": "charmers", "store_url": "cs:precise/membase-6"}]}';

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'juju-models',
        'juju-views',
        'juju-gui',
        'juju-env',
        'juju-tests-utils',
        'node-event-simulate',
        'node',
        'event-key',
        'juju-charm-store',

        function(Y) {
          models = Y.namespace('juju.models');
          views = Y.namespace('juju.views');
          juju = Y.namespace('juju');
          ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
          done();
        });

  });

  beforeEach(function() {
    // The charms panel needs these elements
    container = Y.namespace('juju-tests.utils').makeContainer('test-container');
    container.append(
        Y.Node.create('<div id="charm-search-test">' +
        '<div id="charm-search-icon"><i></i></div>' +
                    '<div id="content"></div>' +
                    '<input type="text" id="charm-search-field" />' +
                    '</div>'));
  });

  afterEach(function() {
    Y.namespace('juju.views').CharmPanel.killInstance();
    if (container) {
      container.remove(true);
    }
  });

  it('must be able to show and hide the panel', function() {
    var panel = Y.namespace('juju.views').CharmPanel
          .getInstance({
          testing: true,
          container: container,
          app: { views: { environment: {}}}
        }),
        node = panel.node;
    panel.setActivePanelName('configuration');
    node.getStyle('display').should.equal('none');
    panel.show();
    node.getStyle('display').should.equal('block');
    panel.hide();
    node.getStyle('display').should.equal('none');
    panel.toggle();
    node.getStyle('display').should.equal('block');
    panel.toggle();
    node.getStyle('display').should.equal('none');
  });

  it('does not set config.options if config is defined', function() {
    var panel = Y.namespace('juju.views').CharmPanel
          .getInstance({
          testing: true,
          container: container,
          app: { views: { environment: {}}}
        }),
        node = panel.node;
    panel.setActivePanelName('configuration');
    var charm = {
      id: 'cs:precise/juju-gui-7',
      get: function(name) {
        if (name === 'id') {
          return 'cs:precise/juju-gui-7';
        } else if (name === 'config') {
          return {};
        }
      },
      set: function(name, value) {
        if (name === 'config') {
          assert.fail(null, null, 'config should not have been set');
        }
      }
    };
    panel.deploy(charm, undefined, function() {});
  });

  describe('service ghost', function() {
    var app, db, env, panel, serviceName, store;

    before(function() {
      serviceName = 'membase';
      // Mock the relevant environment calls.
      env = {
        deploy: function(url, service, config, config_raw, units, callback) {
          callback({err: false});
        },
        update_annotations: function(service, type, annotations, callback) {
          if (typeof callback === 'function') {
            callback({err: false});
          }
        }
      };
      // Mock the charm store.
      store = new juju.Charmworld2({
        datasource: {
          sendRequest: function(params) {
            params.callback.success({
              response: {results: [{responseText: searchResult}]}
            });
          }
        }
      });
    });

    beforeEach(function() {
      db = new models.Database();
      // Mock the base application.
      app = {db: db, views: {environment: {}}, env: env};
      panel = views.CharmPanel.getInstance({container: container, app: app});
      panel.setActivePanelName('configuration');
      panel.show();
    });

    // Search for a charm using the charm search input.
    var search = function(contents) {
      var field = Y.one('#charm-search-field');
      field.set('value', contents);
      field.simulate('keydown', {keyCode: ENTER});
    };

    // Start deploying a charm, without confirming.
    var startDeployment = function(ghostXY) {
      panel.deploy(new models.Charm({id: 'cs:precise/membase-6'}), ghostXY);
    };

    // Cancel an unconfirmed deployment.
    var cancelDeployment = function() {
      panel.node.one('.btn.cancel').simulate('click');
    };

    // Confirm a charm deployment.
    var confirmDeployment = function() {
      panel.node.one('.btn-primary').simulate('click');
    };

    it('is created in the database when deployment is started', function() {
      startDeployment();
      assert.strictEqual(1, db.services.size());
      var service = db.services.item(0);
      assert.isTrue(service.get('pending'));
      assert.include(service.get('id'), serviceName);
    });

    it('is created with x/y coordinates if set', function() {
      startDeployment({coordinates: [100, 100]});
      assert.strictEqual(1, db.services.size());
      var service = db.services.item(0);
      assert.isTrue(service.get('pending'));
      assert.include(service.get('id'), serviceName);
      assert.isTrue(service.get('hasBeenPositioned'));
      assert.equal(service.get('x'), 100);
      assert.equal(service.get('y'), 100);
    });

    it('is created with an icon if set', function() {
      startDeployment({icon: '/juju-ui/assets/images/zoom_plus.png'});
      assert.strictEqual(1, db.services.size());
      var service = db.services.item(0);
      assert.isTrue(service.get('pending'));
      assert.include(service.get('id'), serviceName);
      assert.isTrue(service.get('hasBeenPositioned'));
      assert.equal(service.get('icon'),
          '/juju-ui/assets/images/zoom_plus.png');
    });

    it('is removed from the database if deployment is cancelled', function() {
      startDeployment();
      assert.equal(db.services.size(), 1);
      cancelDeployment();
      assert.equal(db.services.size(), 0);
    });

    it('is removed from the database if another ghost is created', function() {
      // Pending services will be removed.
      db.services.add([
        {id: 'mysql', pending: true},
        {id: 'rails', pending: true}
      ]);
      // A deployed service will be preserved.
      var django = db.services.add({id: 'django', pendiong: false});
      startDeployment();
      assert.strictEqual(2, db.services.size());
      // The pending services have been removed.
      assert.isNull(db.services.getById('mysql'));
      assert.isNull(db.services.getById('rails'));
      // The deployed service has been preserved.
      assert.deepEqual(django, db.services.getById('django'));
    });

    it('updates his name on blur', function() {
      if (Y.UA.ie === 10) {
        // IE10 Can't simulate blur at time of writing.
        // See https://github.com/yui/yui3/issues/489
        return;
      }
      startDeployment();
      var serviceNameNode = Y.one('#service-name');
      assert.strictEqual(serviceName, serviceNameNode.get('value'));
      serviceNameNode.simulate('blur');
      var expected = '(' + serviceName + ')';
      assert.strictEqual(expected, db.services.item(0).get('id'));
    });

    it('is no longer ghosted on deploy', function() {
      startDeployment();
      // Fake a service drag to test that the service is cleaned on deploy.
      var service = db.services.item(0);
      service.setAttrs({'x': 123, 'y': 321});
      service.set('hasBeenPositioned', true);
      confirmDeployment();
      assert.isFalse(service.get('pending'));
      assert.include(service.get('id'), serviceName);
      // Check that annotations were set from dragging.
      var annotations = service.get('annotations');
      assert.deepEqual(annotations, {'gui-x': 123, 'gui-y': 321});
    });

  });

});
