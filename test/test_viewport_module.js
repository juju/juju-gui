'use strict';

describe('viewport module', function() {
  var db, juju, models, viewContainer, views, Y, viewportModule, testUtils;
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
      testUtils = Y.namespace('juju-tests').utils;
      done();
    });
  });

  beforeEach(function() {
    viewContainer = Y.Node.create('<div />');
    viewContainer.appendTo(Y.one('body'));
    viewContainer.hide();
    db = new models.Database();
    var view = new views.environment(
        { container: viewContainer,
          db: db});
    view.render();
    view.rendered();
    viewportModule = view.topo.modules.ViewportModule;
  });

  afterEach(function() {
    if (viewContainer) {
      viewContainer.remove(true);
    }
  });

  it('aborts a resize if the canvas is not available', function() {
    var container = {
      one: testUtils.getter({'.topology-canvas': undefined}, {})
    };
    var view = new views.ViewportModule();
    view.getContainer = function() {return container;};
    // Since we do not provide most of the environment needed by "resized" we
    // know that it takes an early out if calling it does not raise an
    // exception.
    view.resized();
  });

  it('aborts a resize if the "svg" element is not available', function() {
    var container = {
      one: testUtils.getter({'svg': undefined}, {})
    };
    var view = new views.ViewportModule();
    view.getContainer = function() {return container;};
    // Since we do not provide most of the environment needed by "resized" we
    // know that it takes an early out if calling it does not raise an
    // exception.
    view.resized();
  });

  it('should fire before and after events', function() {
    var events = [];
    var topo = {
      fire: function(e) {
        events.push(e);
      },
      get: function() {}
    };
    var container = {
      one: testUtils.getter({}, {})
    };

    var view = new views.ViewportModule();
    // Provide a test container that likes to return empty objects.
    view.getContainer = function() {return container;};
    // Ignore setting dimensions, we're not testing that bit.  However, we
    // would like to know when this method is called relative to the
    // beforePageSizeRecalculation and afterPageSizeRecalculation events, so we
    // will inject a marker in the event stream.
    view.setAllTheDimentions = function () {
      events.push('setAllTheDimentions called');
    };
    // Inject a topology component that records events.
    view.set('component', topo);
    view.resized();
    events.should.eql(
        ['beforePageSizeRecalculation',
         'setAllTheDimentions called',
         'afterPageSizeRecalculation']);
  });

  it('should set canvas dimensions', function() {
    var container = viewportModule.get('container');
    var canvas = container.one('.topology-canvas');
    // Initialize to absurd dimensions.
    canvas.setStyles({height: '60px', width: '80px'});
    viewportModule.resized();
    canvas.getStyle('width').should.equal('800px');
    canvas.getStyle('height').should.equal('600px');
  });

  it('should set zoom plane dimensions', function() {
    var container = viewportModule.get('container');
    var zoomPlane = container.one('.zoom-plane');
    // Initialize to absurd dimensions.
    zoomPlane.setAttribute('width', 10);
    zoomPlane.setAttribute('height', 10);
    viewportModule.resized();
    zoomPlane.getAttribute('width').should.equal('800');
    zoomPlane.getAttribute('height').should.equal('600');
  });

  it('should set svg dimensions', function() {
    var container = viewportModule.get('container');
    var svg = container.one('svg');
    // Initialize to absurd dimensions.
    svg.setAttribute('width', 10);
    svg.setAttribute('height', 10);
    viewportModule.resized();
    svg.getAttribute('width').should.equal('800');
    svg.getAttribute('height').should.equal('600');
  });

});
