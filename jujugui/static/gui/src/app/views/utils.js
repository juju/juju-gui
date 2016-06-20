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


  /**
     Get a list of all the supported series.

     @method getSeriesList
     @return {Object} A collection of series.
   */
  utils.getSeriesList = function() {
    // For a list of supported series in Juju see:
    // https://github.com/juju/charmstore/blob/v5-unstable/internal/
    // series/series.go#L37
    return {
      oneiric: {name: 'Oneiric Ocelot 11.10'},
      precise: {name: 'Precise Pangolin 12.04 LTS'},
      quantal: {name: 'Quantal Quetzal 12.10'},
      raring: {name: 'Raring Ringtail 13.04'},
      saucy: {name: 'Saucy Salamander 13.10'},
      trusty: {name: 'Trusty Tahr 14.04 LTS'},
      utopic: {name: 'Utopic Unicorn 14.10'},
      vivid: {name: 'Vivid Vervet 15.04'},
      wily: {name: 'Wily Werewolf 15.10'},
      xenial: {name: 'Xenial Xerus 16.04'},
      centos7: {name: 'CentOS 7'},
      win2012hvr2: {name: 'Windows Server 2012 R2 Hyper-V'},
      win2012hv: {name: 'Windows Server 2012 Hyper-V'},
      win2012r2: {name: 'Windows Server 2012 R2'},
      win2012: {name: 'Windows Server 2012'},
      win7: {name: 'Windows 7'},
      win8: {name: 'Windows 8'},
      win81: {name: 'Windows 8.1'},
      win10: {name: 'Windows 10'}
    };
  };

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
    var applicationName = service.get('id');
    return Y.Array.map(
        db.relations.get_relations_for_service(service),
        function(relation) {
          var rel = relation.getAttrs(),
              near,
              far;
          if (rel.endpoints[0][0] === applicationName) {
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
      // It's only a problem if there's more than one explicit relation.
      // Otherwise, filter out the implicit relations and just return the
      // explicit relation.
      var explicitRelations = matches.filter(
        rel => rel['provideType'] !== 'juju-info');
      if (explicitRelations.length === 0) {
        console.log(endpoints);
        result = {error: 'No explicitly specified relations are available.'};
      } else if (explicitRelations.length > 1) {
        result = {error: 'Ambiguous relationship is not allowed.'};
      } else {
        result = explicitRelations[0];
      }
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
  utils.exportEnvironmentFile = function(db, legacyServicesKey) {
    var result = db.exportDeployer(legacyServicesKey);
    var exportData = jsyaml.dump(result);
    // In order to support Safari 7 the type of this blob needs
    // to be text/plain instead of it's actual type of application/yaml.
    var exportBlob = new Blob([exportData],
        {type: 'text/plain;charset=utf-8'});
    var envName = db.environment.get('name');
    saveAs(exportBlob, this._genereateBundleExportFileName(envName));
  },

  /**
    Get the export file name

    @method _genereateBundleExportFileName
    @param {String} Enviroment name
    @param {Date} date object
  */
  utils._genereateBundleExportFileName = function(envName, date=new Date()) {
    var fileExtension = '.yaml';
    return [envName,
        date.getFullYear(),
        ('0' + (date.getMonth() + 1)).slice(-2),
        ('0' + date.getDate()).slice(-2)].join('-') + fileExtension;
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
    // If all elements are present and the viewport is not set to display none
    if (containerHeight && navbar && viewport &&
      viewport.getComputedStyle('width') !== 'auto') {
      result.height = containerHeight -
          (bottomNavbar ? bottomNavbar.get('offsetHeight') : 0);

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

  /**
    Return the name from the given charm ID.

    @method getName
    @param {String} id A fully qualified charm ID, like
      "cs:trusty/django-42" or "cs:~frankban/utopic/juju-gui-0"
    @return {String} The charm name.
  */
  utils.getName = function(id) {
    var parts = id.split('/');
    // The last part will be the name and version number e.g. juju-gui-0.
    var idParts = parts[parts.length - 1].split('-');
    // If the last part is numeric, it's the version number; remove it.
    if (!isNaN(idParts[idParts.length - 1])) {
      idParts.pop();
    }
    return idParts.join('-');
  };

  /*
    pluralize is a helper that handles pluralization of strings.
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
              options = charm.get ? charm.get('options') : charm.options;
          Object.keys(options).forEach(function(key) {
            config[key] = options[key]['default'];
          });
          // We call the env deploy method directly because we don't want
          // the ghost inspector to open.
          this.env.deploy(
              charm.get ? charm.get('id') : charm.id,
              charm.get ? charm.get('name') : charm.name,
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
    ghostUnit.service = e.applicationName;
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
      env.destroyApplication(service.get('id'),
          utils._destroyServiceCallback.bind(this, service, db, callback),
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
      db.notifications.add({
        title: 'Error destroying service',
        message: 'Service name: ' + evt.applicationName,
        level: 'error',
        link: undefined,
        modelId: service
      });
    } else {
      // Remove the relations from the database (they will be removed from
      // the state server by Juju, so we don't need to interact with env).
      db.relations.remove(service.get('relations'));
      db.notifications.add({
        title: 'Destroying service',
        message: 'Service: ' + evt.applicationName + ' is being destroyed.',
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
    Destory a list of relations.

    @method destroyRelations
    @param {Database} db to resolve relations on.
    @param {Object} env The current environment.
    @param {Array} relations A list of relation ids.
    @param {Function} callback A function to call after removal.
  */
  utils.destroyRelations = function(db, env, relations, callback) {
    for (var i = 0; relations.length > i; i++) {
      var relationId = relations[i];
      var relation = db.relations.getById(relationId);
      var endpoints = relation.get('endpoints');
      env.remove_relation(endpoints[0], endpoints[1], callback);
    }
  };

  /**
    Create a list of relations.

    @method createRelation
    @param {Object} env The current environment.
    @param {Array} relations A list of relation endpoints.
    @param {Function} callback A function to call after removal.
  */
  utils.createRelation = function(db, env, relations, callback) {
    var endpoints = [relations[0].service, {
      name: relations[0].name,
      role: "client"
    }, relations[1].service, {
      name: relations[1].name,
      role: "server"
    }];

    var relationId = 'pending-' + endpoints[0] + ':' + endpoints[0].name + endpoints[1] + ':' + endpoints[1].name;
    var relation = db.relations.add({
      relation_id: relationId,
      'interface': endpoints[0].name,
      endpoints: endpoints,
      pending: true,
      scope: 'global', // XXX check the charms to see if this is a subordinate
      display_name: 'pending'
    });
    env.add_relation(
      endpoints[0], endpoints[1],
      function(e) {
        this.db.relations.create({
          relation_id: e.result.id,
          type: e.result['interface'],
          endpoints: endpoints,
          pending: false,
          scope: e.result.scope
        });
      }.bind(this));
    // env.add_relation(endpointA, endpointB, function() {console.log('Relation created')});
  }

  /**
    Return the application object that matches the ID

    @method getApplicationById
    @param {Database} db to resolve relations on.
    @param {String} applicationId the application id.
  */
  utils.getApplicationById = function(db, applicationId) {
    return db.services.getById(applicationId);
  };

  /**
    Returns an array of relation types for the passed applications

    @method getRelationTypes
    @param {Object} applicationFrom the application to relate from.
    @param {Object} applicationTo the application to relate to.
    @param {Boolean} filterExisting filters exisiting relations from the
    returned relation types
    @returns {Array} The relations that are compatible.
  */
  utils.getRelationTypes = function(
    topo, db, models, applicationFrom, applicationTo, filterExisting=true) {
    var endpointsController = topo.get('endpointsController');
    var applicationToEndpoints = models.getEndpoints(applicationTo,
      endpointsController);
    var relationTypes = applicationToEndpoints[applicationFrom.get('id')];
    if (filterExisting) {
      var filtered = utils.getRelationDataForService(db, applicationTo).filter(
        function(match) {
          return match.endpoints[0] !== applicationFrom.get('id');
      });
      if (filtered.length !== 0) {
        relationTypes = relationTypes.filter(function(relation) {
          return filtered.some(function(item) {
            return relation[0].name !== item.near.name ||
              relation[1].name !== item.far.name;
          });
        });
      }
    }
    return relationTypes;
  };

  /**
    Returns a list of relatible applications

    @method getRelatableApplications
    @param {Object} topo The topology object.
    @param {Database} db to resolve relations on.
    @param {Object} service A BoxModel-wrapped application.
    @param {Function} callback A function to call after removal.
    @returns {Array} The service objects that can related to the application.
  */
  utils.getRelatableApplications = function(topo, db, models, application) {
    var endpointsController = topo.get('endpointsController');
    var endpoints = models.getEndpoints(application, endpointsController);
    var possibleRelations = [];
    for (endpoint in endpoints) {
      possibleRelations.push(db.services.getById(endpoint));
    }
    return possibleRelations;
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
        localIndex = charmId.indexOf('local:'),
        path;
    if (localIndex > -1 && env) {
      path = env.getLocalCharmFileUrl(charmId, 'icon.svg');
    } else if (localIndex === -1) {
      if (typeof isBundle === 'boolean' && isBundle) {
        var staticURL = '';
        if (window.juju_config && window.juju_config.staticURL) {
          // The missing slash is important because we need to use an
          // associated path for GISF but a root path for GiJoe.
          staticURL = window.juju_config.staticURL + '/';
        }
        var basePath = `${staticURL}static/gui/build/app`;
        path = `${basePath}/assets/images/non-sprites/bundle.svg`;
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
        path = charmstoreURL + [
          window.jujulib.charmstoreAPIVersion, charmId, 'icon.svg'].join('/');
      }
    } else {
      // If no env is provided as necessary then return the default icon.
      path = 'static/gui/build/app/assets/images/non-sprites/charm_160.svg';
    }
    return path;
  };

  // Modified for Javascript from https://gist.github.com/gruber/8891611 - I
  // escaped the forward slashes and removed the negative-lookbehind, which JS
  // does not support. See line 46 in Gruber's gist; that's the line/feature
  // I had to take out.
  var URL_RE = /\b((?:(?:https?|ftp):(?:\/{1,3}|[a-z0-9%])|[a-z0-9.\-]+[.](?:com|net|org|edu|gov|mil|aero|asia|biz|cat|coop|info|int|jobs|mobi|museum|name|post|pro|tel|travel|xxx|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|Ja|sk|sl|sm|sn|so|sr|ss|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw)\/)(?:[^\s()<>{}\[\]]+|\([^\s()]*?\([^\s()]+\)[^\s()]*?\)|\([^\s]+?\))+(?:\([^\s()]*?\([^\s()]+\)[^\s()]*?\)|\([^\s]+?\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’])|(?:[a-z0-9]+(?:[.\-][a-z0-9]+)*[.](?:com|net|org|edu|gov|mil|aero|asia|biz|cat|coop|info|int|jobs|mobi|museum|name|post|pro|tel|travel|xxx|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|Ja|sk|sl|sm|sn|so|sr|ss|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw)\b\/?(?!@)))/ig;  // eslint-disable-line max-len
  /**
    Convert plain text links to anchor tags.

    @method _linkify
    @param {String} str a string that may have a plain text link or URL in it
    @returns {String} the string with HTML anchor tags for the link
  */
  utils.linkify = function(str) {
    // Sanitize any malicious HTML or Javascript.
    var sanitizedStr = str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    var links = sanitizedStr.match(URL_RE);
    if (links) {
      links.forEach(function(link) {
        // Sanitize any attempts to escape an href attribute.
        var href = link.replace(/"/g, '&quot;');
        // Replace the text-only link with an anchor element.
        sanitizedStr = sanitizedStr.replace(link,
          `<a href="${href}" target="_blank">${link}</a>`);
      });
    }
    return sanitizedStr;
  };

  /**
    Convert the number passed in into a alphabet representation. Starting
    from 1, 0 will return ?Z.
    ex) 2 = B, 27 = AA, 38 = AL ...

    @method numToLetter
    @param {Integer} num The number to convert to an alphabet.
    @returns {String} The alphabet representation.
  */
  utils.numToLetter = function(num) {
    // Because num can be more than 26 we need to reduce it down to a value
    // between 0 and 26 to match alphabets.
    var remainder = num % 26;
    // Reduce it down to the number of characters we need, since we only have
    // 26 characters any multiple of that will require us to add more.
    var multiple = num / 26 | 0;
    var char = '';
    // remainder will be 0 if number is 26 (Z)
    if (remainder) {
      // 96 is the start of lower case alphabet.
      char = String.fromCharCode(96 + remainder);
    } else {
      // subtract 1 from the multiple if remainder is 0 and add a Z;
      multiple--;
      char = 'z';
    }
    // If there are multiple characters required then recurse else
    // return the value of char.
    return multiple ? utils.numToLetter(multiple) + char : char;
  };

  /**
    Convert the string passed in into a number representation.
    ex) B = 2, AA = 27, AL = 38 ...

    @method letterToNum
    @returns {String} str The string to convert to a number.
    @returns {Integer} The number representation.
  */
  utils.letterToNum = function(str) {
    var num = 0;
    var characters = str.split('');
    var characterLength = characters.length;
    characters.forEach((letter, characterPosition) => {
      // Use the character position to calculate the base for this character.
      // The last character needs to have a base of 0 so we subtract one from
      // the position.
      var base = Math.pow(26, characterLength - characterPosition - 1);
      // Use the character code to get the number value for the letter. 96 is
      // the start of lower case alphabet.
      num += base * (str.charCodeAt(characterPosition) - 96);
    });
    return num;
  };

  /**
    Generate a name for a service with an incremented number if needed.

    @method generateServiceName
    @param {String} charmName The charm name.
    @param {Object} services the list of services.
    @param {Integer} counter The optional increment counter.
    @returns {String} The name for the service.
  */
  utils.generateServiceName = function(charmName, services, counter = 0) {
    // There should only be a counter in the charm name after the first one.
    var name = counter > 0 ?
      charmName + '-' + utils.numToLetter(counter) : charmName;
    // Check each service to see if this counter is being used.
    var match = services.some(service => {
      return service.get('name') === name;
    });
    // If there is no match return the new name, otherwise check the next
    // counter.
    return match ? utils.generateServiceName(
      charmName, services, counter += 1) : name;
  };

  /**
    Compare two semver version strings and return if one is
    older than the other.

    @method compareSemver
    @param {String} a Version.
    @param {String} b Version to compare to.
    @param {Integer} returns -1 if a is older than b, 0 if a is equal to b,
      and 1 if a is newer than b.
  */
  utils.compareSemver = function(a, b) {
    a = a.split('-')[0];
    b = b.split('-')[0];
    var pa = a.split('.');
    var pb = b.split('.');
    for (var i = 0; i < 3; i++) {
      var na = Number(pa[i]);
      var nb = Number(pb[i]);
      if (na > nb) return 1;
      if (nb > na) return -1;
      if (!isNaN(na) && isNaN(nb)) return 1;
      if (isNaN(na) && !isNaN(nb)) return -1;
    }
    return 0;
  };

  /**
    Switch model, displaying a confirmation if there are uncommitted changes.

    @method switchModel
    @param {Function} createSocketURL The function to create a socket URL.
    @param {Function} switchEnv The function to switch models.
    @param {Object} env Reference to the app env.
    @param {String} uuid A model UUID.
    @param {Array} modelList A list of models.
    @param {String} name A model name.
    @param {Function} callback The function to be called once the model has
      been switched and logged into. Takes the following parameters:
      {Object} env The env that has been switched to.
  */
  utils.switchModel = function(
    createSocketURL, switchEnv, env, uuid, modelList, name, callback) {
    var switchModel = utils._switchModel.bind(this,
      createSocketURL, switchEnv, env, uuid, modelList, name, callback);
    var currentChangeSet = env.get('ecs').getCurrentChangeSet();
    // If there are uncommitted changes then show a confirmation popup.
    if (Object.keys(currentChangeSet).length > 0) {
      utils._showUncommittedConfirm(switchModel);
      return;
    }
    // If there are no uncommitted changes then switch right away.
    switchModel();
  };

  /**
    Show the a confirmation popup for when there are uncommitted changes.

    @method _showUncommittedConfirm
    @param {Function} action The method to call if the user continues.
  */
  utils._showUncommittedConfirm = function(action) {
    var buttons = [{
      title: 'Cancel',
      action: utils._hidePopup.bind(this),
      type: 'base'
    }, {
      title: 'Continue',
      action: action,
      type: 'destructive'
    }];
    ReactDOM.render(
      <window.juju.components.ConfirmationPopup
        buttons={buttons}
        message={'You have uncommitted changes to your model. You will ' +
          'lose these changes if you continue.'}
        title="Uncommitted changes" />,
      document.getElementById('popup-container'));
  };

  /**
    Hide the confirmation popup.

    @method _hidePopup
  */
  utils._hidePopup = function() {
    ReactDOM.unmountComponentAtNode(
      document.getElementById('popup-container'));
  };

  /**
    Switch models using the correct username and password.

    @method _switchModel
    @param {Function} createSocketURL The function to create a socket URL.
    @param {Function} switchEnv The function to switch models.
    @param {Object} env Reference to the app env.
    @param {String} uuid A model UUID.
    @param {Array} modelList A list of models.
    @param {String} name A model name.
    @param {Function} callback The function to be called once the model has
      been switched and logged into. Takes the following parameters:
      {Object} env The env that has been switched to.
  */
  utils._switchModel = function(
    createSocketURL, switchEnv, env, uuid, modelList, name, callback) {
    // Remove the switch model confirmation popup if it has been displayed to
    // the user.
    utils._hidePopup();
    // Show the model connection mask.
    this.showConnectingMask();
    // Reset the state of the GUI ready for displaying the new model.
    this.changeState({
      sectionA: {
        component: null,
        metadata: null
      },
      sectionB: {
        component: null,
        metadata: null
      },
      sectionC: {
        component: null,
        metadata: null
      }
    });
    // Update the model name. The onEnvironmentNameChange in app.js method will
    // update the name correctly accross components.
    env.set('environmentName', name);
    this.set('jujuEnvUUID', uuid);
    var username, password, address, port;
    if (uuid && modelList) {
      var found = modelList.some((model) => {
        if (model.uuid === uuid) {
          username = model.user;
          password = model.password;
          // Note that the hostPorts attribute is only present in models
          // returned by JEM.
          if (model.hostPorts && model.hostPorts.length) {
            var hostport = model.hostPorts[0].split(':');
            address = hostport[0];
            port = hostport[1];
          }
          return true;
        }
      });
      if (!found) {
        console.log('No user credentials for model: ', uuid);
      }
      var socketUrl = createSocketURL(uuid, address, port);
      switchEnv(socketUrl, username, password, callback);
    } else {
      // Just reset without reconnecting to an env.
      switchEnv(null, null, null, callback);
    }
  };

  /**
    Navigate to the profile, displaying a confirmation if there are
    uncommitted changes.

    @method showProfile
    @param {Object} ecs Reference to the ecs.
    @param {Function} changeState The method for changing the app state.
  */
  utils.showProfile = function(ecs, changeState) {
    var currentChangeSet = ecs.getCurrentChangeSet();
    // If there are uncommitted changes then show a confirmation popup.
    if (Object.keys(currentChangeSet).length > 0) {
      utils._showUncommittedConfirm(
        utils._showProfile.bind(this, ecs, changeState, true));
      return;
    }
    // If there are no uncommitted changes then switch right away.
    utils._showProfile(ecs, changeState, false);
  };

  /**
    Navigate to the profile, displaying a confirmation if there are
    uncommitted changes.

    @method _showProfile
    @param {Object} ecs Reference to the ecs.
    @param {Function} changeState The method for changing the app state.
  */
  utils._showProfile = function(ecs, changeState, clear=false) {
    utils._hidePopup();
    if (clear) {
      // Have to go ahead and clear the ECS otherwise future navigation will
      // pop up the uncommitted changes confirmation again.
      ecs.clear();
    }
    changeState({
      sectionB: {
        component: 'profile',
        metadata: null
      }
    });
  };

  /**
    Makes a request of JEM or JES to fetch the users available models.

    @method listModels
    @param {Object} env Reference to the app env.
    @param {Object} jem Reference to jem.
    @param {Object} user The currently authorised user.
    @param {Boolean} gisf The gisf flag.
    @param {Function} callback The function to be called once the model list
      list has been received.
    @returns {Object} the XHR request.
  */
  utils.listModels = function(env, jem, user, gisf, callback) {
    // If gisf is enabled then we won't be connected to a model to know
    // what facades are supported but we can reliably assume it'll be Juju 2
    // or higher which will support the necessary api calls.
    if (!gisf && (!env ||
      env.findFacadeVersion('ModelManager') === null &&
      env.findFacadeVersion('EnvironmentManager') === null)) {
      // If we're on Juju < 2 then pass the default model to the list.
      var environmentName = env.get('environmentName');
      var username = user && user.usernameDisplay;
      callback(null, {
        models: [{
          name: environmentName,
          ownerTag: username,
          // Leave the UUID blank so that it navigates to the default
          // model when selected.
          uuid: '',
          lastConnection: 'now'
        }]
      });
      return;
    }
    var xhr;
    if (jem) {
      xhr = jem.listModels(callback);
    } else {
      xhr = env.listModelsWithInfo(callback.bind(null));
    }
    return xhr;
  };

}, '0.1.0', {
  requires: [
    'base-build',
    'confirmation-popup',
    'escape',
    'node',
    'view',
    'panel',
    'json-stringify',
    'datatype-date-format'
  ]
});
