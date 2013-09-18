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

describe('service module annotations', function() {
  var db, juju, models, utils, viewContainer, views, Y, serviceModule;
  var called, location;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'juju-gui',
      'juju-models',
      'juju-tests-utils',
      'juju-views',
      'node',
      'node-event-simulate'],
    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      done();
    });
  });

  beforeEach(function() {
    viewContainer = utils.makeContainer();
    db = new models.Database();
    called = false;
    location =
        { 'gui-x': 0,
          'gui-y': 0};
    var env = {
      update_annotations: function(name, type, data) {
        called = true;
        location['gui-x'] = data['gui-x'];
        location['gui-y'] = data['gui-y'];},
      get: function() {}};
    var view = new views.environment(
        { container: viewContainer,
          db: db,
          env: env});
    view.render();
    view.rendered();
    serviceModule = view.topo.modules.ServiceModule;
    serviceModule.set('useTransitions', false);
  });

  afterEach(function() {
    if (viewContainer) {
      viewContainer.remove(true);
    }
  });

  // Test the drag end handler.
  it('should set location annotations on service block drag end',
     function() {
       var d =
           { id: 'wordpress',
             inDrag: true,
             x: 100.1,
             y: 200.2};
       serviceModule.dragend(d, serviceModule);
       assert.isTrue(called);
       location['gui-x'].should.equal(100.1);
       location['gui-y'].should.equal(200.2);
     });

  it('should not set annotations on drag end if building a relation',
     function() {
       var d =
           { id: 'wordpress',
             x: 100.1,
             y: 200.2};
       var topo = serviceModule.get('component');
       topo.buildingRelation = true;
       serviceModule.dragend(d, serviceModule);
       assert.isFalse(called);
       location['gui-x'].should.equal(0);
       location['gui-y'].should.equal(0);
     });
});


