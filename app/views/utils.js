'use strict';

var consoleManager = (function() {
  var winConsole = window.console,
      // These are the available methods.
      // Add more to this list if necessary.
      consoleEmpty = {
        group: function() {},
        groupEnd: function() {},
        groupCollapsed: function() {},
        log: function() {}
      },
      consoleProxy = (function() {
        // This object wraps the "window.console"
        var consoleWrapper = {};

        function buildMethodProxy(key) {
          if (winConsole[key] && typeof winConsole[key] === 'function') {
            consoleWrapper[key] = function() {
              var cFunc = winConsole[key];
              cFunc.call(winConsole, arguments);
            };
          } else {
            consoleWrapper[key] = function() {
              consoleEmpty[key]();
            };
          }
        }

        // Checking if the browser has the "console" object
        if (winConsole) {
          // Only the methods defined by the consoleMock
          // are available for use.
          for (var key in consoleEmpty) {
            if (consoleEmpty.hasOwnProperty(key)) {
              buildMethodProxy(key);
            }
          }
        } else {
          consoleWrapper = consoleEmpty;
        }

        return consoleWrapper;
      })();

  window.console = consoleEmpty;

  // In order to enable the console in production the user can
  // call "javascript:consoleManager.enable()" in the address bar
  return {
    enable: function() {
      window.console = consoleProxy;
    },
    disable: function() {
      window.console = consoleEmpty;
    },
    getConsoleEmpty: function() {
      // Useful for unit tests
      return consoleEmpty;
    }
  };
})();

