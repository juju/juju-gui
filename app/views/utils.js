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
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

  /**
    global utils functions

    @class utils
  */

  // These are tools for the linkify function, below.
  var _url = new RegExp(
      '\\bhttps?:\\/\\/' +
      '[-A-Za-z0-9+&@#\\/%?=~_()|!:,.;]*[-A-Za-z0-9+&@#\\/%=~_()|]+',
      'i');
  var _lp = /\blp:~[^ ]*[0-9A-Za-z_]+/i;
  var _long = /\b[\w]{50,}/;
  var _splitter = new RegExp(
      '(?=' + _url.source + '|' + _lp.source + '|' + _long.source + ')', 'i');
  var _link_template = (
      '<a href="$value" target="_blank" class="break-word">$safe</a>');
  var _span_template = '<span class="break-word">$safe</span>';
  /**
    Linkify links in text.  Wrap launchpad branch locations in links.  Mark
    long words as needing to break.  HTML escape everywhere possible.

    @method linkify
    @param {String} text The string to linkify.
    @return {String} The linkified string.
   */
  var linkify = function(text) {
    if (text) {
      // The function's strategy is to use a regex to split the string
      // whenever we have a link, a Launchpad branch reference, or a long
      // word.  The regex is careful to not actually consume anything, because
      // then we would lose content from the text.  It also does not remember
      // any matches, because this inserts the matches into the split string,
      // which can be difficult to work with.

      // After we have the split string, then we walk through each segment of
      // the array and identify why we split: was it a link?  A Launchpad
      // branch identifier?  A long word?  Or are we just at the beginning of
      // the string?  For each of these cases, we reassemble the content, HTML
      // escaping as much as possible so as to reduce the chance of XSS attack
      // vectors.

      // This will hold the segments of the resulting string.  After our work,
      // we join all the segments together and return the result.
      var segments = [];
      /**
        Process a segment and add its parts to the segments array.

        This is a function to try and make the main loop a bit cleaner.

        @method pushMatch
        @param {string} segment The full segment, as split from the original
               string, that we are working with right now.
        @param {string} match The regex match: the link, Launchpad branch, or
               long word that comes at the beginning of the segment.
        @param {string} template A string in which $value is replaced by the
               unprocessed value, and $safe is replaced by the HTML-escaped
               match.
        @param {string or undefined} value to be used in the template.  If
              this is not provided, the match is used.
       */
      var pushMatch = function(segment, match, template, value) {
        if (!Y.Lang.isValue(value)) {
          value = match;
        }
        var safe = Y.Escape.html(match);
        segments.push(
            template.replace('$value', value).replace('$safe', safe));
        segments.push(Y.Escape.html(segment.slice(match.length)));
      };
      // This is the main loop, doing the job described in the comment at the
      // top of the function.
      text.split(_splitter).forEach(function(segment) {
        var match = _url.exec(segment);
        if (match) {
          pushMatch(segment, match[0], _link_template);
        } else {
          match = _lp.exec(segment);
          if (match) {
            pushMatch(
                segment, match[0], _link_template,
                'https://code.launchpad.net/' + match[0].slice(3));
          } else {
            match = _long.exec(segment);
            if (match) {
              pushMatch(segment, match[0], _span_template);
            } else {
              segments.push(Y.Escape.html(segment));
            }
          }
        }
      });
      // The trim helps out for when the output is used in a whitespace: pre-
      // line context, which is true in all cases as of this writing.  It
      // shouldn't affect other uses, but if it does and we want to remove
      // `trim` from the function, doublecheck that the trim is added back in
      // elsewhere as desired.
      text = segments.join('').trim();
    }
    return text;
  };
  utils.linkify = linkify;

  Y.Handlebars.registerHelper('linkify', function(text) {
    var result = linkify(text);
    if (result) {
      result = new Y.Handlebars.SafeString(result);
    }
    return result;
  });

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
        'e-' + value.replace(/\W/g, '_') + '-' + generateHash(value));
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

  /**
    Prepare and return a constraints list to be used as part of the template
    context.

    @method getConstraints
    @private
    @param {Object} serviceConstraints Key-value pairs representing the
      current service constraints.
    @param {Array} genericConstraints Generic constraint keys for the
      environment in use.
    @return {Array} The resulting constraints list, each item being
      an object with the following fields: name, value, title, unit
      (optional).
  */
  utils.getConstraints = function(serviceConstraints, genericConstraints) {

    var constraints = [];
    var initial = Object.create(null);
    var readOnlyConstraints = utils.readOnlyConstraints;
    var constraintDescriptions = utils.constraintDescriptions;
    // Exclude read-only constraints.
    Y.Object.each(serviceConstraints, function(value, key) {
      if (readOnlyConstraints.indexOf(key) === -1) {
        initial[key] = value;
      }
    });
    // Add generic constraints.
    Y.Array.each(genericConstraints, function(key) {
      if (key in initial) {
        constraints.push({name: key, value: initial[key]});
        delete initial[key];
      } else {
        constraints.push({name: key, value: ''});
      }
    });
    // Add missing initial constraints.
    Y.Object.each(initial, function(value, key) {
      constraints.push({name: key, value: value});
    });
    // Add constraint descriptions.
    return Y.Array.filter(constraints, function(item) {
      if (item.name in constraintDescriptions) {
        return Y.mix(item, constraintDescriptions[item.name]);
      }
      // If the current key is not included in the descriptions, use the
      // name as the title to display to the user.
      item.title = item.name;
      return item;
    });
  };

  /**
    Constraint descriptions used in getConstraints

    @property constraintDescriptions
  */
  utils.constraintDescriptions = {
    'arch': {title: 'Architecture'},
    'cpu': {title: 'CPU', unit: 'GHz'},
    'cpu-cores': {title: 'CPU cores'},
    'cpu-power': {title: 'CPU power', unit: 'GHz'},
    'mem': {title: 'Memory', unit: 'MB'}
  };

  /**
    Read-only constraints used in getConstraints

    @property readOnlyConstraints
  */
  utils.readOnlyConstraints = ['provider-type', 'ubuntu-series'];

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
          rel.near = {service: near[0], role: near[1].role, name: near[1].name};
          // far will be undefined or the far endpoint service.
          rel.far = far && {
            service: far[0], role: far[1].role, name: far[1].name};
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

  /*
   * Given a CSS selector, gather up form values and return in a mapping
   * (object).
   */
  utils.getElementsValuesMapping = function(container, selector) {
    var result = {};
    container.all(selector).each(function(el) {

      var name = el.get('name');
      // Unnamed elements are resizing textarea artifacts.  Skip them.
      if (!name) {
        return;
      }
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

  /**
    Find unchanged config options from a collection of config values and return
    only those that are different from the supplied charm or service defaults
    at the time of parsing.

    @method getChangedConfigOptions
    @param {Object} config is a reference to service config values in the GUI.
    @param {Object} options is a reference to the charm or
                    service configuration options.
    @return {Object} the key/value pairs of config options.
  */
  utils.getChangedConfigOptions = function(config, options) {
    // This method is always called even if the config is provided by
    // a configuration file - in this case, return.
    if (!config) {
      return;
    }
    var newValues = Object.create(null);
    Object.keys(config).forEach(function(key) {
      // Find the config options which are not different from the charm or
      // service defaults intentionally letting the browser do the type
      // conversion.
      // The || check is to allow empty inputs to match an undefined default.
      /* jshint -W116 */
      if (Y.Lang.isObject(options[key])) {
        // Options represents a charm config.
        if (config[key] == (options[key]['default'] || '')) {
          return;
        }
      } else {
        // Options represents a service config.
        if (config[key] == (options[key] || '')) {
          return;
        }
      }
      /* jshint +W116 */
      newValues[key] = config[key];
    });
    return newValues;
  };

  /**
   Return a template-friendly array of settings.

   Used for service-configuration.partial adding isBool, isNumeric metadata.

   @method extractServiceSettings
   @param {Object} schema The schema for a charm.
   @param {Object} config An optional object of configuration values for
     the service.  If it isn't given, the defaults from the charm are used.
     If the config is passed it must complete in that it contains values for
     all entries in the schema.  The value of entries in the schema that
     are not in the config will be undefined.
   @return {Array} An array of settings for use in the template.
   */
  utils.extractServiceSettings = function(schema, config) {
    var settings = [];

    if (!config) {
      // If no separate service config is given, use the defaults from the
      // schema.
      config = {};
      Y.Object.each(schema, function(v, k) {
        config[k] = v['default'];
      });
    }

    Y.Object.each(schema, function(field_def, field_name) {
      var entry = {
        'name': field_name
      };

      var dataType = schema[field_name].type;

      if (dataType === 'boolean') {
        entry.isBool = true;

        if (config[field_name]) {
          // The "checked" string will be used inside an input tag
          // like <input id="id" type="checkbox" checked>
          entry.value = 'checked';
        } else {
          // The output will be <input id="id" type="checkbox">
          entry.value = '';
        }
      } else {
        if (dataType === 'int' || dataType === 'float') {
          entry.isNumeric = true;
        }

        entry.value = config[field_name];
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

  /**
    Checks the database for an existing service with the same name.

    @method checkForExistingService
    @param {String} serviceName of the new service to deploy.
    @return {Boolean} true if it exists, false if doesn't.
  */
  utils.checkForExistingService = function(serviceName, db) {
    var existingService = db.services.getById(serviceName);
    return (existingService) ? true : false;
  };

  utils.validateServiceName = function(serviceName, db) {
    if (!utils.checkForExistingService(serviceName, db)) {
      // Regex re-worked from juju-core to work properly in javascript
      // http://bazaar.launchpad.net/
      // ~go-bot/juju-core/trunk/view/head:/names/service.go
      var regex = /[a-z][a-z0-9]*(?:-[a-z0-9]*[a-z][a-z0-9]*)*/,
          result = serviceName.match(regex);
      if (Y.Lang.isArray(result) && result[0] === serviceName) {
        return true;
      }
    }
    return false;
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
   * Convert an Array of services into BoundingBoxes. If
   * existing is supplied it should be a map of {id: box}
   * and will be updated in place by merging changed attribute
   * into the index.
   *
   * @method toBoundingBoxes
   * @param {ServiceModule} Module holding box canvas and context.
   * @param {ModelList} services Service modellist.
   * @param {Object} existing id:box mapping.
   * @param {Object} store The charm store.
   * @return {Object} id:box mapping.
   */
  views.toBoundingBoxes = function(module, services, existing, store) {
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
            var charmID = service.get('charm');
            icon = this.store.iconpath(charmID);
            service.set('icon', icon);
          }
          result[id].icon = service.get('icon');
        },
        // Pass 'store' into the closure through the context variable 'this'.
        {store: store}
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
    return (relation.target && relation.source ?
        relation.target.model.get('subordinate') ||
        relation.source.model.get('subordinate') : true) &&
        relation.scope === 'container';
  };

  /**
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
    Returns an array of user friendly Landscape ids that are contained
    on the passed in unit.

    @method landscapeAnnotations
    @param {Object} unit A unit object.
    @return {Array} An array of user friendly Landscape id's.
  */
  utils.landscapeAnnotations = function(unit) {
    var ids = [];
    if (!unit.annotations) { return ids; }
    if (unit.annotations['landscape-needs-reboot']) {
      ids.push('landscape-needs-reboot');
    }
    if (unit.annotations['landscape-security-upgrades']) {
      ids.push('landscape-security-upgrades');
    }
    return ids;
  };

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
        annotation = (
            serviceOrUnit.annotations &&
            serviceOrUnit.annotations['landscape-computer']
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
  /**
   * Normalize the list of open ports on the unit.
   * The list of open ports can be received in different formats based on the
   * Juju implementations. In essence, while pyJuju sends e.g. [80, 42],
   * juju-core includes the protocol information, e.g. ['80/tcp', '47/udp'].
   *
   * @method normalizeUnitPorts
   * @param {Array} ports The list of open ports on a unit.
   * @return {Array} A list of objects each one with the following properties:
   *   - port (int): the port number;
   *   - protocol (string): 'tcp' or 'udp'.
   */
  utils.normalizeUnitPorts = function(ports) {
    if (!ports) {
      return [];
    }
    return Y.Array.map(ports, function(port) {
      var splitted = port.toString().split('/');
      return {port: parseInt(splitted[0], 10), protocol: splitted[1] || 'tcp'};
    });
  };

  /**
   * Parse a list of normalized open ports.
   *
   * @method parseUnitPorts
   * @param {String} ipAddress The unit IP address.
   * @param {Array} normalizedPorts A list of normalized unit ports
   *   (see utils.normalizeUnitPorts above).
   * @return {Array} An array of two elements. The first element is a data
   *   object describing the IP address. The second element is a list of data
       objects describing each open port. A data object is an object with the
       following properties:
   *   - text (string): the text to show in the template;
   *   - href (string, optional): the URL where the text can link to (
         if applicable).
   */
  utils.parseUnitPorts = function(ipAddress, normalizedPorts) {
    var httpHref, httpsHref;
    var ipAddressData = {text: ipAddress};
    var portDataList = [];
    normalizedPorts.forEach(function(normalizedPort) {
      var port = normalizedPort.port;
      var protocol = normalizedPort.protocol;
      var portData = {text: port + '/' + protocol};
      if (protocol === 'tcp') {
        if (port === 443) {
          portData.href = httpsHref = 'https://' + ipAddress + '/';
        } else if (port === 80) {
          portData.href = httpHref = 'http://' + ipAddress + '/';
        } else {
          portData.href = 'http://' + ipAddress + ':' + port + '/';
        }
      }
      portDataList.push(portData);
    });
    ipAddressData.href = httpsHref || httpHref;
    return [ipAddressData, portDataList];
  };

  Y.Handlebars.registerHelper('unitState', function(relation_errors,
      agent_state) {
        if ('started' === agent_state && relation_errors &&
            Y.Object.keys(relation_errors).length) {
          return 'relation-error';
        }
        return agent_state;
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

  /*
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


  /*
    If built around checking if x == y.
    Supports an inverse so that we can use an else clause.
   */
  Y.Handlebars.registerHelper('if_eq', function(x, y, options) {
    if (x === y) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  /*
    Supplies a version of 'unless' block helper that will check two specified
    values against each other. The default unless helper is based on a single
    truthy value.
    Supports an inverse function so that we can use an else clause.

   */
  Y.Handlebars.registerHelper('unless_eq', function(x, y, options) {
    if (x !== y) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
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

  /*
   * Truncate helper to keep text sizes to a specified limit.
   *
   * {{truncate field 100}}
   *
   */
  Y.Handlebars.registerHelper('truncate', function(string, length) {
    if (string && string.length > length) {
      return Y.Lang.trimRight(string.substring(0, length)) + '...';
    }
    else {
      return string;
    }
  });

  /*
   * Check if a flag is set.
   *
   * {{#ifFlag 'flag_name'}} {{/ifFlag}}
   *
   */
  Y.Handlebars.registerHelper('ifFlag', function(flag, options) {
    if (window.flags && window.flags[flag]) {
      return options.fn(this);
    }
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
    debugger;
    /*jshint debug:false */
  });

  // Returns 'error' if the relation in question is in error. Supports both
  // normal and peer relations.
  Y.Handlebars.registerHelper('relationStatus', function(relation, errors) {
    var serviceName = '';
    if (relation.far) {
      serviceName = relation.far.service;
    } else { // It's a peer relation
      serviceName = relation.near.service;
    }
    if (errors[serviceName]) { return 'error'; }
  });

  // Returns the proper service name to support peer and normal relations for
  // the relations tab in the juju-gui.
  Y.Handlebars.registerHelper('relationServiceName', function(relation) {
    if (relation.far) {
      return relation.far.service;
    } else { // It's a peer relation
      return relation.near.service;
    }
  });

  /*
   * Extension for views to provide an apiFailure method.
   *
   * @class apiFailingView
   */
  utils.apiFailingView = function() {
    this._initAPIFailingView();
  };
  utils.apiFailingView.prototype = {
    /**
     * Constructor
     *
     * @method _initAPIFailingView
     */
    _initAPIFailingView: function() {},

    /**
     * Shared method to generate a message to the user based on a bad api
     * call from a view.
     *
     * @method apiFailure
     * @param {Object} data the json decoded response text.
     * @param {Object} request the original io_request object for debugging.
     * @param {String} title the title for the generated notification.
     */
    _apiFailure: function(data, request, title) {
      var message;
      if (data && data.type) {
        message = 'Charm API error of type: ' + data.type;
      } else {
        message = 'Charm API server did not respond';
      }
      if (!title) {
        title = 'Unidentified API failure';
      }
      this.get('db').notifications.add(
          new models.Notification({
            title: title,
            message: message,
            level: 'error'
          })
      );
      // If there's a spinning indicator on the View then make sure to hide
      // it.
      if (this.hideIndicator && this.get('renderTo')) {
        this.hideIndicator(this.get('renderTo'));
      }
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
    if (entityData && 'basket_name' in entityData) {
      return 'bundle';
    }
    return 'charm';
  };

  /**
    Given a set of charm metadata, extract the parts that we need and return
    a sorted array of data to generate charm icon lists for the bundle
    visualizations from.

    @method charmIconParser
    @param {Object} data charm_metadata from bundle object.
    @return {Array} Array of charm icon data.
  */
  utils.charmIconParser = function(data) {
    var charmIcons = [];
    Object.keys(data).forEach(function(key) {
      // We only show icons for the approved charms.
      if (data[key].is_approved) {
        var iconData = {
          id: data[key].id,
          name: data[key].name
        };
        charmIcons.push(iconData);
      }
    });

    if (charmIcons.length > 10) {
      charmIcons = charmIcons.slice(10);
    }
    return charmIcons;
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
    'gallery-markdown',
    'datatype-date-format'
  ]
});
