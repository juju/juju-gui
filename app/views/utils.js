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
    @return {String} The calculated DOM id.
   */
  var generateSafeDOMId = function(value) {
    return (
        value.replace(/\W/g, '_') + '-' + generateHash(value));
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

  /*
   * Utility methods for SVG regarding classes
   */
  var hasSVGClass = function(selector, class_name) {
    var classes = selector.getAttribute('class');
    if (!classes) {
      return false;
    }
    return classes.indexOf(class_name) !== -1;
  };
  utils.hasSVGClass = hasSVGClass;

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

  var toggleSVGClass = function(selector, class_name) {
    if (this.hasSVGClass(selector, class_name)) {
      this.removeSVGClass(selector, class_name);
    } else {
      this.addSVGClass(selector, class_name);
    }
  };
  utils.toggleSVGClass = toggleSVGClass;

  var consoleManager = function() {
    var winConsole = window.console,
        // These are the available methods.
        // Add more to this list if necessary.
        noop = function() {},
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

  /*
 * Ported from https://github.com/rmm5t/jquery-timeago.git to YUI
 * w/o the watch/refresh code
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
    },

    humanizeNumber: function(n) {
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
    },

    /*
     * Utility methods for SVG regarding classes
     */
    hasSVGClass: function(selector, class_name) {
      var classes = selector.getAttribute('class');
      if (!classes) {
        return false;
      }
      return classes.indexOf(class_name) !== -1;
    },

    addSVGClass: function(selector, class_name) {
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
    },

    removeSVGClass: function(selector, class_name) {
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
    },

    toggleSVGClass: function(selector, class_name) {
      if (this.hasSVGClass(selector, class_name)) {
        this.removeSVGClass(selector, class_name);
      } else {
        this.addSVGClass(selector, class_name);
      }
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
          classNames: ['btn-danger', 'btn']
        });
    panel.addButton(
        { value: 'Cancel',
          section: Y.WidgetStdMod.FOOTER,
          action: function(e) {
            e.preventDefault();
            panel.hide();
          },
          classNames: ['btn']
        });

    // The default YUI CSS conflicts with the CSS effect we want.
    panel.get('boundingBox').all('.yui3-button').removeClass('yui3-button');
    return panel;
  };

  views.highlightRow = function(row, err) {
    row.removeClass('highlighted'); // Whether we need to or not.
    var backgroundColor = 'palegreen',
        oldColor = row.one('td').getStyle('backgroundColor');
    if (err) {
      backgroundColor = 'pink';
    }
    // Handle tr:hover in bootstrap css.
    row.all('td').setStyle('backgroundColor', 'transparent');
    row.setStyle('backgroundColor', backgroundColor);
    row.transition(
        { easing: 'ease-out', duration: 3, backgroundColor: oldColor},
        function() {
          // Revert to following normal stylesheet rules.
          row.setStyle('backgroundColor', '');
          // Undo hover workaround.
          row.all('td').setStyle('backgroundColor', '');
        });
  };

  utils.updateLandscapeBottomBar = function(landscape, env, model, container) {
    // Landscape annotations are stored in a unit's annotations, but just on
    // the object in the case of services/environment.
    var annotations = model.annotations ? model.annotations : model;
    var envAnnotations = env.get ? env.get('annotations') : env;
    var controls = container.one('.landscape-controls').hide();
    var machine = controls.one('.machine-control').hide();
    var updates = controls.one('.updates-control').hide();
    var restart = controls.one('.restart-control').hide();

    if (envAnnotations['landscape-url']) {
      controls.show();
      machine.show();
      machine.one('a').setAttribute('href',
          landscape.getLandscapeURL(model));

      if (annotations['landscape-security-upgrades']) {
        updates.show();
        updates.one('a').setAttribute('href',
            landscape.getLandscapeURL(model, 'security'));
      }

      if (annotations['landscape-needs-reboot']) {
        restart.show();
        restart.one('a').setAttribute('href',
            landscape.getLandscapeURL(model, 'reboot'));
      }
    }
  };

  function _addAlertMessage(container, alertClass, message) {
    var div = container.one('#message-area');

    // If the div cannot be found (often an issue with testing), give up and
    // return.
    if (!div) {
      return;
    }

    var errorDiv = div.one('#alert-area');

    if (!errorDiv) {
      errorDiv = Y.Node.create('<div/>')
        .set('id', 'alert-area')
        .addClass('alert')
        .addClass(alertClass);

      Y.Node.create('<span/>')
        .set('id', 'alert-area-text')
        .appendTo(errorDiv);

      var close = Y.Node.create('<a class="close">x</a>');

      errorDiv.appendTo(div);
      close.appendTo(errorDiv);

      close.on('click', function() {
        errorDiv.remove();
      });
    }

    errorDiv.one('#alert-area-text').setHTML(message);
    window.scrollTo(0, 0);
  }

  utils.showSuccessMessage = function(container, message) {
    _addAlertMessage(container, 'alert-success', message);
  };


  utils.buildRpcHandler = function(config) {
    var utils = Y.namespace('juju.views.utils'),
        container = config.container,
        scope = config.scope,
        finalizeHandler = config.finalizeHandler,
        successHandler = config.successHandler,
        errorHandler = config.errorHandler;

    function invokeCallback(callback) {
      if (callback) {
        if (scope) {
          callback.apply(scope);
        } else {
          callback();
        }
      }
    }

    return function(ev) {
      if (ev && ev.err) {
        _addAlertMessage(container, 'alert-error', utils.SERVER_ERROR_MESSAGE);
        invokeCallback(errorHandler);
      } else {
        // The usual result of a successful request is a page refresh.
        // Therefore, we need to set this delay in order to show the "success"
        // message after the page page refresh.
        setTimeout(function() {
          utils.showSuccessMessage(container, 'Settings updated');
        }, 1000);
        invokeCallback(successHandler);
      }
      invokeCallback(finalizeHandler);
    };
  };

  utils.SERVER_ERROR_MESSAGE = 'An error ocurred.';


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
          rel.near = {service: near[0], role: near[1].role, name: near[1].name};
          // far will be undefined or the far endpoint service.
          rel.far = far && {
            service: far[0], role: far[1].role, name: far[1].name};
          var rel_id = rel.relation_id.split('-')[1];
          if (isNaN(rel_id)) {
            rel.ident = rel.relation_id;
          } else {
            rel.ident = near[1].name + ':' + parseInt(rel_id, 10);
          }
          rel.elementId = generateSafeDOMId(rel.relation_id);
          return rel;
        });
  };

  /*
   * Given a CSS selector, gather up form values and return in a mapping
   * (object).
   */
  utils.getElementsValuesMapping = function(container, selector) {
    var result = {};
    container.all(selector).each(function(el) {
      var value = null;
      if (el.getAttribute('type') === 'checkbox') {
        value = el.get('checked');
      } else {
        value = el.get('value');
      }

      if (value && typeof value === 'string' && value.trim() === '') {
        value = null;
      }

      result[el.get('name')] = value;
    });

    return result;
  };

  /*
   * Given a charm schema, return a template-friendly array describing it.
   */
  utils.extractServiceSettings = function(schema) {
    var settings = [];
    Y.Object.each(schema, function(field_def, field_name) {
      var entry = {
        'name': field_name
      };

      if (schema[field_name].type === 'boolean') {
        entry.isBool = true;

        if (schema[field_name]['default']) {
          // The "checked" string will be used inside an input tag
          // like <input id="id" type="checkbox" checked>
          entry.value = 'checked';
        } else {
          // The output will be <input id="id" type="checkbox">
          entry.value = '';
        }
      } else {
        entry.value = schema[field_name]['default'];
      }

      settings.push(Y.mix(entry, field_def));
    });
    return settings;
  };

  utils.stateToStyle = function(state, current) {
    // TODO: also check relations.
    var classes;
    switch (state) {
      case 'installed':
      case 'pending':
      case 'stopped':
        classes = 'state-pending';
        break;
      case 'started':
        classes = 'state-started';
        break;
      case 'install-error':
      case 'start-error':
      case 'stop-error':
        classes = 'state-error';
        break;
      default:
        Y.log('Unhandled agent state: ' + state, 'debug');
    }
    classes = current && classes + ' ' + current || classes;
    return classes;
  };

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
   * Covert an Array of services into BoundingBoxes. If
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
  views.toBoundingBoxes = function(module, services, existing) {
    var result = existing || {};
    Y.each(result, function(val, key, obj) {
      if (!Y.Lang.isValue(services.getById(key))) {
        delete result[key];
      }
    });
    Y.each(services, function() {
      var id = this.get('id');
      if (result[id] !== undefined) {
        result[id].model = this;
      } else {
        result[id] = new BoundingBox(module, this);
      }
    });
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
    var hasRelations = Y.Lang.isValue(relation.endpoints);
    var decorated = {
      source: source,
      target: target,
      compositeId: (
          source.modelId +
          (hasRelations ? ':' + relation.endpoints[0][1].name : '') +
          '-' + target.modelId +
          (hasRelations ? ':' + relation.endpoints[1][1].name : ''))
    };
    Y.mix(decorated, relation.getAttrs());
    decorated.isSubordinate = utils.isSubordinateRelation(decorated);
    return decorated;
  };

  utils.isSubordinateRelation = function(relation) {
    return relation.scope === 'container';
  };

  /* Given one of the many "real" states return a "UI" state.
   *
   * If a state ends in "-error" or is simply "error" then it is an error
   * state, if it is "started" then it is "running", otherwise it is "pending".
   */
  utils.simplifyState = function(unit) {
    var state = unit.agent_state;
    if ('started' === state && unit.relation_errors &&
        Y.Object.keys(unit.relation_errors).length) {
      state = 'relation-error';
    }

    if (state === 'started') {
      return 'running';
    }
    if ((/-?error$/).test(state)) {
      return 'error';
    }
    // "pending", "installed", and "stopped", plus anything unforeseen
    return 'pending';
  };

  utils.getEffectiveViewportSize = function(primary, minwidth, minheight) {
    // Attempt to get the viewport height minus the navbar at top and
    // control bar at the bottom.
    var containerHeight = Y.one('body').get(
        primary ? 'winHeight' : 'docHeight'),
        bottomNavbar = Y.one('.bottom-navbar'),
        navbar = Y.one('.navbar'),
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
   * Determine if a service is the Juju GUI by inspecting the charm URL.
   *
   * @method isGuiCharmUrl
   * @param {String} charmUrl The service to inspect.
   * @return {Boolean} True if the charm URL is that of the Juju GUI.
   */
  utils.isGuiCharmUrl = function(charmUrl) {
    // Regular expression to match charm URLs.  Explanation generated by
    // http://rick.measham.id.au/paste/explain.pl and then touched up a bit to
    // fit in our maximum line width.  Note that the bit about an optional
    // newline matched by $ is a Perlism that JS does not share.
    //
    // NODE                     EXPLANATION
    // ------------------------------------------------------------------------
    //   ^                        the beginning of the string
    // ------------------------------------------------------------------------
    //   (?:                      group, but do not capture:
    // ------------------------------------------------------------------------
    //     [^:]+                    any character except: ':' (1 or more
    //                              times (matching the most amount
    //                              possible))
    // ------------------------------------------------------------------------
    //     :                        ':'
    // ------------------------------------------------------------------------
    //   )                        end of grouping
    // ------------------------------------------------------------------------
    //   (?:                      group, but do not capture (0 or more times
    //                            (matching the most amount possible)):
    // ------------------------------------------------------------------------
    //     [^\/]+                   any character except: '\/' (1 or more
    //                              times (matching the most amount
    //                              possible))
    // ------------------------------------------------------------------------
    //     \/                       '/'
    // ------------------------------------------------------------------------
    //   )*                       end of grouping
    // ------------------------------------------------------------------------
    //   juju-gui-                'juju-gui-'
    // ------------------------------------------------------------------------
    //   \d+                      digits (0-9) (1 or more times (matching
    //                            the most amount possible))
    // ------------------------------------------------------------------------
    //   $                        before an optional \n, and the end of the
    //                            string
    return (/^(?:[^:]+:)(?:[^\/]+\/)*juju-gui-\d+$/).test(charmUrl);
  };

  /**
   * Determine if a service is the Juju GUI by inspecting the charm URL.
   *
   * @method isGuiService
   * @param {Object} candidate The service to inspect.
   * @return {Boolean} True if the service is the Juju GUI.
   */
  utils.isGuiService = function(candidate) {
    // Some candidates have the charm URL as an attribute, others require a
    // "get".
    var charmUrl = candidate.charm || candidate.get('charm');
    return utils.isGuiCharmUrl(charmUrl);
  };

  Y.Handlebars.registerHelper('unitState', function(relation_errors,
      agent_state) {
        if ('started' === agent_state && relation_errors &&
            Y.Object.keys(relation_errors).length) {
          return 'relation-error';
        }
        return agent_state;
      });

  /*
   * Show the status and, if present, the status info of the given db instance.
   */
  Y.Handlebars.registerHelper('showStatus', function(instance) {
    // The "instance" argument is typically a unit or a machine model instance.
    var result = instance.agent_state;
    if (instance.agent_state_info) {
      result += ': ' + instance.agent_state_info;
    }
    return result;
  });

  Y.Handlebars.registerHelper('any', function() {
    var conditions = Y.Array(arguments, 0, true),
        options = conditions.pop();
    if (Y.Array.some(conditions, function(c) { return !!c; })) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  Y.Handlebars.registerHelper('dateformat', function(date, format) {
    // See http://yuilibrary.com/yui/docs/datatype/ for formatting options.
    if (date) {
      return Y.Date.format(date, {format: format});
    }
    return '';
  });

  Y.Handlebars.registerHelper('iflat', function(iface_decl, options) {
    //console.log('helper', iface_decl, options, this);
    var result = [];
    var ret = '';
    Y.Object.each(iface_decl, function(value, name) {
      if (name) {
        result.push({
          name: name, 'interface': value['interface']
        });
      }
    });

    if (result && result.length > 0) {
      for (var x = 0, j = result.length; x < j; x += 1) {
        ret = ret + options.fn(result[x]);
      }
    } else {
      ret = 'None';
    }
    return ret;
  });

  Y.Handlebars.registerHelper('markdown', function(text) {
    if (!text || text === undefined) {return '';}
    return new Y.Handlebars.SafeString(
        Y.Markdown.toHTML(text));
  });

  /**
   * Generate a landscape badge using a partial internally.
   */
  Y.Handlebars.registerHelper('landscapeBadge', function(
      landscape, model, intent, hint) {
        if (!landscape) {
          return '';
        }
        var output = '';
        var badge = landscape.getLandscapeBadge(model, intent, hint);

        if (badge) {
          output += Y.Handlebars.render(
              '{{>landscape-badges}}', {badge: badge});
        }
        return new Y.Handlebars.SafeString(output);
      });

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


  Y.Handlebars.registerHelper('arrayObject', function(object, options) {
    var res = '';
    if (object) {
      Y.Array.each(Y.Object.keys(object), function(key) {
        res = res + options.fn({
          key: key,
          value: object[key]
        });
      });
    }
    return res;
  });

  /**
    * pluralize
    *
    * pluralize is a handlebar helper that handles pluralization of strings.
    * The requirement for pluralization is based on the passed in object,
    * which can be number, array, or object. If a number, it is directly
    * checked to see if pluralization is needed. Arrays and objects are
    * checked for length or size attributes, which are then used.
    *
    * By default, if pluralization is needed, an 's' is appended to the
    * string. This handles the regular case (e.g. cat => cats). Irregular
    * cases are handled by passing in a plural form (e.g. octopus => ocotopi).
    */
  Y.Handlebars.registerHelper('pluralize',
      function(word, object, plural_word, options) {
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
      });

}, '0.1.0', {
  requires: ['base-build',
             'handlebars',
             'node',
             'view',
             'panel',
             'json-stringify',
             'gallery-markdown',
             'datatype-date-format']
});
