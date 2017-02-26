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
      precise: {name: 'Precise 12.04'},
      trusty: {name: 'Trusty 14.04'},
      xenial: {name: 'Xenial 16.04'},
      centos7: {name: 'CentOS 7'},
      win2012hvr2: {name: 'Windows Server 2012 R2 Hyper-V'},
      win2012hv: {name: 'Windows Server 2012 Hyper-V'},
      win2012r2: {name: 'Windows Server 2012 R2'},
      win2012: {name: 'Windows Server 2012'},
    };
  };

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
      var string = typeof stringOrFunction === 'function' ?
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

    return [prefix, words, suffix].join(' ').trim();
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
    }

  });

  views.JujuBaseView = JujuBaseView;

  /*
   * snapToPoles if set to true will snap the relation lines to the
   * closest top, left, bottom or right edge of the service block.
   */
  utils.snapToPoles = false;

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
        Object.keys(connectors).forEach(key => {
          const ep = connectors[key];
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

        Object.keys(sc).forEach(key => {
          const ep1 = sc[key];
          Object.keys(oc).forEach(key => {
            const ep2 = oc[key];
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
    Object.keys(result).forEach(key => {
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
    const apps = db.services.toArray();
    const idMap = new Map();
    // Store a map of all the temporary app ids to the real ids.
    apps.forEach(app => {
      idMap.set(app.get('id'), app.get('name'));
    });
    var result = db.exportDeployer(legacyServicesKey, true);
    var exportData = jsyaml.dump(result);
    // Replace the temporary app ids with the real ids.
    idMap.forEach((name, id) => {
      exportData = exportData.split(id).join(name);
    });
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
    Given a unit and reference to the db get that units series.

    @method getUnitSeries
    @param {Object} unit The unit object.
    @param {Object} db reference to the db.
    @return {String} The charm series.
  */
  utils.getUnitSeries = (unit, db) =>
    db.services.getServiceByName(unit.id.split('/')[0]).get('series');

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
        unitCount = parseInt(unitCount, 10),
        units = [],
        displayName, ghostUnit, unitId, unitIdCount;
    // u will be a unit OR the previous unit index value.
    const parseId = u => parseInt((u.id && u.id.split('/')[1]) || u, 10);
    const serviceUnits = service.get('units').toArray();
    let highestIndex = -1;
    if (serviceUnits.length) {
      highestIndex = serviceUnits.reduce(
        (prev, curr) => Math.max(parseId(prev), parseId(curr)), 0);
    }
    // Service names have a $ in them when they are uncommitted. Uncomitted
    // service's display names are also wrapped in parens to display on the
    // canvas.
    if (serviceName.indexOf('$') > 0) {
      displayName = service.get('displayName')
                           .replace(/^\(/, '').replace(/\)$/, '');
    } else {
      displayName = serviceName;
    }

    for (let i = 1; i <= unitCount; i += 1) {
      unitIdCount = highestIndex + i;
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
    charmstoreURL = utils.ensureTrailingSlash(charmstoreURL);

    if (localIndex > -1 && env) {
      path = env.getLocalCharmIcon(charmId);
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

  /**
    Displays a confirmation when closing window if there are uncommitted
    changes

    @method unloadWindow
    @param {Object} env Reference to the app env.
  */
  utils.unloadWindow = function() {
    var currentChangeSet = this.env.get('ecs').getCurrentChangeSet();
    if (Object.keys(currentChangeSet).length > 0) {
      return 'You have uncommitted changes to your model. You will ' +
        'lose these changes if you continue.';
    }
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
    @param {Object} env Reference to the app env.
    @param {Object} model The model to switch to, with these attributes:
      - name: the model name;
      - id: the model unique identifier;
      - owner: the user owning the model, like "admin" or "who@external".
    @param {Boolean} confirmUncommitted Whether to show a confirmation if there
      are uncommitted changes.
  */
  utils.switchModel = function(env, model, confirmUncommitted=true) {
    if (model && model.id === this.get('modelUUID')) {
      // There is nothing to be done as we are already connected to this model.
      // Note that this check is always false when switching models from the
      // profile view, as the "modelUUID" is set to null in that case.
      return;
    }
    const switchModel = utils._switchModel.bind(this, env, model);
    const currentChangeSet = env.get('ecs').getCurrentChangeSet();
    // If there are uncommitted changes then show a confirmation popup.
    if (confirmUncommitted && Object.keys(currentChangeSet).length > 0) {
      utils._showUncommittedConfirm(switchModel);
      return;
    }
    // If there are no uncommitted changes or we don't want to confirm then
    // switch right away.
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
      <window.juju.components.Popup
        buttons={buttons}
        title="Uncommitted changes">
        <p>
          You have uncommitted changes to your model. You will
          lose these changes if you continue.
        </p>
      </window.juju.components.Popup>,
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
    @param {Object} env Reference to the app env.
    @param {Object} model The model to switch to, with these attributes:
      - name: the model name;
      - id: the model unique identifier;
      - owner: the user owning the model, like "admin" or "who@external".
  */
  utils._switchModel = function(env, model) {
    // Remove the switch model confirmation popup if it has been displayed to
    // the user.
    utils._hidePopup();
    // Show the model connection mask.
    this.showConnectingMask();
    // Reset the state of the GUI ready for displaying the new model.
    const newState = {profile: null, gui: null, root: null};
    let name = '';
    let uuid = '';
    if (model) {
      uuid = model.id;
      name = model.name;
      const owner = model.owner.split('@')[0];
      newState.model = {path: `${owner}/${name}`, uuid: uuid};
    } else {
      newState.model = null;
      const current = this.state.current;
      if (!current || !current.profile) {
        newState.root = 'new';
      }
    }
    this.state.changeState(newState);
    env.set('environmentName', name);
    this.set('modelUUID', uuid);
  };

  /**
    Navigate to the profile, displaying a confirmation if there are
    uncommitted changes.

    @method showProfile
    @param {Object} ecs Reference to the ecs.
    @param {Function} changeState The method for changing the app state.
    @param {String} username The username of the profile to display.
  */
  utils.showProfile = function(ecs, changeState, username) {
    var currentChangeSet = ecs.getCurrentChangeSet();
    // If there are uncommitted changes then show a confirmation popup.
    if (Object.keys(currentChangeSet).length > 0) {
      utils._showUncommittedConfirm(
        utils._showProfile.bind(this, ecs, changeState, username, true));
      return;
    }
    // If there are no uncommitted changes then switch right away.
    utils._showProfile(ecs, changeState, username, false);
  };

  /**
    Navigate to the profile, displaying a confirmation if there are
    uncommitted changes.

    @method _showProfile
    @param {Object} ecs Reference to the ecs.
    @param {Function} changeState The method for changing the app state.
    @param {String} username The username of the profile to display.
    @param {Boolean} clear Whether to clear the ecs.
  */
  utils._showProfile = function(ecs, changeState, username, clear=false) {
    utils._hidePopup();
    if (clear) {
      // Have to go ahead and clear the ECS otherwise future navigation will
      // pop up the uncommitted changes confirmation again.
      ecs.clear();
    }
    changeState({
      profile: username,
      model: null,
      root: null,
      store: null
    });
  };

  /**
    Deploy or commit to a model.

    @method deploy
    @param {Object} app The app instance itself.
    @param {Function} callback The function to be called once the deploy is
      complete. It must be passed an error string or null if the operation
      succeeds.
    @param {Boolean} autoplace Whether the unplace units should be placed.
    @param {String} modelName The name of the new model.
    @param {Object} args Any other optional argument that can be provided when
      creating a new model. This includes the following fields:
      - config: the optional model config;
      - cloud: the name of the cloud to create the model in;
      - region: the name of the cloud region to create the model in;
      - credential: the name of the cloud credential to use for managing the
        model's resources.
  */
  utils.deploy = function(app, callback, autoplace=true, modelName, args) {
    const env = app.env;
    const controllerAPI = app.controllerAPI;
    if (autoplace) {
      app._autoPlaceUnits();
    }
    // If we're in a model which exists then just commit the ecs and return.
    if (env.get('connected')) {
      env.get('ecs').commit(env);
      callback(null);
      return;
    }
    const handler = (err, model) => {
      if (err) {
        const msg = 'cannot create model: ' + err;
        app.db.notifications.add({title: msg, message: msg, level: 'error'});
        callback(msg);
        return;
      }
      const commit = args => {
        env.get('ecs').commit(env);
        // After committing then update state to update the url. This is done
        // after committing because changing state will change models and we
        // won't have visibility on when we're connected again and can
        // commit the changes.
        utils._switchModel.call(app, env, {
          id: model.uuid,
          name: model.name,
          owner: model.owner
        });
        app.hideConnectingMask();
        callback(null);
      };
      app.set('modelUUID', model.uuid);
      const socketUrl = app.createSocketURL(
        app.get('socketTemplate'), model.uuid);
      app.switchEnv(socketUrl, null, null, commit, true, false);
    };
    controllerAPI.createModel(
      modelName, controllerAPI.getCredentials().user, args, handler);
  };

  /**
    Parses the error string and determines if the error is a redirect error.

    @method isRedirectError
    @param {String} error The error string returned from the api server.
    @return {Boolean} Whether it is a redirect error or not.
  */
  utils.isRedirectError = function(error) {
    return error === 'authentication failed: redirection required';
  };

  /**
    Generates a valid cloud credential name using the supplied arguments.
    TODO frankban: why are we using this function? We should not double guess
    credential names, but retrieve them from Juju. This is broken.

    @method generateCloudCredentialName
    @param {String} cloudName Name of the cloud that this credential applies,
      for instance "aws" or "google".
    @param {String} user Full user name, for instance "admin@local".
    @param {String} credName The name of the credential
      (TODO frankban: WTF!? We already have that? This is so confusing).
    @return A cloud credential name
  */
  utils.generateCloudCredentialName = function(cloudName, user, credName) {
    return `${cloudName}_${user}_${credName}`;
  };

  /**
    Get the extra info for a cloud provided that is required by various parts of
    the GUI.

    @method getCloudProviderDetails
    @param {String} providerName Name of the provider.
    @return {Object} The details for the provider.
  */
  utils.getCloudProviderDetails = function(providerName) {
    const providers = {
      'gce': {
        id: 'google',
        showLogo: true,
        signupUrl: 'https://console.cloud.google.com/billing/freetrial',
        svgHeight: 33,
        svgWidth: 256,
        title: 'Google Compute Engine',
        forms: {
          jsonfile: [{
            id: 'file',
            title: 'Google Compute Engine project credentials .json file',
            json: true
          }],
          oauth2: [{
            id: 'client-id',
            title: 'Client ID'
          }, {
            id: 'client-email',
            title: 'Client e-mail address'
          }, {
            autocomplete: false,
            id: 'private-key',
            title: 'Private key',
            multiLine: true,
            unescape: true
          }, {
            id: 'project-id',
            title: 'Project ID'
          }]
        },
        message: (
          <p>
            The GCE provider uses OAauth to Authenticate. This requires that
            you set it up and get the relevant credentials. For more
            information see
            &nbsp;<a className="deployment-panel__link"
              href={'https://cloud.google.com/compute/docs/api/how-tos/' +
                'authorization'}
              target="_blank">
              https://cloud.google.com/compute/docs/api/how-tos/
              authorization
            </a>.
            The key information can be downloaded as a JSON file, or copied
            from
            &nbsp;<a className="deployment-panel__link"
              href={'https://console.developers.google.com/project/apiui/' +
                'credential'}
              target="_blank">
              https://console.developers.google.com/project/apiui/credential
            </a>.
          </p>)
      },
      'azure': {
        id: 'azure',
        showLogo: true,
        signupUrl: 'https://azure.microsoft.com/en-us/free/',
        svgHeight: 24,
        svgWidth: 204,
        title: 'Microsoft Azure',
        forms: {
          'service-principal-secret': [{
            id: 'application-id',
            title: 'Azure Active Directory application ID'
          }, {
            id: 'subscription-id',
            title: 'Azure subscription ID'
          }, {
            id: 'application-password',
            title: 'Azure Active Directory application password',
            type: 'password'
          }]
        },
        message: (
          <p>
            The following fields require your Windows Azure management
            information. Having Juju installed, is really easy to&nbsp;
            <a className="deployment-panel__link"
              href='https://jujucharms.com/docs/2.0/help-azure#credentials'
              target="_blank">
              set up credentials interactively
            </a>
            . All required values are then available and can be displayed
            running<br/>
            "juju credentials --show-secrets --format yaml azure".<br/>
            Is it also possible to&nbsp;
            <a className="deployment-panel__link"
              href={'https://jujucharms.com/docs/2.0/help-azure' +
                    '#manually-adding-credentials'}
              target="_blank">
              manually add credentials
            </a>
            .
          </p>)
      },
      'ec2': {
        id: 'aws',
        showLogo: true,
        signupUrl: 'https://portal.aws.amazon.com/gp/aws/developer/' +
        'registration/index.html',
        svgHeight: 48,
        svgWidth: 120,
        title: 'Amazon Web Services',
        forms: {
          'access-key': [{
            id: 'access-key',
            title: 'The EC2 access key'
          }, {
            autocomplete: false,
            id: 'secret-key',
            title: 'The EC2 secret key'
          }]
        },
        message: (
          <p>
            You can obtain your AWS credentials at:<br />
            <a className="deployment-panel__link"
              href={'https://console.aws.amazon.com/iam/home?region=' +
                'eu-west-1#security_credential'}
              target="_blank">
              https://console.aws.amazon.com/iam/home?region=eu-west-1#
              security_credential
            </a>
          </p>)
      },
      'openstack': {
        id: 'openstack',
        showLogo: false,
        title: 'OpenStack',
        forms: {
          userpass: [{
            id: 'username',
            title: 'Username'
          }, {
            id: 'password',
            title: 'Password',
            type: 'password'
          }, {
            id: 'tenant-name',
            title: 'Tenant name'
          }, {
            id: 'domain-name',
            required: false,
            title: 'Domain name'
          }],
          'access-key': [{
            id: 'access-key',
            title: 'Access key'
          }, {
            autocomplete: false,
            id: 'secret-key',
            title: 'Secret key'
          }, {
            id: 'tenant-name',
            title: 'Tenant name'
          }]
        }
      },
      'cloudsigma': {
        id: 'cloudsigma',
        showLogo: false,
        title: 'CloudSigma',
        forms: {
          userpass: [{
            id: 'username',
            title: 'Username'
          }, {
            id: 'password',
            title: 'Password',
            type: 'password'
          }]
        }
      },
      'joyent': {
        id: 'joyent',
        showLogo: false,
        title: 'Joyent',
        forms: {
          userpass: [{
            id: 'sdc-user',
            title: 'SmartDataCenter user ID'
          }, {
            id: 'sdc-key-id',
            title: 'SmartDataCenter key ID'
          }, {
            autocomplete: false,
            id: 'private-key',
            title: 'Private key used to sign requests'
          }, {
            id: 'algorithm',
            title: 'Algorithm used to generate the private key'
          }]
        }
      },
      'maas': {
        id: 'maas',
        showLogo: false,
        title: 'MAAS',
        forms: {
          oauth1: [{
            id: 'maas-oauth',
            title: 'OAuth/API-key credentials for MAAS'
          }]
        }
      },
      'rackspace': {
        id: 'rackspace',
        showLogo: false,
        title: 'Rackspace',
        forms: {
          userpass: [{
            id: 'username',
            title: 'Username'
          }, {
            id: 'password',
            title: 'Password',
            type: 'password'
          }, {
            id: 'tenant-name',
            title: 'Tenant name'
          }, {
            id: 'domain-name',
            required: false,
            title: 'Domain name'
          }],
          'access-key': [{
            id: 'access-key',
            title: 'Access key'
          }, {
            autocomplete: false,
            id: 'secret-key',
            title: 'Secret key'
          }, {
            id: 'tenant-name',
            title: 'Tenant name'
          }]
        }
      },
      'vsphere': {
        id: 'vsphere',
        showLogo: false,
        title: 'vSphere',
        forms: {
          userpass: [{
            id: 'username',
            title: 'Username'
          }, {
            id: 'password',
            title: 'Password',
            type: 'password'
          }]
        }
      },
      lxd: {
        id: 'local',
        showLogo: false,
        title: 'Local'
      }
    };
    return providers[providerName];
  };

}, '0.1.0', {
  requires: [
    'base-build',
    'escape',
    'node',
    'view',
    'panel',
    'popup',
    'json-stringify',
    'datatype-date-format'
  ]
});
