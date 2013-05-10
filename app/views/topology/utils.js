'use strict';

YUI.add('juju-topology-utils', function(Y) {

  var utils = Y.namespace('juju.topology.utils');

  /**
    Find a point outside of a given list of vertices, used for placing
    a new service block on an existing environment.

    @method pointOutside
    @param {array} vertices A list of all vertices.
    @param {number} padding An integer to use in padding.
    @return {array} An x/y coordinate pair.
  */
  utils.pointOutside = function(vertices, padding) {
    /**
      Helper function to return a point outside of the convex hull
      of collected vertices.

      @param {array} vertices A list of all vertices.
      @param {number} padding An integer to use in padding.
      @return {array} An x/y coordinate pair.
    */
    function _exteriorToHull(vertices, padding) {
      var hull = d3.geom.hull(vertices);

      // Find the node furthest from the origin in the set of hull vertices.
      var furthestDistance = 0, furthestVertex = [0, 0];
      Y.Array.each(hull, function(vertex) {
        var distance = Math.sqrt(
            Math.pow(vertex[0], 2) +
            Math.pow(vertex[1], 2));
        if (distance >= furthestDistance) {
          furthestDistance = distance;
          furthestVertex = vertex;
        }
      });

      // Go further than that furthest node to ensure we're outside.
      return [furthestVertex[0] + padding, furthestVertex[1]];
    }

    switch (vertices.length) {
      case 0:
        return [padding, padding];
      case 1:
        return [vertices[0][0] + padding, vertices[0][1]];
      case 2:
        return [
          (vertices[0][0] > vertices[1][0] ?
           vertices[0][0] : vertices[1][0]) + padding,
          (vertices[0][1] > vertices[1][1] ?
           vertices[0][1] : vertices[1][1])
        ];
      default:
        return _exteriorToHull(vertices, padding);
    }
  };

  /**
    Helper method to translate service boxes (or any collection of objects
    with x and y attributes) to an array of coordinate pair arrays.

    @method serviceBoxesToVertices
    @param {object} serviceBoxes An object of service boxes built in the env.
    @return {array} A list of coordinate pairs.
  */
  utils.serviceBoxesToVertices = function(serviceBoxes) {
    return Y.Array.map(Y.Object.values(serviceBoxes), function(box) {
      return [box.x, box.y];
    });
  };

}, '0.1.0', {
  requires: [
    'd3'
  ]
});
