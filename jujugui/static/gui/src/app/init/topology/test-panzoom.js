/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PanZoomModule = require('./panzoom.js');

describe('pan zoom module', () => {
  let pz, topo, vis;

  beforeEach(() => {
    pz = new PanZoomModule();
    vis = {
      attr: sinon.stub()
    };
    topo = {
      get: sinon.stub(),
      set: sinon.stub(),
      vis: vis,
      zoom: {
        scale: sinon.stub(),
        translate: sinon.stub()
      }
    };
    pz.topo = topo;
    pz.toScale = sinon.stub();
  });

  const checkRescale = evt => {
    topo.get.withArgs('translate').returns(evt.translate);
    topo.get.withArgs('scale').returns(evt.scale);
    pz.toScale.returns(evt.scale);
    pz.rescale(evt);
    assert.equal(topo.set.callCount, 2);
    assert.equal(topo.set.args[0][1], evt.scale);
    assert.deepEqual(topo.set.args[1][1], evt.translate);
    assert.equal(vis.attr.callCount, 1);
    const expected = `translate(${evt.translate}) scale(${evt.scale})`;
    assert.equal(vis.attr.args[0][1], expected);
  };

  // Test the zoom calculations.
  it('should handle fractional values within the limit for rescale', () => {
    // Floor is used so the scale will round down.
    const evt = {
      scale: 0.609,
      translate: [0, 0]
    };
    checkRescale(evt);
  });

  it('should set an upper limit for rescale', () => {
    const evt = {
      scale: 2.1,
      translate: [0, 0]
    };
    checkRescale(evt);
  });

  it('should set a lower limit for rescale', () => {
    const evt = {
      scale: 0.2,
      translate: [0, 0]
    };
    checkRescale(evt);
  });

  it('must be able to handle zoom in events', () => {
    topo.get.withArgs('scale').returns(1);
    topo.get.withArgs('size').returns([1, 1]);
    topo.zoom.translate.returns([1, 1]);
    pz.rescale = sinon.stub();
    // We're not rendering the app so the events aren't available, so just test
    // the methods directly.
    pz.zoom_in();
    // Ensure that, after simulating the zoom in, that the topology scale
    // has been upped by 0.2.
    assert.equal(pz.rescale.callCount, 1);
    assert.deepEqual(pz.rescale.args[0][0], {
      scale: 1.2,
      translate: [0.9, 0.9]
    });
  });

  it('must be able to handle zoom out events', () => {
    topo.get.withArgs('scale').returns(1);
    topo.get.withArgs('size').returns([1, 1]);
    topo.zoom.translate.returns([1, 1]);
    pz.rescale = sinon.stub();
    // We're not rendering the app so the events aren't available, so just test
    // the methods directly.
    pz.zoom_out();
    // Ensure that, after simulating the zoom ouy, that the topology scale
    // has been reduced by 0.2.
    assert.deepEqual(pz.rescale.args[0][0], {
      scale: 0.8,
      translate: [1.1, 1.1]
    });
  });
});
