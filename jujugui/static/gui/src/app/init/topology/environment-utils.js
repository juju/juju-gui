/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const viewUtils = require('../../views/utils');

let environmentUtils = {};

/*
 * snapToPoles if set to true will snap the relation lines to the
 * closest top, left, bottom or right edge of the service block.
 */
environmentUtils.snapToPoles = false;

/**
 * Utility object that encapsulates Y.Models and keeps their position
 * state within an SVG canvas.
 *
 * As a convenience attributes of the encapsulated model are exposed
 * directly as attributes.
 *
 * @class BoundingBox
 * @param {Module} module Service module.
 * @param {Model} model Service model.
 */

// Internal base object
var _box = {};

// Internal descriptor generator.
function positionProp(name) {
  return {
    get: function() {return this['_' + name];},
    set: function(value) {
      this['p' + name] = this['_' + name];
      this['_' + name] = parseFloat(value);
    }
  };
}

// Box Properties (and methods).
Object.defineProperties(_box, {
  x: positionProp('x'),
  y: positionProp('y'),
  w: positionProp('w'),
  h: positionProp('h'),

  pos: {
    get: function() { return {x: this.x, y: this.y, w: this.w, h: this.h};},
    set: function(value) {
      window.yui.mix(this, value, true, ['x', 'y', 'w', 'h']);
    }
  },

  translateStr: {
    get: function() { return 'translate(' + this.x + ',' + this.y + ')';}
  },

  model: {
    get: function() {
      if (!this._modelName) { return null;}
      return this.topology.serviceForBox(this);
    },
    set: function(value) {
      if (viewUtils.isValue(value)) {
        window.yui.mix(this, value.getAttrs(), true);
        this._modelName = value.name;
      }
    }
  },
  modelId: {
    get: function() { return this._modelName + '-' + this.id;}
  },
  node: {
    get: function() { return this.module.getServiceNode(this.id);}
  },
  topology: {
    get: function() { return this.module.topo || this.module.get('component');}
  },
  xy: {
    get: function() { return [this.x, this.y];}
  },
  wh: {
    get: function() { return [this.w, this.h];}
  },

  /*
   * Extract margins from the supplied module.
   */
  margins: {
    get: function() {
      if (!this.module) {
        // Used in testing.
        return {top: 0, bottom: 0, left: 0, right: 0};
      }
      if (this.subordinate) {
        return this.module.subordinate_margins;
      }
      return this.module.service_margins;
    }
  },

  /*
   * Returns the center of the box with the origin being the upper-left
   * corner of the box.
   */
  relativeCenter: {
    get: function() {
      var margins = this.margins;
      return [
        (this.w / 2) + (margins &&
                        (margins.left * this.w / 2 -
                         margins.right * this.w / 2) || 0),
        (this.h / 2) - (margins &&
                        (margins.bottom * this.h / 2 -
                         margins.top * this.h / 2) || 0)
      ];}
  },

  /*
   * Returns the absolute center of the box on the canvas.
   */
  center: {
    get: function() {
      var c = this.relativeCenter;
      c[0] += this.x;
      c[1] += this.y;
      return c;
    }
  },

  /*
   * Returns true if a given point in the form [x, y] is within the box.
   * Transform could be extracted from the topology but the current
   * arguments ease testing.
   */
  containsPoint: {
    writable: true, // For test overrides.
    configurable: true,
    value: function(point, transform) {
      transform = transform || {
        translate: function() { return [0, 0]; },
        scale: function() { return 1; }
      };
      var tr = transform.translate(),
          s = transform.scale();

      return Math.pow(((point[0] - tr[0]) / s - (this.x + this.w / 2)), 2) +
             Math.pow(((point[1] - tr[1]) / s - (this.y + this.w / 2)), 2) <=
             Math.pow(this.w / 2, 2);
    }
  },

  /*
   * Return the 50% points along each side as [x, y] pairs.
   */
  connectors: {
    get: function() {
      // Since the service nodes have a shadow that takes up a bit of
      // space on the sides and bottom of the actual node itself, add a bit
      // of a margin to the actual connecting points. The margin is specified
      // as a percentage of the width or height, as those are affected by the
      // scale. This is calculated by taking the distance of the shadow from
      // the edge of the actual shape and calculating it as a percentage of
      // the total height of the shape.
      var margins = this.margins;

      if (environmentUtils.snapToPoles) {
        return {
          top: [
            this.x + (this.w / 2),
            this.y + (margins && (margins.top * this.h) || 0)
          ],
          right: [
            this.x + this.w - (margins && (margins.right * this.w) || 0),
            this.y + (this.h / 2) - (
              margins && (margins.bottom * this.h / 2 -
                            margins.top * this.h / 2) || 0)
          ],
          bottom: [
            this.x + (this.w / 2),
            this.y + this.h - (margins && (margins.bottom * this.h) || 0)
          ],
          left: [
            this.x + (margins && (margins.left * this.w) || 0),
            this.y + (this.h / 2) - (
              margins && (margins.bottom * this.h / 2 -
                            margins.top * this.h / 2) || 0)
          ]
        };
      } else {
        return {
          center: [
            this.x + (this.w / 2),
            this.y + (this.h / 2)
          ]
        };
      }
    }
  },

  _distance: {
    value: function(xy1, xy2) {
      return Math.sqrt(Math.pow(xy1[0] - xy2[0], 2) +
                       Math.pow(xy1[1] - xy2[1], 2));
    }
  },

  /*
   * Connectors are defined on four borders, find the one closes to
   * another BoundingBox
   */
  getNearestConnector: {
    value: function(box_or_xy) {
      var connectors = this.connectors,
          result = null,
          shortest_d = Infinity,
          source = box_or_xy;

      if (box_or_xy.xy !== undefined) {
        source = box_or_xy.xy;
      }
      Object.keys(connectors).forEach(key => {
        const ep = connectors[key];
        // Take the distance of each XY pair
        var d = this._distance(source, ep);
        if (!viewUtils.isValue(result) || d < shortest_d) {
          shortest_d = d;
          result = ep;
        }
      }, this);
      return result;
    }
  },

  /*
   * Return [this.connector.XY, other.connector.XY] (in that order)
   * that as nearest to each other. This can be used to define start-end
   * points for routing.
   */
  getConnectorPair: {
    value: function(other_box) {
      var sc = this.connectors,
          oc = other_box.connectors,
          result = null,
          shortest_d = Infinity;

      Object.keys(sc).forEach(key => {
        const ep1 = sc[key];
        Object.keys(oc).forEach(key => {
          const ep2 = oc[key];
          // Take the distance of each XY pair
          var d = this._distance(ep1, ep2);
          if (!viewUtils.isValue(result) || d < shortest_d) {
            shortest_d = d;
            result = [ep1, ep2];
          }
        }, other_box);
      }, this);
      return result;
    }
  }
});

