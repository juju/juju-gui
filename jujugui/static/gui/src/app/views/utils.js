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


/**
 * The view utils.
 *
 * @module views
 * @submodule views.utils
 */
YUI.add('juju-view-utils', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils');

  /**
    global utils functions

    @class utils
  */

  /*jshint bitwise: false*/
  /**
    Create a hash of a string. From stackoverflow: http://goo.gl/PEOgF

    @method generateHash
    @param {String} value The string to hash.
    @return {Integer} The hash of the string.
   */
  var generateHash = function(value) {
    return value.split('').reduce(
        function(hash, character) {
          hash = ((hash << 5) - hash) + character.charCodeAt(0);
          return hash & hash;
        },
        0
    );
  };
  /*jshint bitwise: true*/
  utils.generateHash = generateHash;

  /**
    Create a stable, safe DOM id given an arbitrary string.
    See details and discussion in
    https://bugs.launchpad.net/juju-gui/+bug/1167295

    @method generateSafeDOMId
    @param {String} value The string to hash.
    @param {String} parentId An optional id for the parent module or node
      for instances in which a 'value' may have duplicates in other areas.
    @return {String} The calculated DOM id.
   */
  var generateSafeDOMId = function(value, parentId) {
    parentId = parentId || '';
    return (
        'e-' + value.replace(/\W/g, '_') + '-' +
        generateHash(value + parentId));
  };
  utils.generateSafeDOMId = generateSafeDOMId;

  var timestrings = {
    prefixAgo: null,
    prefixFromNow: null,
    suffixAgo: 'ago',
    suffixFromNow: 'from now',
    seconds: 'less than a minute',
    minute: 'about a minute',
    minutes: '%d minutes',
    hour: 'about an hour',
    hours: 'about %d hours',
    day: 'a day',
    days: '%d days',
    month: 'about a month',
    months: '%d months',
    year: 'about a year',
    years: '%d years',
    wordSeparator: ' ',
    numbers: []
  };

  /**
    Generate a human-readable presentation value for an integer, rounding
    to the largest of ones, thousands (K), millions (M), or billions (B).

    @method humanizeNumber
    @param {Integer} n The source number.
    @return {String} The presentation value.
  */
  var humanizeNumber = function(n) {
    var units = [[1000, 'K'],
          [1000000, 'M'],
          [1000000000, 'B']],
        result = n;

    Y.each(units, function(sizer) {
      var threshold = sizer[0],
          unit = sizer[1];
      if (n > threshold) {
        result = (n / threshold);
        if (n % threshold !== 0) {
          result = result.toFixed(1);
        }
        result = result + unit;
      }
    });
    return result;
  };
  utils.humanizeNumber = humanizeNumber;

  /**
    Determine whether a SVG node has a given CSS class name.

    @method hasSVGClass
    @param {Object} selector A YUI-wrapped SVG node.
    @param {String} class_name The class name to look for.
    @return {Boolean} Whether the selector has the class name.
  */
  var hasSVGClass = function(selector, class_name) {
    var classes = selector.getAttribute('class');
    if (!classes) {
      return false;
    }
    return classes.indexOf(class_name) !== -1;
  };
  utils.hasSVGClass = hasSVGClass;

  /**
    Add a CSS class name to a SVG node or to all the nodes matching the
    selector.

    @method addSVGClass
    @param {Object} selector A YUI-wrapped SVG node or a selector string used
      with Y.all that must return only SVG nodes.
    @param {String} class_name The class name to add.
    @return {Undefined} Mutates only.
  */
  var addSVGClass = function(selector, class_name) {
    var self = this;
    if (!selector) {
      return;
    }

    if (typeof(selector) === 'string') {
      Y.all(selector).each(function(n) {
        var classes = this.getAttribute('class');
        if (!self.hasSVGClass(this, class_name)) {
          this.setAttribute('class', classes + ' ' + class_name);
        }
      });
    } else {
      var classes = selector.getAttribute('class');
      if (!self.hasSVGClass(selector, class_name)) {
        selector.setAttribute('class', classes + ' ' + class_name);
      }
    }
  };
  utils.addSVGClass = addSVGClass;

  /**
    Remove a CSS class name from a SVG node or from all the nodes matching the
    selector.

    @method removeSVGClass
    @param {Object} selector A YUI-wrapped SVG node or a selector string used
      with Y.all that must return only SVG nodes.
    @param {String} class_name The class name to remove.
    @return {Undefined} Mutates only.
  */
  var removeSVGClass = function(selector, class_name) {
    if (!selector) {
      return;
    }

    if (typeof(selector) === 'string') {
      Y.all(selector).each(function() {
        var classes = this.getAttribute('class');
        this.setAttribute('class', classes.replace(class_name, ''));
      });
    } else {
      var classes = selector.getAttribute('class');
      selector.setAttribute('class', classes.replace(class_name, ''));
    }
  };
  utils.removeSVGClass = removeSVGClass;

  /**
    Set a state class on a node.

    @method setStateClass
    @param {String} newState the new state to set.
  */
  var setStateClass = function(node, newState) {
    var existing = node.get('className').split(' ');
    // Remove old state classes.
    existing.forEach(function(className) {
      if (className.indexOf('state-') === 0) {
        node.removeClass(className);
      }
    });
    node.addClass('state-' + newState);
  };
  utils.setStateClass = setStateClass;

  var consoleManager = function() {
    var noop = function() {};
    var winConsole = window.console,
        // These are the available methods.
        // Add more to this list if necessary.
        consoleNoop = {
          group: noop,
          groupEnd: noop,
          groupCollapsed: noop,
          time: noop,
          timeEnd: noop,
          log: noop,
          info: noop,
          error: noop,
          debug: noop,
          warn: noop
        };

    if (winConsole === undefined) {
      window.console = consoleNoop;
      winConsole = consoleNoop;
    }
    return {
      native: function() {
        window.console = winConsole;
      },
      noop: function() {
        window.console = consoleNoop;
      },
      console: function(x) {
        if (!arguments.length) {
          return consoleNoop;
        }
        consoleNoop = x;
        return x;
      }
    };
  };
  utils.consoleManager = consoleManager;
  // Also assign globally to manage the actual console.
  window.consoleManager = consoleManager();

  /**
    Convert a UNIX timestamp to a human readable version of approximately how
    long ago it was from now.

    Ported from https://github.com/rmm5t/jquery-timeago.git to YUI
    w/o the watch/refresh code

    @method humanizeTimestamp
    @param {Number} t The timestamp.
    @return {String} The presentation of the timestamp.
  */
  var humanizeTimestamp = function(t) {
    var l = timestrings,
        prefix = l.prefixAgo,
        suffix = l.suffixAgo,
        distanceMillis = Y.Lang.now() - t,
        seconds = Math.abs(distanceMillis) / 1000,
        minutes = seconds / 60,
        hours = minutes / 60,
        days = hours / 24,
        years = days / 365;

    /*
      Given a number and a way to convert the number to a string that is a
      template or a function producing a template string, return the template
      substituted with the number.

      Internal helper function to humanizeTimestamp, intentionally not
      formatted to be included in exported docs.
    */
    function substitute(stringOrFunction, number) {
      var string = Y.Lang.isFunction(stringOrFunction) ?
          stringOrFunction(number, distanceMillis) : stringOrFunction,
          value = (l.numbers && l.numbers[number]) || number;
      return string.replace(/%d/i, value);
    }

    var words = seconds < 45 && substitute(l.seconds, Math.round(seconds)) ||
        seconds < 90 && substitute(l.minute, 1) ||
        minutes < 45 && substitute(l.minutes, Math.round(minutes)) ||
        minutes < 90 && substitute(l.hour, 1) ||
        hours < 24 && substitute(l.hours, Math.round(hours)) ||
        hours < 42 && substitute(l.day, 1) ||
        days < 30 && substitute(l.days, Math.round(days)) ||
        days < 45 && substitute(l.month, 1) ||
        days < 365 && substitute(l.months, Math.round(days / 30)) ||
        years < 1.5 && substitute(l.year, 1) ||
        substitute(l.years, Math.round(years));

    return Y.Lang.trim([prefix, words, suffix].join(' '));
  };
  views.humanizeTimestamp = humanizeTimestamp;

  Y.Handlebars.registerHelper('humanizeTime', function(text) {
    if (!text || text === undefined) {return '';}
    return new Y.Handlebars.SafeString(humanizeTimestamp(Number(text)));
  });
  var JujuBaseView = Y.Base.create('JujuBaseView', Y.Base, [], {

    bindModelView: function(model) {
      model = model || this.get('model');
      // If this view has a model, bubble model events to the view.
      if (model) {
        model.addTarget(this);
      }

      // If the model gets swapped out, reset targets accordingly and rerender.
      this.after('modelChange', function(ev) {
        if (ev.prevVal) {
          ev.prevVal.removeTarget(this);
        }
        if (ev.newVal) {
          ev.newVal.addTarget(this);
        }
        this.render();
      });

      // Re-render this view when the model changes, and after it is loaded,
      // to support "loaded" flags.
      this.after(['*:change', '*:load'], this.render, this);
    },

    renderable_charm: function(charm_name, db, getModelURL) {
      var charm = db.charms.getById(charm_name);
      if (charm) {
        var result = charm.getAttrs();
        result.app_url = getModelURL(charm);
        return result;
      }
      return null;
    }

  });

  views.JujuBaseView = JujuBaseView;


  views.createModalPanel = function(
      body_content, render_target, action_label, action_cb) {
    var panel = new Y.Panel({
      bodyContent: body_content,
      width: 400,
      zIndex: 5,
      centered: true,
      show: false,
      classNames: 'modal',
      modal: true,
      render: render_target,
      buttons: []
    });
    if (action_label && action_cb) {
      views.setModalButtons(panel, action_label, action_cb);
    }
    return panel;
  };

  views.setModalButtons = function(panel, action_label, action_cb) {
    panel.set('buttons', []);
    panel.addButton(
        { value: action_label,
          section: Y.WidgetStdMod.FOOTER,
          action: action_cb,
          classNames: ['button']
        });
    panel.addButton(
        { value: 'Cancel',
          section: Y.WidgetStdMod.FOOTER,
          action: function(e) {
            e.preventDefault();
            panel.hide();
          },
          classNames: ['button']
        });

    // The default YUI CSS conflicts with the CSS effect we want.
    panel.get('boundingBox').all('.yui3-button').removeClass('yui3-button');
    return panel;
  };

  /**
     Check whether or not the given relationId represents a PyJuju relation.

     @method isPythonRelation
     @static
     @param {String} relationId The relation identifier.
     @return {Bool} True if the id represents a PyJuju relation,
      False otherwise.
   */
  utils.isPythonRelation = function(relationId) {
    var regex = /^relation-\d+$/;
    return regex.test(relationId);
  };

  utils.getRelationDataForService = function(db, service) {
    // Return a list of objects representing the `near` and `far`
    // endpoints for all of the relationships `rels`.  If it is a peer
    // relationship, then `far` will be undefined.
    var service_name = service.get('id');
    return Y.Array.map(
        db.relations.get_relations_for_service(service),
        function(relation) {
          var rel = relation.getAttrs(),
              near,
              far;
          if (rel.endpoints[0][0] === service_name) {
            near = rel.endpoints[0];
            far = rel.endpoints[1]; // undefined if a peer relationship.
          } else {
            near = rel.endpoints[1];
            far = rel.endpoints[0];
          }
          rel.near = {
            service: near[0],
            serviceName: service.get('name'),
            role: near[1].role,
            name: near[1].name
          };
          var farService;
          // far will be undefined or the far endpoint service.
          if (far) {
            var id = far[0];
            farService = {
              service: id,
              serviceName: db.services.getById(id).get('name'),
              role: far[1].role,
              name: far[1].name
            };
          }
          rel.far = farService;
          var relationId = rel.relation_id;
          if (utils.isPythonRelation(relationId)) {
            // This is a Python relation id.
            var relNumber = relationId.split('-')[1];
            rel.ident = near[1].name + ':' + parseInt(relNumber, 10);
          } else {
            // This is a Juju Core relation id.
            rel.ident = relationId;
          }
          rel.elementId = generateSafeDOMId(rel.relation_id);
          return rel;
        });
  };

  /**
    Takes two string endpoints and splits it into usable parts.

    @method parseEndpointStrings
    @param {Database} db to resolve charms/services on.
    @param {Array} endpoints an array of endpoint strings
      to split in the format wordpress:db.
    @return {Object} An Array of parsed endpoints, each containing name, type
    and the related charm. Name is the user defined service name and type is
    the charms authors name for the relation type.
   */
  utils.parseEndpointStrings = function(db, endpoints) {
    return Y.Array.map(endpoints, function(endpoint) {
      var epData = endpoint.split(':');
      var result = {};
      if (epData.length > 1) {
        result.name = epData[0];
        result.type = epData[1];
      } else {
        result.name = epData[0];
      }
      result.service = db.services.getById(result.name);
      if (result.service) {
        result.charm = db.charms.getById(
            result.service.get('charm'));
        if (!result.charm) {
          console.warn('Failed to load charm',
                       result.charm, db.charms.size(), db.charms.get('id'));
        }
      } else {
        console.warn('failed to resolve service', result.name);
      }
      return result;
    }, this);
  };

  /**
    Loops through the charm endpoint data to determine whether we have a
    relationship match. The result is either an object with an error
    attribute, or an object giving the interface, scope, providing endpoint,
    and requiring endpoint.

    @method findEndpointMatch
    @param {Array} endpoints Pair of two endpoint data objects.  Each
    endpoint data object has name, charm, service, and scope.
    @return {Object} A hash with the keys 'interface', 'scope', 'provides',
    and 'requires'.
   */
  utils.findEndpointMatch = function(endpoints) {
    var matches = [], result;
    Y.each([0, 1], function(providedIndex) {
      // Identify the candidates.
      var providingEndpoint = endpoints[providedIndex];
      // The merges here result in a shallow copy.
      var provides = Y.merge(providingEndpoint.charm.get('provides') || {}),
          requiringEndpoint = endpoints[!providedIndex + 0],
          requires = Y.merge(requiringEndpoint.charm.get('requires') || {});
      if (!provides['juju-info']) {
        provides['juju-info'] = {'interface': 'juju-info',
                                  scope: 'container'};
      }
      // Restrict candidate types as tightly as possible.
      var candidateProvideTypes, candidateRequireTypes;
      if (providingEndpoint.type) {
        candidateProvideTypes = [providingEndpoint.type];
      } else {
        candidateProvideTypes = Y.Object.keys(provides);
      }
      if (requiringEndpoint.type) {
        candidateRequireTypes = [requiringEndpoint.type];
      } else {
        candidateRequireTypes = Y.Object.keys(requires);
      }
      // Find matches for candidates and evaluate them.
      Y.each(candidateProvideTypes, function(provideType) {
        Y.each(candidateRequireTypes, function(requireType) {
          var provideMatch = provides[provideType],
              requireMatch = requires[requireType];
          if (provideMatch &&
              requireMatch &&
              provideMatch['interface'] === requireMatch['interface']) {
            matches.push({
              'interface': provideMatch['interface'],
              scope: provideMatch.scope || requireMatch.scope,
              provides: providingEndpoint,
              requires: requiringEndpoint,
              provideType: provideType,
              requireType: requireType
            });
          }
        });
      });
    });
    if (matches.length === 0) {
      console.log(endpoints);
      result = {error: 'Specified relation is unavailable.'};
    } else if (matches.length > 1) {
      result = {error: 'Ambiguous relationship is not allowed.'};
    } else {
      result = matches[0];
      // Specify the type for implicit relations.
      result.provides = Y.merge(result.provides);
      result.requires = Y.merge(result.requires);
      result.provides.type = result.provideType;
      result.requires.type = result.requireType;
    }
    return result;
  };

  /*
   * snapToPoles if set to true will snap the relation lines to the
   * closest top, left, bottom or right edge of the service block.
   */
  utils.snapToPoles = false;

  utils.validate = function(values, schema) {
    var errors = {};

    /**
     * Translate a value into a string, translating non-values into an empty
     * string.
     *
     * @method toString
     * @param {Object} value The value to stringify.
     * @return {String} The input value translated into a string.
     */
    function toString(value) {
      if (value === null || value === undefined) {
        return '';
      }
      return (String(value)).trim();
    }

    function isInt(value) {
      return (/^[-+]?[0-9]+$/).test(value);
    }

    function isFloat(value) {
      return (/^[-+]?[0-9]+\.?[0-9]*$|^[0-9]*\.?[0-9]+$/).test(value);
    }

    Y.Object.each(schema, function(field_definition, name) {
      var value = toString(values[name]);

      if (field_definition.type === 'int') {
        if (!value) {
          if (field_definition['default'] === undefined) {
            errors[name] = 'This field is required.';
          }
        } else if (!isInt(value)) {
          // We don't use parseInt to validate integers because
          // it is far too lenient and the back-end code will generate
          // errors on some of the things it lets through.
          errors[name] = 'The value "' + value + '" is not an integer.';
        }
      } else if (field_definition.type === 'float') {
        if (!value) {
          if (field_definition['default'] === undefined) {
            errors[name] = 'This field is required.';
          }
        } else if (!isFloat(value)) {
          errors[name] = 'The value "' + value + '" is not a float.';
        }
      }

    });
    return errors;
  };

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
        Y.mix(this, value, true, ['x', 'y', 'w', 'h']);
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
        if (Y.Lang.isValue(value)) {
          Y.mix(this, value.getAttrs(), true);
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
      get: function() { return this.module.get('component');}
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
          scale: function() { return 1; },
          translate: function() { return [0, 0]; }
        };
        var tr = transform.translate(),
            s = transform.scale();

        return (point[0] >= this.x * s + tr[0] &&
                point[0] <= this.x * s + this.w * s + tr[0] &&
                point[1] >= this.y * s + tr[1] &&
                point[1] <= this.y * s + this.h * s + tr[1]);
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

        if (utils.snapToPoles) {
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
        Y.each(connectors, function(ep) {
          // Take the distance of each XY pair
          var d = this._distance(source, ep);
          if (!Y.Lang.isValue(result) || d < shortest_d) {
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

        Y.each(sc, function(ep1) {
          Y.each(oc, function(ep2) {
            // Take the distance of each XY pair
            var d = this._distance(ep1, ep2);
            if (!Y.Lang.isValue(result) || d < shortest_d) {
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
   * @method BoundingBox
   * @param {Module} module Typically service module.
   * @param {Model} model Model object.
   * @return {BoundingBox} A Box model.
   */
  function BoundingBox(module, model) {
    var b = Object.create(_box);
    b.module = module;
    b.model = model;

    return b;
  }

  views.BoundingBox = BoundingBox;

  /**
   * Convert an Array of services into BoundingBoxes. If
   * existing is supplied it should be a map of {id: box}
   * and will be updated in place by merging changed attribute
   * into the index.
   *
   * @method toBoundingBoxes
   * @param {ServiceModule} Module holding box canvas and context.
   * @param {ModelList} services Service modellist.
   * @param {Object} existing id:box mapping.
   * @return {Object} id:box mapping.
   */
  views.toBoundingBoxes = function(module, services, existing, env) {
    var result = existing || {};
    Y.each(result, function(val, key, obj) {
      if (!Y.Lang.isValue(services.getById(key))) {
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
            icon = utils.getIconPath(charmId, null, env);
            service.set('icon', icon);
          }
          result[id].icon = service.get('icon');
        }
    );
    return result;
  };


  /**
   * Decorate a relation with some related/derived data.
   *
   * @method DecoratedRelation
   * @param {Object} relation The model object we will be based on.
   * @param {Object} source The service from which the relation originates.
   * @param {Object} target The service at which the relation terminates.
   * @return {Object} An object with attributes matching the result of
   *                  relation.getAttrs() plus "source", "target",
   *                  and other convenience data.
   */
  views.DecoratedRelation = function(relation, source, target) {
    // In some instances, notably in tests, a relation is a POJO already;
    // handle this case gracefully.
    var endpoints = relation.endpoints || relation.get('endpoints');
    var hasRelations = Y.Lang.isValue(endpoints);
    var decorated = {
      source: source,
      target: target,
      sourceId: (hasRelations ? (endpoints[0][0] + ':' +
          endpoints[0][1].name) : ''),
      targetId: (hasRelations ? (endpoints[1][0] + ':' +
          endpoints[1][1].name) : ''),
      compositeId:
          (source.modelId +
          (hasRelations ? ':' + endpoints[0][1].name : '') + '-' +
          target.modelId +
          (hasRelations ? ':' + endpoints[1][1].name : ''))
    };
    /**
     * Test whether or not any of the units within the service have any errors
     * relevant to the relation.
     *
     * @method _endpointHasError
     * @param {Object} service A BoxModel-wrapped service.
     * @return {Boolean} Whether or not the service has pertinent errors.
     */
    decorated._endpointHasError = function(service) {
      // Find the endpoints pertinent to each end of the service.
      var endpoint = this.endpoints[0][0] === service.id ?
          this.endpoints[0] : this.endpoints[1];
      // Search the units belonging to the source service for pertinent units
      // in error.
      // Repeat the search for the target service's units.  This relies
      // heavily on short-circuit logic: 'some' will short-circuit at the first
      // match, '&&' will short-circuit out on any unit not in error, and the
      // '||' will short-circuit if the source units are in error.
      return Y.Array.some(service.units.toArray(), function(unit) {
        // Figure out whether or not the unit is in error.
        var relationName = endpoint[1].name + '-' + 'relation',
            relationError = false,
            agentStateData = unit.agent_state_data,
            agentStateInfo = unit.agent_state_info;
        // Now we need to determine if the error is relation-related.
        // First check the agent_state_data field.
        if (agentStateData && agentStateData.hook) {
          relationError = (agentStateData.hook.indexOf(relationName) === 0);
        }
        // Next check the agent_state_info field. In error situations, this
        // field may have a message like 'hook failed: "foobar-relation-joined"'
        // so we just need to see if the relation name is a substring.
        if (!relationError && agentStateInfo) {
          relationError = (agentStateInfo.indexOf(relationName) >= 0);
        }
        return unit.agent_state === 'error' && relationError;
      });
    };
    /**
     * Simple wrapper for template use to check whether the source has units
     * in error pertinent to the relation.
     *
     * @method sourceHasError
     * @return {Boolean} Whether or not the source has pertinent errors.
     */
    decorated.sourceHasError = function() {
      return this._endpointHasError(this.source);
    };
    /**
     * Simple wrapper for template use to check whether the target has units
     * in error pertinent to the relation.
     *
     * @method targetHasError
     * @return {Boolean} Whether or not the target has pertinent errors.
     */
    decorated.targetHasError = function() {
      return this._endpointHasError(this.target);
    };
    /**
     * Simple wrapper for template use to check whether the relation has units
     * in error pertinent to the relation.
     *
     * @method hasRelationError
     * @return {Boolean} Whether or not the relation has pertinent errors.
     */
    decorated.hasRelationError = function() {
      return this.sourceHasError() || this.targetHasError();
    };
    Y.mix(decorated, relation.getAttrs());
    decorated.isSubordinate = utils.isSubordinateRelation(decorated);
    return decorated;
  };

  utils.isSubordinateRelation = function(relation) {
    // Pending relations that are currently in the process of being created
    // will not necessarily have a target and a source; so check for them
    // first before checking whether target or source is a subordinate.
    var source = relation.source,
        target = relation.target,
        subordinateModel = true;
    if (target && source) {
      subordinateModel = target.model.get('subordinate') ||
          source.model.get('subordinate');
    }
    // Relation types of juju-info may have a relation scope of container
    // without necessarily being an actual subordinate relation by virtue of
    // the fact that the service itself may not actually be a subordinate; thus,
    // make sure that at least one of the services is a subordinate *and* the
    // scope is container (which may be inverted, e.g.: puppet and puppetmaster)
    return subordinateModel && relation.scope === 'container';
  };

  var _relationCollection = {};

  /*
   * Fill out properties of related collections.  These mostly just aggregate
   * various relation attributes in ways conducive to displaying a collection
   * of relations appropriately.
   */
  Object.defineProperties(_relationCollection, {
    aggregatedStatus: {
      get: function() {
        // Return pending if any of the relations are pending.
        // Note that by "pending" in this context we mean the relation is added
        // between two ghost/uncommitted services.
        var pending = Y.Array.some(this.relations, function(relation) {
          return relation.pending;
        });
        if (pending) {
          return 'pending';
        }
        // Return unhealthy regardless of subordinate status if any of the
        // relations are in error.
        var unhealthy = Y.Array.some(this.relations, function(relation) {
          return relation.hasRelationError();
        });
        var pendingDeletion = Y.Array.some(this.relations, function(relation) {
          return relation.deleted;
        });
        if (unhealthy) {
          return (pendingDeletion ? 'pending-' : '') + 'error';
        }
        // Return subordinate if the collection is marked as such, otherwise
        // return healthy.
        if (this.isSubordinate) {
          return 'subordinate';
        } else {
          return (pendingDeletion ? 'pending-' : '') + 'healthy';
        }
      }
    },
    isSubordinate: {
      get: function() {
        return Y.Array.every(this.relations, function(relation) {
          return relation.isSubordinate;
        });
      }
    }
  });

  /**
   * Constructor for creating a relation-collection between two services,
   * possibly consisting of multiple actual relations.
   *
   * @method RelationCollection
   * @param {Object} source The source-service.
   * @param {Object} target The target-service.
   * @param {Array} relations An array of relations connecting those two
   *   services.
   * @return {RelationCollection} A relation collection.
   */
  function RelationCollection(source, target, relations) {
    var collection = Object.create(_relationCollection);
    collection.source = source;
    collection.target = target;
    collection.relations = relations;
    collection.id = relations[0].id;
    collection.compositeId = relations[0].id;
    return collection;
  }

  views.RelationCollection = RelationCollection;

  /**
   * Given a list of decorated relations, return a list of relation collections
   * such that multiple relations between the same two services will wind up
   * in the same collection.
   *
   * @method toRelationCollections
   * @param {Array} relations An array of decorated relations.
   * @return {Array} An array of relation collections.
   */
  utils.toRelationCollections = function(relations) {
    var collections = {};
    relations.forEach(function(relation) {
      // Create a regular key for each pair of services; use sort so that
      // each relation between the same two services creates the same key
      // regardless of whether it's considered the source or the target.
      var key = [relation.source.modelId, relation.target.modelId]
        .sort()
        .join();
      if (collections[key]) {
        collections[key].relations.push(relation);
      } else {
        collections[key] = new RelationCollection(
            relation.source, relation.target, [relation]);
      }
    });
    // Dump just the collections; the keys are not needed for the data that
    // is used in the view, which only expects an array of relationships.
    return Y.Object.values(collections);
  };

  /*
    Given one of the many agent states returned by juju-core,
    return a simplified version.

    @method simplifyState
    @param {Object} unit A service unit.
    @param {String} life The life status of the units service.
    @return {String} the filtered agent state of the unit.
  */
  utils.simplifyState = function(unit, life) {
    var state = unit.agent_state,
        inError = (/-?error$/).test(state);
    if (!state) {
      //Uncommitted units don't have state.
      return 'uncommitted';
    }
    if (life === 'dying' && !inError) {
      return 'dying';
    } else {
      if (state === 'started') { return 'running'; }
      if (inError) { return 'error'; }
      // "pending", "installed", and "stopped", plus anything unforeseen
      return state;
    }

  };

  /**
    Export the YAML for this environment.

    @method _exportFile
    @param {Object} db Reference to the app db.
  */
  utils.exportEnvironmentFile = function(db) {
    var result = db.exportDeployer();
    var exportData = jsyaml.dump(result);
    // In order to support Safari 7 the type of this blob needs
    // to be text/plain instead of it's actual type of application/yaml.
    var exportBlob = new Blob([exportData],
        {type: 'text/plain;charset=utf-8'});
    saveAs(exportBlob, 'bundle.yaml');
  },

  /**
    Get the config for a service from a YAML file.

    @method _onYAMLConfigLoaded
    @param {String} filename The config YAML file.
    @param {Function} callback The function to call when the file loads.
    @param {Object} e The load event.
  */
  utils._onYAMLConfigLoaded = function(filename, callback, e) {
    var config = jsyaml.safeLoad(e.target.result);
    callback(config);
  },

  /**
    Get the config for a service from a YAML file.

    @method getYAMLConfig
    @param {Object} file The config YAML file.
    @param {Function} callback The function to call when the file loads.
  */
  utils.getYAMLConfig = function(file, callback) {
    var reader = new FileReader();
    reader.onload = utils._onYAMLConfigLoaded.bind(utils, file.name, callback);
    reader.readAsText(file);
  },

  /**
    Determines the category type for the unit status list of the inspector.

    @method determineCategoryType
    @param {String} category The category name to test.
    @return {String} The category type
      'error', 'landscape', 'pending', 'running'
  */
  utils.determineCategoryType = function(category) {
    if ((/fail|error/).test(category)) { return 'error'; }
    if ((/landscape/).test(category)) { return 'landscape'; }
    if (category === 'running') { return 'running'; }
    if (category === 'uncommitted') { return 'uncommitted'; }
    return 'pending';
  };

  /**
   * Ensure a trailing slash on a string.
   * @method ensureTrailingSlash
   * @param {String} text The input string to check.
   * @return {String} The output string with trailing slash.
   */
  utils.ensureTrailingSlash = function(text) {
    if (text.lastIndexOf('/') !== text.length - 1) {
      text += '/';
    }
    return text;
  };

  /**
     * Return the Landscape URL for a given service or unit, and for the given
     * optional intent (reboot or security upgrade).
     *
     * @method getLandscapeURL
     * @param {Model} environment The Environment model instance.
     * @param {Model} serviceOrUnit A Service or Unit instance (optional).
     * @param {String} intent Can be 'security' or 'reboot' (optional).
     * @return {String} URL to access the model entity in Landscape.
     */
  utils.getLandscapeURL = function(environment, serviceOrUnit, intent) {
    var envAnnotations = environment.get('annotations');
    var url = envAnnotations['landscape-url'];

    if (!url) {
      // If this environment annotation doesn't exist we cannot generate URLs.
      return undefined;
    }
    url += envAnnotations['landscape-computers'];

    if (serviceOrUnit) {
      var annotation;
      if (serviceOrUnit.name === 'service') {
        annotation = serviceOrUnit.get('annotations')['landscape-computers'];
        if (!annotation) {
          console.warn('Service missing the landscape-computers annotation!');
          return undefined;
        }
        url += utils.ensureTrailingSlash(annotation);
      } else if (serviceOrUnit.name === 'serviceUnit') {
        var serviceUnitAnnotation;
        if (serviceOrUnit.get) {
          serviceUnitAnnotation = serviceOrUnit.get('annotations');
        } else {
          serviceUnitAnnotation = serviceOrUnit.annotations;
        }
        annotation = (
            serviceUnitAnnotation &&
            serviceUnitAnnotation['landscape-computer']
            );
        if (!annotation) {
          console.warn('Unit missing the landscape-computer annotation!');
          return undefined;
        }
        url += utils.ensureTrailingSlash(annotation);
      }
    }

    if (!intent) {
      return utils.ensureTrailingSlash(url);
    } else if (intent === 'reboot') {
      return url + envAnnotations['landscape-reboot-alert-url'];
    } else if (intent === 'security') {
      return url + envAnnotations['landscape-security-alert-url'];
    }
  };

  utils.getEffectiveViewportSize = function(primary, minwidth, minheight) {
    // Attempt to get the viewport height minus the navbar at top and
    // control bar at the bottom.
    var containerHeight = Y.one('body').get(
        primary ? 'winHeight' : 'docHeight'),
        bottomNavbar = Y.one('.bottom-navbar'),
        navbar = Y.one('.header-banner'),
        viewport = Y.one('#viewport'),
        result = {height: minheight || 0, width: minwidth || 0};
    if (containerHeight && navbar && viewport) {
      result.height = containerHeight -
          (bottomNavbar ? bottomNavbar.get('offsetHeight') : 0) -
          navbar.get('offsetHeight') - 1;

      result.width = Math.floor(parseFloat(
          viewport.getComputedStyle('width')));

      // Make sure we don't get sized any smaller than the minimum.
      result.height = Math.max(result.height, minheight || 0);
      result.width = Math.max(result.width, minwidth || 0);
    }
    return result;
  };

  /**
    Return the series of the given charm URL.

    @method getSeries
    @param {String} url A fully qualified charm URL, like
      "cs:trusty/django-42" or "cs:~frankban/utopic/juju-gui-0"
    @return {String} The charm series.
  */
  utils.getSeries = function(url) {
    var path = url.split(':')[1];
    var parts = path.split('/');
    if (path.indexOf('~') === 0) {
      // The URL includes the user.
      return parts[1];
    }
    return parts[0];
  };

  /*
   * Build a list of relation types given a list of endpoints.
   */
  Y.Handlebars.registerHelper('relationslist', function(endpoints, options) {
    var out = '';
    endpoints.forEach(function(ep) {
      out += options.fn({start: ep[0], end: ep[1]});
    });
    return out;
  });

  /*
    pluralize is a handlebar helper that handles pluralization of strings.
    The requirement for pluralization is based on the passed in object,
    which can be number, array, or object. If a number, it is directly
    checked to see if pluralization is needed. Arrays and objects are
    checked for length or size attributes, which are then used.

    By default, if pluralization is needed, an 's' is appended to the
    string. This handles the regular case (e.g. cat => cats). Irregular
    cases are handled by passing in a plural form (e.g. octopus => ocotopi).
    */
  utils.pluralize = function(word, object, plural_word, options) {
    var plural = false;
    if (typeof(object) === 'number') {
      plural = (object !== 1);
    }
    if (object) {
      if (object.size) {
        plural = (object.size() !== 1);
      } else if (object.length) {
        plural = (object.length !== 1);
      }
    }
    if (plural) {
      if (typeof(plural_word) === 'string') {
        return plural_word;
      } else {
        return word + 's';
      }
    } else {
      return word;
    }
  };

  Y.Handlebars.registerHelper('pluralize', utils.pluralize);

  Y.Handlebars.registerHelper('getRealServiceName', function(id, relation) {
    var endpoint;
    if (id === relation.sourceId) {
      endpoint = relation.source;
    } else if (id === relation.targetId) {
      endpoint = relation.target;
    } else {
      // If it doesn't match any of the above it's a real relation id and we can
      // return that without modifying it.
      return id;
    }
    var type = id.split(':')[1];
    return endpoint.displayName
                   .replace(/^\(/, '')
                   .replace(/\)$/, '') + ':' + type;
  });

  /*
   * Dev tool: dump to debugger in template.
   * Allows you to inspect a variable by passing it to
   * the debugger helper
   * {{debugger yourVar}}
   *
   */
  Y.Handlebars.registerHelper('debugger', function(value) {
    /*jshint debug:true */
    debugger; //eslint-disable-line no-debugger
    /*jshint debug:false */
  });

  /**
    Handles deploying the charm or bundle id passed in as a deploy-target
    as a query param on app load.

    Be sure to use the fully qualified urls like cs:precise/mysql-48 and
    bundle:mediawiki/7/single because it make it easy to check what type of
    entity the id is referring to.

    @method _deployTargetDispatcher
    @param {String} entityId The id of the charm or bundle to deploy.
  */
  utils.deployTargetDispatcher = function(entityId) {
    var charmstore = this.get('charmstore');
    /**
      Handles parsing and displaying the failure notification returned from
      the charmstore api.

      @method failureNotification
      @param {Object} error The XHR request object from the charmstore req.
    */
    var failureNotification = function(error) {
      var message = 'Unable to deploy target: ' + entityId;
      try {
        message = JSON.parse(error.currentTarget.responseText).Message;
      } catch (e) {
        console.error(e);
      }
      this.db.notifications.add({
        title: 'Error deploying target.',
        message: message,
        level: 'error'
      });
    };

    // The charmstore apiv4 format can have the bundle keyword either at the
    // start, for charmers bundles, or after the username, for namespaced
    // bundles. ex) bundle/swift & ~jorge/bundle/swift
    if (entityId.indexOf('bundle/') > -1) {
      charmstore.getBundleYAML(entityId, function(error, bundleYAML) {
        if (error) {
          failureNotification(error);
        } else {
          this.bundleImporter.importBundleYAML(bundleYAML);
        }
      }.bind(this));
    } else {
      // If it's not a bundle then it's a charm.
      charmstore.getEntity(entityId.replace('cs:', ''), function(error, charm) {
        if (error) {
          failureNotification(error);   
        } else {
          charm = charm[0];
          var config = {},
              options = charm.get('options');
          Object.keys(options).forEach(function(key) {
            config[key] = options[key]['default'];
          });
          // We call the env deploy method directly because we don't want
          // the ghost inspector to open.
          this.env.deploy(
              charm.get('id'),
              charm.get('name'),
              config,
              undefined, //config file content
              1, // number of units
              {}, //constraints
              null); // toMachine
          this.fire('autoplaceAndCommitAll');
        }
      }.bind(this));
    }
    // Because deploy-target is an action and not a state we need to clear
    // it out of the state as soon as we are done with it so that we can
    // continue calling dispatch without the worry of it trying to
    // deploy multiple times.
    var currentState = this.state.get('current');
    delete currentState.app.deployTarget;
    this.navigate(this.state.generateUrl(currentState));
  },

  /**
    Given a mapping of key/value pairs, determine if the data describes a charm
    or a bundle.

    @static
    @method determineEntityDataType
    @param {Object} entityData The entity's data.
    @return {String} Returns "charm" if the data describes a charm, "bundle"
      if it describes a bundle.
  */
  utils.determineEntityDataType = function(entityData) {
    // It would be nice to restructure the token widget so that it takes
    // a model instead of a jumble of attributes.  If we did so, this
    // would just be a type check over the class of the model.
    if (entityData && entityData.id && entityData.id.indexOf('bundle') > -1) {
      return 'bundle';
    }
    return 'charm';
  };

  /**
    Given the db, env, service, unit count and constraints, create and auto
    place those units on new machines.

    @method createMachinesPlaceUnits
    @param {Object} db Reference to the app db.
    @param {Object} env Reference to the app env.
    @param {Object} service Reference to the service model to add units to.
    @param {Integer} numUnits The unit count from the form input.
    @param {Object} constraints The constraints to create the new machines with.
  */
  utils.createMachinesPlaceUnits = function(
      db, env, service, numUnits, constraints) {
    var machine;
    for (var i = 0; i < parseInt(numUnits, 10); i += 1) {
      machine = db.machines.addGhost();
      env.addMachines([{
        constraints: constraints
      }], function(machine) {
        db.machines.remove(machine);
      }.bind(this, machine), { modelId: machine.id});
      env.placeUnit(
          utils.addGhostAndEcsUnits(db, env, service, 1)[0],
          machine.id);
    }
  };

  /**
    Given the db, env, service, and unit count, add these units to the db
    and to the environment such that the unit tokens can be displayed and that
    the ECS will clean them up on deploy.

    @method addGhostAndEcsUnits
    @param {Object} db Reference to the app db.
    @param {Object} env Reference to the app env.
    @param {Object} service Reference to the service model to add units to.
    @param {Integer} unitCount the unit count from the form input.
    @param {Function} callback optional The callback to call after the units
      have been added to the env.
  */
  utils.addGhostAndEcsUnits = function(db, env, service, unitCount, callback) {
    var serviceName = service.get('id'),
        existingUnitCount = service.get('units').size(),
        units = [],
        displayName, ghostUnit, unitId, unitIdCount;
    // Service names have a $ in them when they are uncommitted. Uncomitted
    // service's display names are also wrapped in parens to display on the
    // canvas.
    if (serviceName.indexOf('$') > 0) {
      displayName = service.get('displayName')
                           .replace(/^\(/, '').replace(/\)$/, '');
    } else {
      displayName = serviceName;
    }
    for (var i = 0; i < unitCount; i += 1) {
      unitIdCount = existingUnitCount + i;
      unitId = serviceName + '/' + unitIdCount;
      ghostUnit = db.addUnits({
        id: unitId,
        displayName: displayName + '/' + unitIdCount,
        charmUrl: service.get('charm'),
        subordinate: service.get('subordinate')
      });
      env.add_unit(
          serviceName,
          1,
          null,
          removeGhostAddUnitCallback.bind(null, ghostUnit, db, callback),
          {modelId: unitId});
      units.push(ghostUnit);
    }
    return units;
  };

  /**
    Callback for the env add_unit call from tne addGhostAndEcsUnit method.

    @method removeGhostAndUnitCallback
    @param {Object} ghostUnit the ghost unit created in the db which this fn
      needs to remove.
    @param {Object} db Reference to the app db instance.
    @param {Function} callback The user supplied callback for the env add_unit
      call.
    @param {Object} e env add_unit event facade.
  */
  function removeGhostAddUnitCallback(ghostUnit, db, callback, e) {
    // Remove the ghost unit: the real unit will be re-added by the
    // mega-watcher handlers.
    ghostUnit.service = e.service_name;
    db.removeUnits(ghostUnit);
    if (typeof callback === 'function') {
      callback(e, db, ghostUnit);
    }
  }
  utils.removeGhostAddUnitCallback = removeGhostAddUnitCallback;

  /**
    Remove a service. If it is uncommitted then remove it otherwise use the
    ecs.

    @method destroyService
    @param {Object} db Reference to the app db.
    @param {Object} env Reference to the app env.
    @param {Object} service Reference to the service model to add units to.
  */
  utils.destroyService = function(db, env, service, callback) {
    if (service.name === 'service') {
      env.destroy_service(service.get('id'),
          Y.bind(utils._destroyServiceCallback, this, service, db, callback),
          {modelId: null});
    } else if (service.get('pending')) {
      db.services.remove(service);
      service.destroy();
    } else {
      throw new Error('Unexpected model type: ' + service.name);
    }
  };

  /**
    React to a service being destroyed (or not).

    @method _destroyServiceCallback
    @param {Object} service The service we attempted to destroy.
    @param {Object} db The database responsible for storing the service.
    @param {Object} evt The event describing the destruction (or lack
      thereof).
  */
  utils._destroyServiceCallback = function(service, db, callback, evt) {
    if (evt.err) {
      // If something bad happend we need to alert the user.
      db.notifications.add(
          new Y.juju.models.Notification({
            title: 'Error destroying service',
            message: 'Service name: ' + evt.service_name,
            level: 'error',
            link: undefined,
            modelId: service
          })
      );
    } else {
      // Remove the relations from the database (they will be removed from
      // the state server by Juju, so we don't need to interact with env).
      db.relations.remove(service.get('relations'));
      db.notifications.add({
        title: 'Destroying service',
        message: 'Service: ' + evt.service_name + ' is being destroyed.',
        level: 'important'
      });
    }
    if (callback) {
      callback();
    }
  };

  /**
    Fire the clearState event.

    @method clearState
    @param {Object} topo The topology object.
  */
  utils.clearState = function(topo) {
    topo.fire('clearState');
  };

  /**
    Calculate the number of units per status.

    @method getUnitStatusCounts
    @param {Array} units An array of units.
    @returns {Object} The unit statuses.
  */
  utils.getUnitStatusCounts = function(units) {
    var unitStatuses = {
      uncommitted: { priority: 3, size: 0 },
      started: { priority: 2, size: 0 },
      pending: { priority: 1, size: 0 },
      error: { priority: 0, size: 0 },
    };
    var agentState;
    units.forEach(function(unit) {
      agentState = unit.agent_state || 'uncommitted';
      // If we don't have it in our status list then add it to the end
      // with a very low priority.
      if (!unitStatuses[agentState]) {
        unitStatuses[agentState] = { priority: 99, size: 0 };
      }
      unitStatuses[agentState].size += 1;
    });
    return unitStatuses;
  };

  /**
    Calculate the number of unplaced units.

    @method getUnplacedUnitCount
    @param {Array} units An array of units.
    @returns {Integer} The number of unplaced units.
  */
  utils.getUnplacedUnitCount = function(units) {
    return units.filterByMachine(null).length;
  };

  /**
    Destroy a list of units.

    @method destroyUnits
    @param {Object} env The current environment.
    @param {Array} units A list of unit ids.
    @param {Function} callback A function to call after removal.
  */
  utils.destroyUnits = function(env, units, callback) {
    env.remove_units(units, callback);
  };

  /**
    Returns the icon path result from either the Juju environment (for local
    charms) or the charmstore (for all others). You should call this method
    instead of the others directly to maintain consistency throughout the app.

    @method getIconPath
    @param {String} charmId The id of the charm to fetch the icon for.
    @param {Boolean} isBundle Whether or not this is an icon for a bundle.
  */
  utils.getIconPath = function(charmId, isBundle, env) {
    var cfg = window.juju_config,
        charmstoreURL = (cfg && cfg.charmstoreURL) || '',
        apiPath = (cfg && cfg.apiPath) || '',
        localIndex = charmId.indexOf('local:'),
        path;
    if (localIndex > -1 && env) {
      path = env.getLocalCharmFileUrl(charmId, 'icon.svg');
    } else if (localIndex === -1) {
      if (typeof isBundle === 'boolean' && isBundle) {
        path = '/juju-ui/assets/images/non-sprites/bundle.svg';
      } else {
        // Get the charm ID from the service.  In some cases, this will be
        // the charm URL with a protocol, which will need to be removed.
        // The following regular expression removes everything up to the
        // colon portion of the quote and leaves behind a charm ID.
        charmId = charmId.replace(/^[^:]+:/, '');
        // Note that we make sure isBundle is Boolean. It's coming from a
        // handlebars template helper which will make the second argument the
        // context object when it's not supplied. We want it optional for
        // normal use to default to the charm version, but if it's a boolean,
        // then check that boolean because the author cares specifically if
        // it's a bundle or not.
        path = charmstoreURL + [apiPath, charmId, 'icon.svg'].join('/');
      }
    } else {
      // If no env is provided as necessary then return the default icon.
      path = 'juju-ui/assets/images/non-sprites/charm_160.svg';
    }
    return path;
  };

}, '0.1.0', {
  requires: [
    'base-build',
    'escape',
    'handlebars',
    'node',
    'view',
    'panel',
    'json-stringify',
    'datatype-date-format'
  ]
});
