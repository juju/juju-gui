/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';


YUI.add('inspector-overview-view', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      views = Y.namespace('juju.views'),
      templates = Y.namespace('juju.views').Templates,
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

  var unitListNameMap = {
    'error': function(status) {
      return status.category;
    },
    'pending': function(status) {
      return status.category + ' units';
    },
    running: 'running units',
    'landscape': function(status) {
      var nameMap = {
        'landscape-needs-reboot': 'machines need to be restarted',
        'landscape-security-upgrades': 'security upgrades available'
      };
      return nameMap[status.category];
    }
  };

  /**
    Return a category name based on a status, generated either from the
    `unitListNameMap` (in the case of units) or from a data-driven function.

    @method categoryName
    @param {Object} status The status to name.
    @return {String} a name for the status.
  */
  function categoryName(status) {
    var nameMap = {
      'unit': unitListNameMap
    };

    var name = nameMap[status.type][status.categoryType];
    return typeof name === 'function' ? name(status) : name;
  }

  /**
    Generates the unit list sorted by status category and landscape
    annotation key and returns an array with the data to
    generate the unit list UI.

    @method updateStatusList
    @param {Object} values From the databinding update method.
    @return {Array} An array of status objects. For units, this means
    agent_state or landscape annotation id as category and an array of units
    [{ type: 'unit', category: 'started', units: [model, model, ...]}].  For
    services, this means whether or not an upgrade is available
    [{ type: 'service', upgradeAvailable: true, upgradeTo: ...}].
    */
  function updateStatusList(unitList) {
    // Disable: Possible strict violation for the entire function
    /* jshint -W040 */
    var statuses = [],
        unitByStatus = {},
        serviceLife = this.model.get('life');

    unitList.each(function(unit) {
      var category = utils.simplifyState(unit, serviceLife);
      // If the unit is in error we want it's category to be it's real error.
      if (category === 'error') { category = unit.agent_state_info; }

      if (!unitByStatus[category]) { unitByStatus[category] = []; }
      unitByStatus[category].push(unit);

      // landscape annotations
      var lIds = utils.landscapeAnnotations(unit);
      lIds.forEach(function(annotation) {
        if (!unitByStatus[annotation]) {
          unitByStatus[annotation] = [];
        }
        unitByStatus[annotation].push(unit);
      });
    });

    Object.keys(unitByStatus).forEach(function(category) {
      var categoryType = utils.determineCategoryType(category);
      // D3's filter is intended to work with the data-set that it is given;
      // while all this information is available in the DOM via classes, the
      // use of the DOM in the filter function is discouraged for reasons of
      // speed; therefor, mix in the categories with the unit to provide all
      // of this information to D3 in the data-set.
      var additions = {
        category: category,
        categoryType: categoryType
      };
      statuses.push({
        type: 'unit',
        category: category,
        categoryType: categoryType,
        units: unitByStatus[category].map(function(unit) {
          return Y.merge({ unit: unit }, additions);
        })
      });
    });

    return sortStatuses(statuses, this.model);
  }

  /**
    Sorts the statuses array into the appropriate order for the unit list.

    @method sortStatuses
    @param {Array} statuses The statuses array from `updateStatusList`.
    @return {Array} A sorted array of statuses.
  */
  function sortStatuses(statuses) {
    var indexMap = {
      'error': 1,
      'pending': 2,
      'running': 3,
      'landscape': 4
    };

    var sortedStatus = statuses.sort(function(a, b) {
      var ia = indexMap[a.categoryType],
          ib = indexMap[b.categoryType];

      if (ia < ib) { return -1; }
      if (ia === ib) { return 0; }
      return 1;
    });

    return sortedStatus;
  }

  /**
    Generates the list of allowable buttons for the
    different inspector unit lists.

    @method generateActionButtonList
    @param {String} categoryType The unit status category type.
    */
  function generateActionButtonList(categoryType) {
    var showingButtons = {},
        buttonTypes = ['resolve', 'retry', 'remove', 'landscape'],
        // if you adjust this list don't forget to edit
        // the list in the unit tests
        buttons = {
          error: ['resolve', 'retry', 'remove'],
          pending: ['remove'],
          running: ['remove'],
          landscape: ['landscape']
        };

    buttonTypes.forEach(function(buttonType) {
      buttons[categoryType].forEach(function(allowedButton) {
        if (buttonType === allowedButton) {
          showingButtons[buttonType] = true;
        }
      });
    });
    return showingButtons;
  }

  /**
    Binds the statuses data set to d3

    @method generateAndBindStatusHeaders
    @param {Y.Node} node The YUI node object.
    @param {Array} statuses A key value pair of categories to unit list.
    @param {Model} environment The Environment model instance.
    */
  function generateAndBindStatusHeaders(node, statuses, environment) {
    /* jshint -W040 */
    // Ignore 'possible strict violation'
    var self = this,
        buttonHeight;

    var categoryWrapperNodes = d3.select(node.getDOMNode())
    .selectAll('.unit-list-wrapper')
    .data(statuses, function(d) {
          return d.category;
        });

    // D3 header enter section
    var categoryStatusWrapper = categoryWrapperNodes
    .enter()
    .append('div')
    .classed('unit-list-wrapper', true);

    var categoryStatusHeader = categoryStatusWrapper
    .append('div')
    .attr('class', function(d) {
          return 'status-unit-header ' +
              'closed-unit-list ' + d.categoryType;
        });

    var unitStatusContentForm = categoryStatusWrapper
    .filter(function(d) { return d.type === 'unit'; })
    .append('div')
    .attr('class', function(d) {
          return 'status-unit-content ' +
              'close-unit ' + d.categoryType;
        })
    .append('form');

    unitStatusContentForm.append('li')
    .append('input')
    .attr('type', 'checkbox')
    .classed('toggle-select-all', true);

    unitStatusContentForm.append('ul');

    unitStatusContentForm.append('div')
    .classed('action-button-wrapper', true)
    .html(
        function(d) {
          var context = generateActionButtonList(d.categoryType);
          var template = templates['unit-action-buttons'](context);
          buttonHeight = template.offsetHeight;
          return template;
        });

    categoryStatusHeader
    .filter(function(d) { return d.type === 'unit'; })
    .append('span')
    .classed('unit-qty', true);

    categoryStatusHeader.append('span')
    .classed('category-label', true);

    categoryStatusHeader.append('span')
    .classed('chevron', true);

    // D3 header update section
    categoryWrapperNodes.select('.unit-qty')
    .text(function(d) {
          return d.units.length;
        });

    // Adds the 'Go To Landscape' link to the landscape unit lists
    categoryWrapperNodes.filter(function(d) {
      return (d.category === 'landscape-needs-reboot' ||
                  d.category === 'landscape-security-upgrades');
    })
    .select('a.landscape')
    .attr('href', function(d) {
          return utils.getLandscapeURL(environment, self.model);
        });

    // Add the category label to each heading
    categoryWrapperNodes.select('.category-label')
    .text(categoryName);

    var unitsList = categoryWrapperNodes
    .filter(function(d) { return d.type === 'unit'; })
    .select('ul')
    .attr('class', function(d) {
          return 'category-' + d.category;
        })
    .selectAll('li')
    .data(function(d) {
          return d.units;
        }, function(item) {
          return item.unit.id;
        });

    // D3 content enter section
    // Whenever a new unit enters the list create a new li for it
    var unitItem = unitsList.enter()
    .append('li');

    // Adding the checkbox for the unit list items
    unitItem.append('input')
    .attr({
          'type': 'checkbox',
          'name': function(item) {
            return item.unit.id;
          }});
    unitItem.each(function(d) {
      var unit = d3.select(this);
      unit.append('a').text(
          function(d) {
            return d.unit.id;
          })
        .attr('data-unit', function(d) {
            return d.unit.service + '/' + d.unit.number;
          });
    });

    // Handle Landscape actions.
    unitItem.filter(function(d) {
      return d.category === 'landscape-needs-reboot';
    })
      .append('a').classed('right-link', true).attr({
          // Retrieve the Landscape reboot URL for the unit.
          'href': function(d) {
            return utils.getLandscapeURL(environment, d.unit, 'reboot');
          },
          target: '_blank'
        }).text('Reboot');

    unitItem.filter(function(d) {
      return d.category === 'landscape-security-upgrades';
    })
      .append('a').classed('right-link', true).attr({
          // Retrieve the Landscape security upgrade URL for the unit.
          'href': function(d) {
            return utils.getLandscapeURL(environment, d.unit, 'security');
          },
          target: '_blank'
        }).text('Upgrade');

    // D3 content update section
    unitsList.sort(
        function(a, b) {
          return a.unit.number - b.unit.number;
        });

    categoryWrapperNodes
      .select('.status-unit-content')
      .style('max-height', function(d) {
          if (!self._itemHeight) {
            self._itemHeight =
                d3.select(this).select('li').property('offsetHeight');
          }
          var numItems = 0;
          if (d.type === 'unit') {
            numItems = d.units.length + 1;
          }
          return ((self._itemHeight * numItems) + buttonHeight) + 'px';
        });


    // D3 content exit section
    unitsList.exit().remove();

    // D3 header exit section
    categoryWrapperNodes.exit().remove();

    categoryWrapperNodes.order();
  }

  var name = 'overview';

  ns.Overview = Y.Base.create(name, Y.View, [ns.ViewletBaseView], {
    template: templates.serviceOverview,
    events: {
      '.status-unit-header': {click: 'toggleUnitHeader'},
      '.toggle-select-all': {click: 'toggleSelectAllUnits'},
      'a[data-unit]': { click: 'showUnitDetails'},
      'button.unit-action-button': { click: '_unitActionButtonClick'}
    },
    bindings: {
      aggregated_status: {
        'update': function(node, value) {
          var bar = this._statusbar;
          if (!bar) {
            bar = this._statusbar = new views.StatusBar({
              width: 250,
              target: node.getDOMNode(),
              labels: false,
              height: 30
            }).render();
          }
          bar.update(value);
        }
      },
      units: {
        depends: ['aggregated_status', 'upgrade_to'],
        'update': function(node, value) {
          // Called under the databinding context.
          // Subordinates may not have a value.
          if (value) {
            var statuses = this.viewlet.updateStatusList(value);
            this.viewlet.generateAndBindStatusHeaders(
                node, statuses, this.viewlet.options.db.environment);
          }
        }
      },
      exposed: {
        'update': function(node, val) {
          // On exposed, the node is the container of the input we want to
          // change.
          var input = node.one('input');
          if (input) {
            input.set('checked', val);
          }
        }
      }
    },
    /**
      View render method

      @method render
      @param {Object} attributes the viewlet manager attributes.
    */
    render: function(attributes) {
      var container = this.get('container'),
          model = attributes.model;
      container.append(this.template(model.getAttrs()));
      if (window.flags && window.flags.mv && !model.get('subordinate')) {
        this._instantiateScaleUp();
        container.one('.scale-up-container').append(this.scaleUp.render());
      }
    },

    /**
      Instantiates the scale up view.

      @method _instantiateScaleUp
    */
    _instantiateScaleUp: function() {
      if (!this.scaleUp) {
        this.scaleUp = new ns.ScaleUp({
          env: this.options.env,
          db: this.options.db,
          serviceId: this.viewletManager.get('model').get('id')
        });
        // XXX July 14 2014 Jeff - There is an issue where the changeState
        // events don't bubble like they should to get around this we need to
        // manually re-fire the event with the changeState details.
        this.scaleUp.on('changeState', function(e) {
          this.fire('changeState', e.details[0]);
        }, this);
      }
    },

    /**
      Toggles the close-unit class on the unit-list-wrapper which triggers
      the css close and open animations.

      @method toggleUnitHeader
      @param {Y.EventFacade} e Click event object.
    */
    toggleUnitHeader: function(e) {
      e.currentTarget.siblings('.status-unit-content')
                     .toggleClass('close-unit');
      e.currentTarget.toggleClass('closed-unit-list');
    },
    /**
      Toggles the checked status of all of the units in the unit status
      category

      @method toggleSelectAllUnits
      @param {Y.EventFacade} e Click event object.
    */
    toggleSelectAllUnits: function(e) {
      var currentTarget = e.currentTarget,
          units = currentTarget.ancestor('.status-unit-content')
                               .all('input[type=checkbox]');
      if (currentTarget.getAttribute('checked')) {
        units.removeAttribute('checked');
      } else {
        units.setAttribute('checked', 'checked');
      }
    },
    /**
      Show a unit within the left-hand panel.
      Note that, due to the revived model below, this model can potentially
      be out of date, as the POJO from the LazyModelList is the one kept up
      to date.  This is just a first-pass and will be changed later.

      @method showUnitDetails
      @param {object} ev The click event.
      @return {undefined} Nothing.
     */
    showUnitDetails: function(ev) {
      ev.halt();
      var unitName = ev.currentTarget.getData('unit');
      this.fire('changeState', {
        sectionA: {
          metadata: {
            unit: parseInt(unitName.split('/')[1], 10),
            charm: false
          }
        }
      });
    },

    /**
      Directs the unit action button click event to
      the appropriate handler.

      @method _unitActionButtonClick
      @param {Y.EventFacade} e button click event.
    */
    _unitActionButtonClick: function(e) {
      e.halt();
      var handlers = {
        resolve: this._sendUnitResolve,
        retry: this._sendUnitRetry,
        remove: this._sendUnitRemove
      };

      var units = e.currentTarget.ancestor('form').all('input[type=checkbox]');
      var unitNames = [];
      units.each(function(unit) {
        if (unit.get('checked')) {
          var siblings = unit.siblings('a');
          if (siblings.size() > 0) {
            unitNames.push(siblings.item(0).get('innerHTML'));
          }
        }
      });

      var env = this.viewletManager.get('env'),
          handlerName = e.currentTarget.getData('type'),
          handlerFn = handlers[handlerName];

      if (Y.Lang.isFunction(handlerFn)) {
        handlerFn(unitNames, env);
      } else {
        console.error('No handler assigned to', handlerName);
      }

      return; // ignoring all other button clicks passed to this method
    },

    /**
      Sends the resolve command to the env to resolve the
      selected unit in the inspector unit list.

      @method _sendUnitResolve
      @param {Array} unitNames A list of unit names.
      @param {Object} env The current environment (Go/Python).
    */
    _sendUnitResolve: function(unitNames, env) {
      unitNames.forEach(function(unitName) {
        env.resolved(unitName, null);
      });
    },

    /**
      Sends the retry command to the env to retry the
      selected unit in the inspector unit list.

      @method _sendUnitRetry
      @param {Array} unitNames A list of unit names.
      @param {Object} env The current environment (Go/Python).
    */
    _sendUnitRetry: function(unitNames, env) {
      unitNames.forEach(function(unitName) {
        env.resolved(unitName, null, true);
      });
    },

    /**
      Sends the required commands to the env to remove
      the selected unit in the inspector unit list.

      @method _sendUnitRemove
      @param {Array} unitNames A list of unit names.
      @param {Object} env The current environment (Go/Python).
    */
    _sendUnitRemove: function(unitNames, env) {
      // The Go backend can take an array of unitNames but the python one cannot
      // XXX Remove this loop when we drop python support.
      if (env.name === 'go-env') {
        env.remove_units(unitNames);
      } else {
        unitNames.forEach(function(unitName) {
          env.remove_units(unitName);
        });
      }
    },

    /**
      Clean up anything not attached to the view instance destroy cycle.

      @method destructor
    */
    destructor: function() {
      if (this.scaleUp) {
        this.scaleUp.destroy();
      }
    },

    // These methods are exposed here to allow us access for testing.
    categoryName: categoryName,
    generateAndBindStatusHeaders: generateAndBindStatusHeaders,
    generateActionButtonList: generateActionButtonList,
    updateStatusList: updateStatusList,
    sortStatuses: sortStatuses
  });

}, '0.0.1', {
  requires: [
    'node',
    'd3',
    'd3-statusbar',
    'juju-charm-models',
    'viewlet-view-base',
    'scale-up-view',
    'juju-view'
  ]
});
