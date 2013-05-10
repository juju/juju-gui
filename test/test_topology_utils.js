'use strict';

describe('topology utils', function() {
  var Y, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['array-extras', 'juju-topology-utils'],
        function(Y) {
          utils = Y.namespace('juju.topology.utils');
          done();
        });
  });

  it('should translate service boxes to vertices', function() {
    var serviceBoxes = {
      one: {x: 100, y: 100},
      two: {x: 200, y: 100},
      red: {x: 100, y: 200},
      blue: {x: 200, y: 200}
    };
    var mungedBoxes = utils.serviceBoxesToVertices(serviceBoxes);
    assert.deepEqual(mungedBoxes,
        [[100, 100], [200, 100], [100, 200], [200, 200]]);
  });

  it('should place points outside a graph', function() {
    // Empty array returns [padding, padding].
    var existing = [];
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
  });
});
