'use strict';

describe('service module', function() {
  var db, juju, models, viewContainer, views, Y, serviceModule, topo, vis;
  var called, location;
  before(function(done) {
    Y = YUI(GlobalConfig).use(['node',
      'juju-models',
      'juju-views',
      'juju-gui',
      'juju-env',
      'juju-tests-utils',
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
    location = {
      x: null,
      y: null
    };
    var env = {
      update_annotations: function(name, data) {
        called = true;
        location.x = data.x;
        location.y = data.y;
      }
    };
    var view = new views.environment({container: viewContainer, db: db, env: env});
    view.render();
    view.rendered();
    serviceModule = view.topo.modules.ServiceModule;
    topo = serviceModule.get('component');
    vis = topo.vis;
  });

  afterEach(function() {
    if (viewContainer) {
      viewContainer.remove(true);
    }
  });

  // Test the drag end handler.
  it('should set location annotations on service block drag end',
     function() {
       var d = {
         id: 'wordpress',
         x: 100.1,
         y: 200.2
       };
       serviceModule._dragend(d, 0);
       assert.isTrue(called);
       location.x.should.equal(100.1);
       location.y.should.equal(200.2);
     });

});