/**
  @param {Module} module Typically service module.
  @param {Model} model Model object.
  @return {BoundingBox} A Box model.
*/
function BoundingBox(module, model) {
  const b = Object.create(_box);
  b.module = module;
  b.model = model;
  return b;
}
environmentUtils.BoundingBox = BoundingBox;

/**
  Convert an Array of services into BoundingBoxes. If
  existing is supplied it should be a map of {id: box}
  and will be updated in place by merging changed attribute
  into the index.
  @param {ServiceModule} Module holding box canvas and context.
  @param {ModelList} services Service modellist.
  @param {Object} existing id:box mapping.
  @return {Object} id:box mapping.
*/
environmentUtils.toBoundingBoxes = function(module, services, existing, env) {
  var result = existing || {};
  Object.keys(result).forEach(key => {
    if (!viewUtils.isValue(services.getById(key))) {
      delete result[key];
    }
  });
  services.each(
    function(service) {
      var id = service.get('id');
      if (result[id] !== undefined) {
        result[id].model = service;
      } else {
        result[id] = new BoundingBox(module, service);
      }
      if (!service.get('icon') && service.get('charm')) {
        var icon;
        var charmId = service.get('charm');
        icon = viewUtils.getIconPath(charmId, null, env);
        service.set('icon', icon);
      }
      result[id].icon = service.get('icon');
    }
  );
  return result;
};

environmentUtils.getEffectiveViewportSize = function(primary, minwidth, minheight) {
  // Attempt to get the viewport height minus the navbar at top and
  // control bar at the bottom.
  var containerHeight,
      bottomNavbar = document.querySelector('.bottom-navbar'),
      navbar = document.querySelector('.header-banner'),
      viewport = document.querySelector('#viewport'),
      result = {height: minheight || 0, width: minwidth || 0};
  if (primary) {
    containerHeight = document.documentElement.clientHeight;
  } else {
    const body = document.body;
    const html = document.documentElement;
    containerHeight = Math.max(body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight);
  }
  // If all elements are present and the viewport is not set to display none
  const viewportHeight = viewport && window.getComputedStyle(
    viewport).getPropertyValue('width');
  if (containerHeight && navbar && viewport && viewportHeight !== 'auto') {
    result.height = containerHeight -
        (bottomNavbar ? bottomNavbar.get('offsetHeight') : 0);

    result.width = Math.floor(parseFloat(viewportHeight));

    // Make sure we don't get sized any smaller than the minimum.
    result.height = Math.max(result.height, minheight || 0);
    result.width = Math.max(result.width, minwidth || 0);
  }
  return result;
};

module.exports = environmentUtils;
