/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const ViewportModule = require('./viewport');
const testUtils = require('../../../test/utils');

describe('ViewportModule (Topology module)', function() {
  it('aborts a resize if the canvas is not available', function() {
    var container = {
      querySelector: testUtils.getter({'.topology-canvas': undefined}, {})
    };
    var view = new ViewportModule();
    view.getContainer = function() {return container;};
    // Since we do not provide most of the environment needed by "resized" we
    // know that it takes an early out if calling it does not raise an
    // exception.
    view.resized();
  });

  it('aborts a resize if the "svg" element is not available', function() {
    var container = {
      querySelector: testUtils.getter({'.the-canvas': undefined}, {})
    };
    var view = new ViewportModule();
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
      querySelector: testUtils.getter({}, {})
    };
    // Catch global custom page resize events.
    ['beforePageSizeRecalculation', 'afterPageSizeRecalculation'].forEach(
      evt => {
        document.addEventListener(evt, () => {
          events.push(evt);
        });
      });

    var view = new ViewportModule();
    // Provide a test container that likes to return empty objects.
    view.getContainer = function() {return container;};
    // Ignore setting dimensions, we're not testing that bit.  However, we
    // would like to know when this method is called relative to the
    // beforePageSizeRecalculation and afterPageSizeRecalculation events, so we
    // will inject a marker into the event stream.
    view.setAllTheDimensions = function() {
      events.push('setAllTheDimensions called');
    };
    // Inject a topology component that records events.
    view.topo = topo;
    view.resized();
    events.should.eql(
      ['beforePageSizeRecalculation',
        'setAllTheDimensions called',
        'afterPageSizeRecalculation']);
  });
});

describe('ViewportModule.setAllTheDimensions', function() {
  let view, width, height, canvas, svg, topo, zoomPlane,
      dimensions;

  beforeEach(function() {
    height = Math.floor(Math.random() * 1000);
    width = Math.floor(Math.random() * 1000);
    // Build test doubles that record height and width settings.
    topo = {
      // Default to adding 1 to each width and height so that the size
      // returned is always different than the size as viewed by the
      // setAllTheDimensions method; this will cause the viewport to be
      // centered.
      size: [width + 1, height + 1],
      vis: {}
    };
    topo.vis.attr = testUtils.setter(topo.vis);
    view = new ViewportModule();
    canvas = {style: {}};
    zoomPlane = {};
    zoomPlane.setAttribute = testUtils.setter(zoomPlane);
    svg = {};
    svg.setAttribute = testUtils.setter(svg);
    dimensions = {
      height: height,
      width: width
    };
    // Since all of the tests inspect the output of setAllTheDimensions, we can
    // just call it here and the tests will just contain assertions.
    view.setAllTheDimensions(dimensions, canvas, svg, topo, zoomPlane);
  });

  it('should set canvas dimensions', function() {
    assert.equal(canvas.style.width, width + 'px');
    assert.equal(canvas.style.height, height + 'px');
  });

  it('should set zoom plane dimensions', function() {
    assert.equal(zoomPlane.width, width);
    assert.equal(zoomPlane.height, height);
  });

  it('should set svg dimensions', function() {
    assert.equal(svg.width, width);
    assert.equal(svg.height, height);
  });

  it('should set topo dimensions', function() {
    assert.deepEqual(topo.size, [width, height]);
  });

  it('should set topo.vis dimensions', function() {
    assert.equal(topo.vis.width, width);
    assert.equal(topo.vis.height, height);
  });

  it('should center canvas', function(done) {
    let called = false;
    const handler = () => {
      document.removeEventListener('topo.panToCenter', handler);
      called = true;
      done();
    };
    document.addEventListener('topo.panToCenter', handler);
    view.setAllTheDimensions({
      height: height + 1,
      width: width + 1
    }, canvas, svg, topo, zoomPlane);
    assert.equal(called, true);
  });

  it('should not center canvas if no changes', function() {
    topo.get = function() {
      // Return just the width and height so that the viewport appears not to
      // have been resized, ensuring that the panToCenter event is not fired.
      return [width, height];
    };
    let called = false;
    const handler = () => {
      document.removeEventListener('topo.panToCenter', handler);
      called = true;
    };
    document.addEventListener('topo.panToCenter', handler);
    view.setAllTheDimensions(dimensions, canvas, svg, topo, zoomPlane);
    assert.equal(called, false);
  });
});