describe('service module events', function() {
  var db, charm, fakeStore, juju, models, serviceModule, topo, utils,
      view, viewContainer, views, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['node',
      'juju-tests-utils',
      'juju-landscape',
      'juju-models',
      'juju-views',
      'juju-gui',
      'node-event-simulate',
      'slider'],
    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
      utils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  beforeEach(function() {
    fakeStore = new Y.juju.charmworld.APIv2({});
    fakeStore.iconpath = function() {
      return 'charm icon url';
    };
    viewContainer = utils.makeContainer('content');
    var charmData = utils.loadFixture('data/haproxy-api-response.json', true);
    charm = new models.Charm(charmData.charm);
    db = new models.Database();
    db.services.add({id: 'haproxy', charm: 'cs:precise/haproxy-18'});
    db.charms.add(charm);
    view = new views.environment({
      container: viewContainer,
      db: db,
      env: {
        update_annotations: function() {},
        get: function() {}
      },
      nsRouter: {
        url: function() { return; }
      },
      store: fakeStore
    });
    view.render();
    view.rendered();
    topo = view.topo;
    serviceModule = topo.modules.ServiceModule;
  });

  afterEach(function() {
    if (viewContainer) {
      viewContainer.remove(true);
    }

    fakeStore.destroy();
    charm.destroy();
    db.destroy();
    topo.destroy();
    view.destroy();
  });

  it('should show the service menu', function() {
    var box = topo.service_boxes.haproxy;
    var menu = viewContainer.one('#service-menu');
    assert.isFalse(menu.hasClass('active'));
    serviceModule.showServiceMenu(box);
    assert(menu.hasClass('active'));
    // Check no-op.
    serviceModule.showServiceMenu(box);
    assert(menu.hasClass('active'));
  });

  it('should show the service menu with conditional landscape items',
     function() {
       var box = topo.service_boxes.haproxy;
       var service = db.services.getById('haproxy');
       var menu = viewContainer.one('#service-menu');
       var landscape = new views.Landscape();
       landscape.set('db', db);

       topo.set('landscape', landscape);
       db.environment.set('annotations', {
         'landscape-url': 'http://host',
         'landscape-computers': '/foo',
         'landscape-reboot-alert-url': '+reboot'
       });
       service['landscape-needs-reboot'] = true;
       service.set('annotations', {
         'landscape-computers': '/bar'
       });

       assert.isFalse(menu.hasClass('active'));
       serviceModule.showServiceMenu(box);
       assert(menu.hasClass('active'));
       // Check no-op.
       serviceModule.showServiceMenu(box);
       assert(menu.hasClass('active'));

       // Verify that we have a reboot URL.
       var rebootItem = menu.one('.landscape-reboot');
       rebootItem.one('a').get('href').should.equal(
           'http://host/foo/bar/+reboot');
     });


  it('should hide the service menu',
     function() {
       var box = topo.service_boxes.haproxy;
       var menu = viewContainer.one('#service-menu');
       serviceModule.showServiceMenu(box);
       assert(menu.hasClass('active'));
       serviceModule.hideServiceMenu();
       assert.isFalse(menu.hasClass('active'));
       // Check no-op.
       serviceModule.hideServiceMenu();
       assert.isFalse(menu.hasClass('active'));
     });

  // Click the provided service so that the service menu is shown.
  // Return the service menu.
  var clickService = function(service) {
    // Monkeypatch to avoid the click event handler bailing out early.
    topo.service_boxes.haproxy.containsPoint = function() {
      return true;
    };
    // Click the service.
    service.simulate('click');
    return viewContainer.one('#service-menu');
  };

  it('should not show the service menu after the service is double-clicked',
     function() {
       var service = viewContainer.one('.service');
       var menu = clickService(service);

       // Ideally the browser would not send the click event right away...
       assert(menu.hasClass('active'));
       service.simulate('dblclick');
       assert.isFalse(menu.hasClass('active'));
     });

  it('should handle touch/click events properly', function() {
    var service = viewContainer.one('.service');
    var menu = viewContainer.one('#service-menu');
    assert.isFalse(menu.hasClass('active'));
    serviceModule._touchstartServiceTap({
      currentTarget: service,
      touches: [{PageX: 0, PageY: 0}]
    }, topo);
    // Touch events should also fire click events, which will be ignored.
    // Fire one manually here.
    clickService(service);
    assert(menu.hasClass('active'));
  });

  it('must not process service clicks after a dragend', function() {
    // Test the work-around that prevents serviceClick from doing its work if
    // called after dragend.  Behaviour-driven testing via a tool such as
    // Selenium will add more coverage.
    var topo = view.topo;
    var called = false;
    var d =
        { id: 'wordpress',
          containsPoint: function() { return true; }
        };
    serviceModule.fake = function() { called = true; };
    serviceModule.set('currentServiceClickAction', 'fake');
    topo.ignoreServiceClick = true;
    serviceModule.serviceClick(d, serviceModule);
    assert.isFalse(called);
    // The flag is reset when encountered and ignored.
    assert.isFalse(topo.ignoreServiceClick);
  });

  it('should show only visible services', function() {
    var haproxy = db.services.getById('haproxy'); // Added in beforeEach.
    db.services.add([
      {id: 'rails', life: 'dying'},
      {id: 'mysql', life: 'dead'}
    ]);
    var django = db.services.add({id: 'django'});
    var wordpress = db.services.add({
      id: 'wordpress',
      life: 'dying',
      aggregated_status: {error: 42}
    });
    serviceModule.update();
    var boxes = topo.service_boxes;
    // There are five services in total.
    assert.strictEqual(5, db.services.size(), 'total');
    // But only three of those are actually displayed.
    assert.strictEqual(3, Y.Object.size(boxes), 'displayed');
    // And they are the visible ones.
    assert.deepPropertyVal(boxes, 'haproxy.model', haproxy);
    assert.deepPropertyVal(boxes, 'django.model', django);
    // Service wordpress is displayed because it has units in an error state.
    assert.deepPropertyVal(boxes, 'wordpress.model', wordpress);
  });

  it('should deploy a service on charm token drop events', function(done) {
    var localContainer = utils.makeContainer(),
        src = '/juju-ui/assets/svgs/service_health_mask.svg',
        preventCount = 0,
        fakeEventObject = {
          halt: function() {
            preventCount += 1;
          },
          _event: {
            dataTransfer: {
              getData: function(name) {
                return JSON.stringify({
                  charmData: '{"id": "cs:foo/bar-1"}',
                  dataType: 'charm-token-drag-and-drop',
                  iconSrc: src
                });
              }
            },
            target: {},
            clientX: 155,
            clientY: 153
          }
        };
    // this will be removed by the canvas drop handler
    localContainer.setAttribute('id', 'foo');
    localContainer.append('<img>').setAttribute('src', src);

    var eventHandle = Y.on('initiateDeploy', function(charm, ghostAttributes) {
      eventHandle.detach();
      // After the translation and calculations the above x and y coords should
      // place the element at 320, 392
      assert.deepEqual(ghostAttributes, {
        coordinates: [320, 392],
        icon: src
      });
      // Make sure that the drag and drop was properly prevented.
      assert.equal(preventCount, 1);
      done();
    });
    serviceModule.set('component', topo);
    serviceModule.canvasDropHandler(fakeEventObject);
  });

});
