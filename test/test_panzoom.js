'use strict';

describe('pan zoom module', function() {
  var db, juju, models, viewContainer, views, Y, pz;

  before(function() {
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
    });
  });

  beforeEach(function(done) {
    Y = YUI(GlobalConfig).use(['node',
      'juju-models',
      'juju-views',
      'juju-gui',
      'juju-env',
      'juju-tests-utils',
      'node-event-simulate'],
    function(Y) {
      viewContainer = Y.Node.create('<div />');
      viewContainer.appendTo(Y.one('body'));
      viewContainer.hide();

      db = new models.Database();
      var view = new views.environment({container: viewContainer, db: db});
      view.render();
      view.postRender();
      pz = view.topo.modules.PanZoomModule;
      done();
    });
  });

  afterEach(function() {
    viewContainer.remove(true);
  });

  it('initial values are set',
      function() {
        pz._translate.should.eql([0, 0]);
        pz._scale.should.equal(1.0);
      });

  // Test the zoom calculations.
  it('scale handles fractional values',
     function() {
       // Floor is used so the scale will round down.
       pz.zoomHandler({scale: 0.609});
       pz.slider.get('value').should.equal(60);
     });

});
