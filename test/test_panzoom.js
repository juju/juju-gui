'use strict';

describe('pan zoom module', function() {
  var db, juju, models, viewContainer, views, Y, pz, topo, vis;

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
    var view = new views.environment({container: viewContainer, db: db});
    view.render();
    view.rendered();
    pz = view.topo.modules.PanZoomModule;
    topo = pz.get('component');
    vis = topo.vis;
  });

  afterEach(function() {
    if (viewContainer) {
      viewContainer.remove(true);
    }
  });

  function fixTranslate(translate) {
    console.log('fixtranslate', translate);
    if (Y.Lang.isArray(translate) &&
        translate[0] === 0 &&
        translate[1] === 0 &&
        Y.UA.ie) {
      return 0;
    }
    return translate;
  }
  // Test the zoom handler calculations.
  it('should handle fractional values properly in zoom scale',
     function() {
       // Floor is used so the scale will round down.
       var evt = { scale: 0.609 };
       var rescaleCalled = false;
       pz.rescale = function() {
         rescaleCalled = true;
       };
       pz.zoomHandler(evt);
       pz.slider.get('value').should.equal(61);
       assert.isTrue(rescaleCalled);
     });

  it('should have an upper limit on the slider',
     function() {
       var evt = { scale: 3.5 };
       var rescaleCalled = false;
       pz.rescale = function() {
         rescaleCalled = true;
       };
       pz.zoomHandler(evt);
       pz.slider.get('value').should.equal(200);
       assert.isTrue(rescaleCalled);
     });

  it('should have a lower limint on the slider',
     function() {
       var evt = { scale: 0.18 };
       var rescaleCalled = false;
       pz.rescale = function() {
         rescaleCalled = true;
       };
       pz.zoomHandler(evt);
       pz.slider.get('value').should.equal(25);
       assert.isTrue(rescaleCalled);
     });

  // Test the zoom calculations.
  it('should handle fractional values within the limit for rescale',
     function() {
       // Floor is used so the scale will round down.
       var evt =
           { scale: 0.609,
             translate: [0, 0]};
       var rescaled = false;
       topo.once('rescaled', function() {
         rescaled = true;
       });
       pz.rescale(evt);
       topo.get('scale').should.equal(0.609);
       var translate = fixTranslate(evt.translate);
       var expected = 'translate(' + translate + ') scale(0.609)';
       vis.attr('transform').should.equal(expected);
       assert.isTrue(rescaled);
     });

  it('should set an upper limit for rescale',
     function() {
       var evt =
           { scale: 2.1,
             translate: [0, 0]};
       var rescaled = false;
       topo.once('rescaled', function() {
         rescaled = true;
       });
       pz.rescale(evt);
       topo.get('scale').should.equal(2.0);
       var translate = fixTranslate(evt.translate);
       var expected = 'translate(' + translate + ') scale(2)';
       vis.attr('transform').should.equal(expected);
       assert.isTrue(rescaled);
     });

  it('should set a lower limit for rescale',
     function() {
       var evt =
           { scale: 0.2,
             translate: [0, 0]};
       var rescaled = false;
       topo.once('rescaled', function() {
         rescaled = true;
       });
       pz.rescale(evt);
       topo.get('scale').should.equal(0.25);
       var translate = fixTranslate(evt.translate);
       var expected = 'translate(' + translate + ') scale(0.25)';
       vis.attr('transform').should.equal(expected);
       assert.isTrue(rescaled);
     });

});
