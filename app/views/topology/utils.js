/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

YUI.add('juju-topology-utils', function(Y) {

  var utils = Y.namespace('juju.topology.utils');

  /**
    Safely find the convex hull of a set of vertices - it is a TypeError to
    try to find a hull of a line of services, rather than a polygon.

    @method safeHull
    @param {array} vertices A list of vertices.
    @return {array} The convex hull of vertices.
  */
  utils.safeHull = function(vertices) {
    var hull;
    try {
      hull = d3.geom.hull(vertices);
    } catch (e) {
      hull = vertices;
    }
    return hull;
  };

  /**
    Find a point outside of a given list of vertices. This is used for placing
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

      @method _exteriorToHull
      @param {array} vertices A list of all vertices.
      @param {number} padding The padding around existing vertices in pixels.
      @return {array} An x/y coordinate pair.
    */
    function _exteriorToHull(vertices, padding) {
      var hull = utils.safeHull(vertices);

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

    // d3.geom.hull, used by _exteriorToHull() requires at least three points.
    // We can solve other cases easily.
    switch (vertices.length) {
      case 0:
        // Default to padding away from the origin.
        return [padding, padding];
      case 1:
        // Pad to the right of the existing service.
        return [vertices[0][0] + padding, vertices[0][1]];
      case 2:
        // Pad to the right of the right-most existing service.
        return [
          (vertices[0][0] > vertices[1][0] ?
           vertices[0][0] : vertices[1][0]) + padding,
          (vertices[0][1] > vertices[1][1] ?
           vertices[0][1] : vertices[1][1])
        ];
      default:
        // Pad to the right of the convex hull of existing services
        // (specifically the service furthest from the origin).
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
      var center = box.center || [false, false];
      // Default undefined x/y attributes to 0.
      return [center[0] || box.x || 0, center[1] || box.y || 0];
    });
  };

  /**
    Given a set of vertices, find the centroid and pan to that location.

    @method centroid
    @param {array} vertices A list of vertices in the form [x, y].
    @return {array} an x/y coordinate pair for the centroid.
  */
  utils.centroid = function(vertices) {
    var centroid = [];
    switch (vertices.length) {
      case 0:
        centroid = [0, 0];
        break;
      case 1:
        centroid = vertices[0];
        break;
      case 2:
        centroid = [
          vertices[0][0] - ((vertices[0][0] - vertices[1][0]) / 2),
          vertices[0][1] - ((vertices[0][1] - vertices[1][1]) / 2)
        ];
        break;
      default:
        centroid = d3.geom.polygon(utils.safeHull(vertices)).centroid();
        // In the case of services being deployed in a line, centroid will be
        // [NaN, NaN]; in this case, find the outermost two services and
        // generate the centroid using the two-vertex case above.
        if (isNaN(centroid[0]) || isNaN(centroid[1])) {
          var min = vertices[0], max = vertices[0];
          vertices.forEach(function(vertex) {
            if (vertex[0] < min[0] && vertex[1] < min[1]) {
              min = vertex;
            }
            if (vertex[0] > max[0] && vertex[1] > max[1]) {
              max = vertex;
            }
          });
          centroid = utils.centroid([min, max]);
        }
    }
    return centroid;
  };

  utils.getBoundingBox = function(vertices, boxWidth, boxHeight) {
    var minX = Infinity, maxX = -Infinity,
        minY = Infinity, maxY = -Infinity;

    vertices.forEach(function(v) {
      if (v[0] < minX) { minX = v[0]; }
      if (v[1] < minY) { minY = v[1]; }
      if (v[0] > maxX) { maxX = v[0]; }
      if (v[1] > maxY) { maxY = v[1]; }
    });
    return {
      translateX: minX - boxWidth / 2, translateY: minY - boxHeight / 2,
      w: maxX - minX + boxWidth, h: maxY - minY + boxHeight};
  };

  /**
   * Find the center point of two existing points specified.
   *
   * @method findCenterPoint
   * @param {Array} one The first point to use. Array of x,y coords.
   * @param {Array} two The second point to use. Array of x,y coords.
   * @return {Array} The x,y of the center of the line between the two points.
   *
   */
  utils.findCenterPoint = function(one, two) {
    var points = [
      Math.max(one[0], two[0]) - Math.abs((one[0] - two[0]) / 2),
      Math.max(one[1], two[1]) - Math.abs((one[1] - two[1]) / 2)
    ];
    return points;
  };

  /**
   * Find the x,y coordinates of a point taking into account zoom/offset of
   * current canvas view.
   *
   * @method locateRelativePointOnCanvas
   * @param {Object} endpoint Contains an x/y coordinate.
   * @param {Object} offset The offset view of the canvas.
   * @param {Array} scale The canvas current scale.
   *
   */
  utils.locateRelativePointOnCanvas = function(endpoint, offset, scale) {
    // Return in x,y point form. X being the left value and Y being the top
    // position.
    var updatedPoint = [
      endpoint.x * scale + endpoint.w * scale + offset[0],
      endpoint.y * scale + offset[1]
    ];
    return updatedPoint;
  };

  /**
    Convenience method for toggling on one particular visibility class and
    toggling the rest off - used in conjunction with D3's classed method.

    @method getVisibilityClasses
    @param {String} visibility The visibility class to toggle on.
    @return {Object} An object literal that can be passed to D3's classed
        method.
  */
  utils.getVisibilityClasses = function(visibility) {
    var visibilities = [
      'show',
      'fade',
      'hide',
      'highlight',
      'unhighlight'
    ];
    var css = {};
    visibilities.forEach(function(v) {
      css[v] = (v === visibility);
    });
    return css;
  };

}, '0.1.0', {
  requires: [
    'd3'
  ]
});
