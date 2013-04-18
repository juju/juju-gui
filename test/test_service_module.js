'use strict';

describe('service module annotations', function() {
  var db, juju, models, viewContainer, views, Y, serviceModule;
  var called, location;
  before(function(done) {
    Y = YUI(GlobalConfig).use(['node',
      'juju-models',
      'juju-views',
      'juju-gui',
      'node-event-simulate'],
    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
      done();
    });
  });

  beforeEach(function() {
    viewContainer = Y.Node.create('<div />');
    viewContainer.appendTo(Y.one('body'));
    viewContainer.hide();
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
  var db, juju, models, serviceModule, topo,
      view, viewContainer, views, Y;
  before(function(done) {
    Y = YUI(GlobalConfig).use(['node',
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
      done();
    });
  });

  beforeEach(function() {
    viewContainer = Y.Node.create('<div />');
    viewContainer.appendTo(Y.one('body'));
    db = new models.Database();
    db.services.add({id: 'haproxy'});
    view = new views.environment({
      container: viewContainer,
      db: db,
      env: {},
      nsRouter: {
        url: function() { return; }
      },
      getModelURL: function() {}
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
  });

  it('should toggle the service menu',
     function() {
       var box = topo.service_boxes.haproxy;
       var menu = viewContainer.one('#service-menu');
       assert.isFalse(menu.hasClass('active'));
       serviceModule.toggleServiceMenu(box);
       assert(menu.hasClass('active'));
       serviceModule.toggleServiceMenu(box);
       assert.isFalse(menu.hasClass('active'));
     });

  it('should show the service menu',
     function() {
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

  it('hides the service menu when the View entry is clicked', function() {
    var menu = clickService(viewContainer.one('.service'));
    // Click the "View" menu entry.
    menu.one('.view-service').simulate('click');
    assert.isFalse(menu.hasClass('active'));
  });

  it('hides the service menu when the Destroy entry is clicked', function() {
    var menu = clickService(viewContainer.one('.service'));
    // Click the "Destroy" menu entry.
    menu.one('.destroy-service').simulate('click');
    assert.isFalse(menu.hasClass('active'));
    // Click the "Cancel" button to close the "Destroy Service" dialog.
    Y.all('.yui3-widget-modal .btn').item(1).simulate('click');
  });

  it('must be able to view a service from the menu', function() {
    var topo = view.topo,
        requestTransition = false;

    topo.once('*:navigateTo', function() {
      requestTransition = true;
    });

    // Select a service and click it.
    var menu = clickService(viewContainer.one('.service'));
    // Click the "View" menu entry.
    menu.one('.view-service').simulate('click');
    requestTransition.should.equal(true);
  });

  it('must be able to destroy a service from the menu', function() {
    // Select a service and click it.
    var menu = clickService(viewContainer.one('.service'));
    // Click the "Destroy" menu entry.
    menu.one('.destroy-service').simulate('click');
    // Retrieve the "Destroy Service" modal dialog buttons.
    var destroyDialogButtons = Y.all('.yui3-widget-modal .btn');
    var destroyButton = destroyDialogButtons.item(0);
    var cancelButton = destroyDialogButtons.item(1);

    var serviceDestroyed = false;
    view.get('env').destroy_service = function() {
      serviceDestroyed = true;
    };

    // Clicking the destroy button removes the service from the environment.
    destroyButton.simulate('click');
    assert.isTrue(serviceDestroyed);
    // Click the "Cancel" button to close the "Destroy Service" dialog.
    cancelButton.simulate('click');
  });

  it('should prevent the Juju GUI service from being destroyed', function() {
    var service = db.services.add({
      id: 'gui',
      charm: 'cs:precise/juju-gui-7'
    });
    var box = views.BoundingBox(serviceModule, service);
    var menu = view.get('container').one('#service-menu');
    view.topo.set('active_service', service);

    serviceModule.toggleServiceMenu(box);
    menu.one('.destroy-service').hasClass('disabled').should.equal(true);
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

});