YUI.add('juju-view-utils', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils');

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


  // This creates a closure that delays the execution of a given callback. If
  // the user creates a Delayer with "delay = utils.Delayer()" and then calls
  // "delay(functionA, 1000)", "functionA" will be executed after 1000ms.
  // However, if the user calls "delay(functionB, 1000)" before the execution
  // of "functionA", "functionA" will be canceled and "functionB" will be
  // scheduled to run after 1000ms.
  utils.Delayer = function(once) {
    var currentTask = null,
        performed = false;
    once = !!once;
    return function(callback, milliseconds) {
      if (Y.Lang.isValue(currentTask) && !performed) {
        clearTimeout(currentTask);
      }
      if (performed && once) {
        throw 'already performed a task.';
      }
      milliseconds = Math.max(0, milliseconds || 0);
      performed = false;
      var f = function() {
        performed = true;
        callback();
      };
      if (milliseconds > 0) {
        currentTask = setTimeout(f, milliseconds);
      } else {
        // Doing it directly in this case makes tests easier.
        f();
      }
    };
  };

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

      // If the model gets swapped out, reset targets accordingly.
      this.after('modelChange', function(ev) {
        if (ev.prevVal) {
          ev.prevVal.removeTarget(this);
        }
        if (ev.newVal) {
          ev.newVal.addTarget(this);
        }
      });

      // Re-render this view when the model changes.
      this.after('*:change', this.render, this);
    },

    renderable_charm: function(charm_name, db) {
      var charm = db.charms.getById(charm_name);
      if (charm) {
        return charm.getAttrs();
      }
      return null;
    },

    stateToStyle: function(state, current) {
      // todo also check relations
      var classes;
      switch (state) {
        case 'pending':
          classes = 'state-pending';
          break;
        case 'started':
          classes = 'state-started';
          break;
        case 'start_error':
          classes = 'state-error';
          break;
        case 'install_error':
          classes = 'state-error';
          break;
        default:
          Y.log('Unhandled agent state: ' + state, 'debug');
      }
      classes = current && classes + ' ' + current || classes;
      return classes;
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
      if (typeof(selector) === 'string') {
        Y.all(selector).each(function(n) {
          var classes = this.getAttribute('class');
          this.setAttribute('class', classes + ' ' + class_name);
        });
      } else {
        var classes = selector.getAttribute('class');
        selector.setAttribute('class', classes + ' ' + class_name);
      }
    },

    removeSVGClass: function(selector, class_name) {
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
    window.scrollTo(errorDiv.getX(), errorDiv.getY());
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
          rel.ident = near[1].name + ':' + parseInt(rel_id, 10);
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

  utils.validate = function(values, schema) {
    console.group('view.utils.validate');
    console.log('validating', values, 'against', schema);
    var errors = {};

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
      console.log('validating field', name, 'with value', value);

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

      console.log('generated this error (possibly undefined)', errors[name]);
    });
    console.log('returning', errors);
    console.groupEnd();
    return errors;
  };



  /*
   * Utility class that encapsulates Y.Models and keeps their positional
   * state within an svg canvas.
   *
   * As a convenience attributes of the encapsulated model are exposed
   * directly as attributes.
   */
  function BoundingBox() {
    var x, y, w, h, value, modelId, boxMargins;
    function Box() {}

    Box.model = function(_) {
      if (!arguments.length) {
        return modelId;
      }
      modelId = [_.name, _.get('id')];

      // Copy all the attrs from model to Box
      Y.mix(Box, _.getAttrs());
      return Box;
    };

    Box.margins = function(_) {
      if (!arguments.length) {
        return boxMargins;
      }
      boxMargins = _;
      return Box;
    };

    Object.defineProperties(Box, {
      pos: {
        writeable: true,
        get: function() {
          return {x: this.x, y: this.y, w: this.w, h: this.h};
        },
        set: function(value) {
          Y.mix(this, value, true, ['x', 'y', 'w', 'h']);
        }
      },
      x: {
        writeable: true,
        get: function() { return x;},
        set: function(value) {
          this.px = this.x;
          x = value;
          return this;}
      },
      y: {
        writeable: true,
        get: function() { return y;},
        set: function(value) {
          this.py = this.y;
          y = value;
          return this;
        }
      }
    });

    Box.getXY = function() {return [this.x, this.y];};
    Box.getWH = function() {return [this.w, this.h];};

    /*
     * Return the 50% points along each side as xy pairs
     */
    Box.getConnectors = function() {
      // Since the service nodes have a shadow that takes up a bit of
      // space on the sides and bottom of the actual node itself, add a bit
      // of a margin to the actual connecting points. The margin is specified
      // as a percentage of the width or height, as those are affected by the
      // scale. This is calculated by taking the distance of the shadow from
      // the edge of the actual shape and calculating it as a percentage of
      // the total height of the shape.
      var margins = this.margins();
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
    };

    Box._distance = function(xy1, xy2) {
      return Math.sqrt(Math.pow(xy1[0] - xy2[0], 2) +
                       Math.pow(xy1[1] - xy2[1], 2));
    };

    /*
     * Connectors are defined on four borders, find the one closes to
     * another BoundingBox
     */
    Box.getNearestConnector = function(other_box) {
      var connectors = this.getConnectors(),
          result = null,
          shortest_d = Infinity,
          source = other_box;
      // duck typing
      if ('getXY' in other_box) {
        source = other_box.getXY();
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
    };

    /*
     * Return [this.connector.XY, other.connector.XY] (in that order)
     * that as nearest to each other. This can be used to define start-end
     * points for routing.
     */
    Box.getConnectorPair = function(other_box) {
      var sc = Box.getConnectors(),
          oc = other_box.getConnectors(),
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
    };

    Box.translateStr = function() {
      return 'translate(' + this.getXY() + ')';
    };

    Box.modelId = function() {
      return modelId[0] + '-' + modelId[1];
    };

    return Box;
  }

  views.BoundingBox = BoundingBox;

  views.toBoundingBox = function(model) {
    var box = new BoundingBox();
    box.model(model);
    return box;
  };


  function BoxPair() {
    var source, target;

    function pair() {}
    /*
     * Bind an actual model object
     */
    pair.model = function(_) {
      Y.mix(pair, _.getAttrs());
      return pair;
    };

    pair.source = function(_) {
      if (!arguments.length) { return source;}
      source = _;
      return pair;
    };

    pair.target = function(_) {
      if (!arguments.length) { return target;}
      target = _;
      return pair;
    };

    pair.modelIds = function() {
      if (this.endpoints !== undefined) {
        return source.modelId() + ':' + this.endpoints[0][1].name +
               '-' + target.modelId() + ':' + this.endpoints[1][1].name;
      }
      return source.modelId() + '-' + target.modelId();
    };

    return pair;
  }

  views.BoxPair = BoxPair;


}, '0.1.0', {
  requires: ['base-build',
    'handlebars',
    'node',
    'view',
    'panel',
    'json-stringify']
});
