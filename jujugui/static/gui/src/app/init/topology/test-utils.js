/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const utils = require('./utils');

describe('topology utils', () => {
  it('should translate service boxes to vertices', () => {
    const serviceBoxes = {
      one: {x: 100, y: 100},
      two: {x: 200, y: 100},
      red: {x: 100, y: 200},
      blue: {x: 200, y: 200}
    };
    const mungedBoxes = utils.serviceBoxesToVertices(serviceBoxes);
    assert.deepEqual(mungedBoxes,
      [[100, 100], [200, 100], [100, 200], [200, 200]]);
  });

  it('translates service boxes to centers coordinates', () => {
    const serviceBoxes = {
      one: {center: [10, 20]},
      two: {center: [30, 40]}
    };
    const mungedBoxes = utils.serviceBoxesToVertices(serviceBoxes);
    assert.deepEqual(mungedBoxes, [[10, 20], [30, 40]]);
  });

  it('translates service boxes falling back to vertices', () => {
    const serviceBoxes = {
      one: {center: [NaN, NaN], x: 20, y: 40},
      two: {center: [NaN, NaN], x: 100, y: 200}
    };
    const mungedBoxes = utils.serviceBoxesToVertices(serviceBoxes);
    assert.deepEqual(mungedBoxes, [[20, 40], [100, 200]]);
  });

  it('should place points outside a graph', () => {
    // Empty array returns [padding, padding].
    const existing = [];
    assert.deepEqual(utils.pointOutside(existing, 100), [100, 100]);
    // One vertex pads on x.
    existing.push([100, 100]);
    assert.deepEqual(utils.pointOutside(existing, 100), [200, 100]);
    // Two vertices pads on x on the second vertex.
    existing.push([100, 200]);
    assert.deepEqual(utils.pointOutside(existing, 100), [200, 200]);
    // Three or more vertices pad on x on the furthest vertex from the origin.
    existing.push([200, 200]);
    assert.deepEqual(utils.pointOutside(existing, 100), [300, 200]);
    // Three or more services in a line do not fail.
    existing.pop();
    existing.push([100, 300]);
    assert.deepEqual(utils.pointOutside(existing, 100), [200, 300]);
  });

  it('should generate a centroid for one or more points', () => {
    // Empty array returns [0, 0].
    const existing = [];
    assert.deepEqual(utils.centroid(existing), [0, 0]);
    // One vertex returns that vertex.
    existing.push([100, 100]);
    assert.deepEqual(utils.centroid(existing), [100, 100]);
    // Two vertices returns the midpoint of that line.
    existing.push([200, 200]);
    assert.deepEqual(utils.centroid(existing), [150, 150]);
    // Three or more vertices returns the centroid of the convex hull of the
    // vertices.
    existing.push([100, 200]);
    existing.push([200, 100]);
    assert.deepEqual(utils.centroid(existing), [150, 150]);
    // Three or more vertices in a line returns the center of the line.
    existing.pop();
    existing.pop();
    existing.push([300, 300]);
    assert.deepEqual(utils.centroid(existing), [200, 200]);
  });

  it('finds the center of a line between two points', () => {
    const point_one = [0, 10],
        point_two = [0, 20];

    assert.deepEqual([0, 15], utils.findCenterPoint(point_one, point_two));
  });

  it('finds the center of a non-flat line', () => {
    const point_one = [0, 0],
        point_two = [13, 23];

    assert.deepEqual(
      [6.5, 11.5],
      utils.findCenterPoint(point_one, point_two)
    );
  });

  it('finds the center a line given decimal endpoints', () => {
    const point_one = [0, 0],
        point_two = [13.3, 23.54];

    assert.deepEqual(
      [6.65, 11.77],
      utils.findCenterPoint(point_one, point_two)
    );
  });

  it('repositions the coordinate based on offset and scale.', () => {
    const endpoint = {x: 10, y: 20, w: 5},
        offset = [13, 23],
        scale = 1.5;

    // X = 15 + 7.5 + 13
    // Y = 20 * 1.5 + 23
    assert.deepEqual(
      [35.5, 53],
      utils.locateRelativePointOnCanvas(endpoint, offset, scale)
    );
  });

  it('sets the appropriate visibility classes', () => {
    const flags = [
      'show',
      'fade',
      'hide',
      'highlight',
      'unhighlight'
    ];
    function checkFlags(trueFlag) {
      const css = utils.getVisibilityClasses(trueFlag);
      const label = trueFlag + 'ed: ';
      assert.equal(css[trueFlag], true,
        label + trueFlag + ' should be true');
      flags.forEach(function(flag) {
        if (trueFlag !== flag) {
          assert.equal(css[flag], false,
            label + flag + ' should be false');
        }
      });
    }
    flags.forEach(function(flag) {
      checkFlags(flag);
    });
  });
});
