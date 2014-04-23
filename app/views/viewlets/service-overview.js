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

  var ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
  var ESC = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.esc;

  var SHOWCOUNT = 5;

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
      'unit': unitListNameMap,
      'service': {
        'upgrade-service': function(status) {
          return status.upgradeAvailable ?
              'A new upgrade is available' :
              'Upgrade service';
        }
      }
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

    return sortStatuses(addCharmUpgrade(statuses, this.model));
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
      'landscape': 4,
      'upgrade-service': 5
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
    If the charm has available upgrades it adds the upgrade details to the
    statuses list to be displayed in the unit list in the inspector.

    XXX (Jeff): This is done on every update call, we can probably cache this
    result for performance later.

    @method addCharmUpgrade
    @param {Array} statuses An array of statuses from `updateStatusList`.
    @param {Object} service A reference to the service model.
    @return {Array} An array of statuses containing the charm upgrade list
      if applicable.
  */
  function addCharmUpgrade(statuses, service) {
    var upgradeServiceStatus = {
      type: 'service',
      category: 'upgrade-service',
      categoryType: 'upgrade-service',
      upgradeAvailable: service.get('upgrade_available'),
      upgradeTo: service.get('upgrade_to'),
      downgrades: []
    };
    // Retrieve the charm ID (minus the schema).
    var charm = service.get('charm');
    // Find the latest version number - if we have an upgrade, it will be
    // that charm's version; otherwise it will be the current charm's
    // version.
    var currVersion = parseInt(charm.split('-').pop(), 10),
        maxVersion = upgradeServiceStatus.upgradeAvailable ?
            parseInt(upgradeServiceStatus.upgradeTo.split('-').pop(), 10) :
            currVersion;
    // Remove the version number from the charm so that we can build a
    // list of downgrades.
    charm = charm.replace(/-\d+$/, '');
    // Build a list of available downgrades
    if (maxVersion > 1) {
      // Disable -- operator warning so that we can loop.
      /* jshint -W016 */
      for (var version = maxVersion - 1; version > 0; version--) {
        if (version === currVersion) {
          continue;
        }
        upgradeServiceStatus.downgrades.push(charm + '-' + version);
      }
    }
    // If we have an upgrade for this service, then it needs to appear under
    // the pending units (at index 1, so insert at index 2); otherwise, it
    // should just be pushed onto the end of the list of statuses.
    if (upgradeServiceStatus.upgradeAvailable) {
      statuses.splice(2, 0, upgradeServiceStatus);
    } else if (upgradeServiceStatus.downgrades.length > 0) {
      statuses.push(upgradeServiceStatus);
    }

    return statuses;
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
    Generates the list of upgrades/downgrades available for this service.

    @method generateD3UpgradeCharmList
    @param {Object} serviceStatusContentForm the D3 selection for the upgrades
      list.
  */
  function generateD3UpgradeCharmList(serviceStatusContentForm) {
    /*
      The _isLinkSameOrigin method in YUI's pjax.base class does not
      properly account for IE10's issues when parsing protocol and
      host from anchor tags unless the tags contain the full protocol
      and host for relative hrefs.
    */
    var wl = window.location;
    var locationPrefix = wl.protocol + '//' + wl.host;

    var serviceUpgradeLi = serviceStatusContentForm
    .filter(function(d) {
          return d.category === 'upgrade-service';
        })
    .selectAll('li.top-upgrade')
    .data(function(d) {
          if (d.upgradeAvailable) {
            return [d.upgradeTo];
          } else {
            return d.downgrades.slice(0, SHOWCOUNT);
          }
        })
    .enter()
    .append('li')
    .classed('top-upgrade', true);

    serviceUpgradeLi.append('a')
      .attr('href', function(d) {
          return locationPrefix + '/' + d.replace(/^cs:/, '');
        })
      .text(function(d) { return d; });

    serviceUpgradeLi.append('a')
      .classed('upgrade-link right-link', true)
      .attr('data-upgradeto', function(d) { return d; })
      .text('Upgrade');

    serviceStatusContentForm
      .filter(function(d) {
          return d.category === 'upgrade-service' && (d.upgradeAvailable ||
              d.downgrades.length - SHOWCOUNT > 0);
        })
      .append('li')
      .append('a')
      .classed('right-link', true)
      .text(function(d) {
          return (d.downgrades.length - (d.upgradeAvailable ? 0 : SHOWCOUNT)) +
              ' hidden upgrades';
        })
      .on('click', function(d) {
          // Toggle the 'hidden' class.
          serviceStatusContentForm.select('.other-charms')
          .classed('hidden', function() {
                return !d3.select(this).classed('hidden');
              });
        });

    var serviceUpgradeOtherCharms = serviceStatusContentForm
      .filter(function(d) {
          return d.category === 'upgrade-service';
        })
      .append('div')
      .classed('other-charms', true)
      .classed('hidden', true)
      .selectAll('.other-charm')
      .data(function(d) {
          return d.downgrades.slice(d.upgradeAvailable ? 0 : SHOWCOUNT);
        })
      .enter()
      .append('li')
      .classed('other-charm', true);

    serviceUpgradeOtherCharms
      .append('a')
      .attr('href', function(d) {
          return locationPrefix + '/' + d.replace(/^cs:/, '');
        })
      .text(function(d) { return d; });

    serviceUpgradeOtherCharms
      .append('a')
      .classed('upgrade-link right-link', true)
      .attr('data-upgradeto', function(d) { return d; })
      .text('Upgrade');
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

    var serviceStatusContentForm = categoryStatusWrapper
    .filter(function(d) { return d.type === 'service'; })
    .append('div')
    .attr('class', function(d) {
          return 'status-unit-content ' +
              'close-unit ' + d.categoryType;
        });

    // The Upgrade Charm list needs to be generated separately from
    // the typical unit list data in the current UX.
    generateD3UpgradeCharmList(serviceStatusContentForm);

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
          } else {
            if (d.category === 'upgrade-service') {
              // If there is an upgrade available, make room for that, plus the
              // link to show hidden upgrades; otherwise, just return the number
              // of downgrades.
              numItems = d.downgrades.length + (d.upgradeAvailable ? 2 : 0);
            }
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
      '.num-units-control': { keydown: 'modifyUnits' },
      '.cancel-num-units': { click: '_closeUnitConfirm'},
      '.confirm-num-units': { click: '_confirmUnitChange'},
      'a.edit-constraints': { click: '_showEditUnitConstraints'},
      // Overview units events
      '.status-unit-header': {click: 'toggleUnitHeader'},
      '.toggle-select-all': {click: 'toggleSelectAllUnits'},
      'a[data-unit]': { click: 'showUnitDetails'},
      'button.unit-action-button': { click: '_unitActionButtonClick'},
      '.upgrade-link': { click: 'upgradeService' }
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
      this.get('container').append(this.template(attributes.model.getAttrs()));
    },

    /**
      Resets the unit amount if the user cancels the scale up.

      @method resetUnits
    */
    resetUnits: function() {
      var container, model;
      container = this.viewletManager.get('container');
      model = this.viewletManager.get('model');
      var field = container.one('.num-units-control');
      field.set('value', model.get('unit_count'));
      field.set('disabled', false);
    },

    /**
      Modify units dispatcher. When the user interacts with the unit count
      input field this handles their interaction.

      @method modifyUnits
      @param {Object} ev the interaction event object.
    */
    modifyUnits: function(ev) {
      if (ev.keyCode !== ESC && ev.keyCode !== ENTER) {
        return;
      }
      var container, currentUnits;
      container = this.viewletManager.get('container');
      currentUnits = this.viewletManager.get('model').get('unit_count');
      var field = container.one('.num-units-control');

      if (ev.keyCode === ESC) {
        this.resetUnits();
      }
      if (ev.keyCode !== ENTER) { // If not Enter keyup...
        return;
      }
      ev.halt(true);

      var numUnits = field.get('value');

      if (/^\d+$/.test(numUnits)) {
        numUnits = parseInt(numUnits, 10);
        if (numUnits > currentUnits) {
          // We only confirm unit count increases because they may (directly)
          // cost the user money.
          this._confirmUnitConstraints(numUnits);
        } else {
          this._modifyUnits(numUnits);
        }
      } else {
        this.resetUnits();
      }
    },

    /**
      Shows the UX below the unit input box for the user to confirm the
      constraints for the new units.

      @method _confirmUnitConstraints
      @param {Number} requestedUnitCount the number of units to create.
    */
    _confirmUnitConstraints: function(requestedUnitCount) {
      var container = this.get('container'),
          genericConstraints = this.options.env.genericConstraints,
          confirm = container.one('.unit-constraints-confirm'),
          srvConstraints = this.model.get('constraints') || {};

      confirm.setHTML(templates['service-overview-constraints']({
        srvConstraints: srvConstraints,
        constraints: utils.getConstraints(srvConstraints, genericConstraints)
      }));
      confirm.removeClass('closed');
    },

    /**
      Modify the unit count.

      @method _modifyUnits
      @param {Integer} requested_unit_count the requested count to change
        the number of units.
    */
    _modifyUnits: function(requested_unit_count) {
      var container = this.viewletManager.get('container');
      var env = this.viewletManager.get('env');

      var service = this.model || this.get('model');
      var unit_count = service.get('unit_count');
      var field = container.one('.num-units-control');

      if (requested_unit_count < 1) {
        field.set('value', unit_count);
        return;
      }

      var delta = requested_unit_count - unit_count;
      if (delta > 0) {
        // Add units! The third argument (null) below represents the machine
        // where to deploy new units. For now a new machine is created for each
        // unit.
        env.add_unit(
            service.get('id'), delta, null,
            Y.bind(this._addUnitCallback, this));
      } else if (delta < 0) {
        delta = Math.abs(delta);
        var units = service.get('units'),
            unit_ids_to_remove = [];

        for (var i = units.size() - 1;
            unit_ids_to_remove.length < delta;
            i -= 1) {
          unit_ids_to_remove.push(units.item(i).id);
        }
        env.remove_units(
            unit_ids_to_remove,
            Y.bind(this._removeUnitCallback, this)
        );
      }
      field.set('disabled', true);
    },

    /**
      Closes the unit confirm constraints dialogue.

      @method _closeUnitConfirm
    */
    _closeUnitConfirm: function(e) {
      var container = this.get('container'),
          confirm = container.one('.unit-constraints-confirm');

      // If this was from the user clicking cancel
      if (e && e.halt) {
        e.halt();
        this.resetUnits();
      }

      // editing class added if the user clicked 'edit'
      confirm.removeClass('editing');
      confirm.addClass('closed');
      this.overviewConstraintsEdit = false;
    },

    /**
      Calls the _modifyUnits method with the unit count when the user
      accepts the constraints

      @method _confirmUnitChange
    */
    _confirmUnitChange: function(e) {
      e.halt();
      var container = this.get('container'),
          unitCount = container.one('input.num-units-control').get('value'),
          service = this.model;

      // If the user chose to edit the constraints
      if (this.overviewConstraintsEdit) {
        var constraints = utils.getElementsValuesMapping(
                          container, '.constraint-field');
        var cb = Y.bind(this._modifyUnits, this, unitCount);
        this.options.env.set_constraints(service.get('id'), constraints, cb);
      } else {
        this._modifyUnits(unitCount);
      }
      this._closeUnitConfirm();
    },

    /**
      Shows the unit constraints when the user wants to edit them
      while increasing the total number of units

      @method _showEditUnitConstraints
    */
    _showEditUnitConstraints: function(e) {
      e.halt();
      var container = this.get('container');
      container.all('.hide-on-edit').hide();
      container.one('.editable-constraints').show();
      container.one('.unit-constraints-confirm').addClass('editing');
      this.overviewConstraintsEdit = true;
    },

    /**
      The callback for the add unit call.

      @method _addUnitCallback
      @param {Object} ev the event object.
    */
    _addUnitCallback: function(ev) {
      var container = this.viewletManager.get('container');
      var field = container.one('.num-units-control');
      var service, db;
      service = this.viewletManager.get('model');
      db = this.viewletManager.get('db');
      var unit_names = ev.result || [];
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error adding unit',
              message: ev.num_units + ' units',
              level: 'error',
              modelId: service
            })
        );
      } else {
        service.get('units').add(
            Y.Array.map(unit_names, function(unit_id) {
              return {id: unit_id,
                agent_state: 'pending'};
            }));
        service.set(
            'unit_count', service.get('unit_count') + unit_names.length);
      }
      field.set('disabled', false);
    },

    /**
      The remove unit callback.

      @method _removeUnitCallback
      @param {Object} ev the event object.
    */
    _removeUnitCallback: function(ev) {
      var service = this.viewletManager.get('model');
      var db = this.viewletManager.get('db');
      var unit_names = ev.unit_names;

      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: (function() {
                if (!ev.unit_names || ev.unit_names.length < 2) {
                  return 'Error removing unit';
                }
                return 'Error removing units';
              })(),
              message: (function() {
                if (!ev.unit_names || ev.unit_names.length === 0) {
                  return '';
                }
                if (ev.unit_names.length > 1) {
                  return 'Unit names: ' + ev.unit_names.join(', ');
                }
                return 'Unit name: ' + ev.unit_names[0];
              })(),
              level: 'error',
              modelId: service
            })
        );
      } else {
        Y.Array.each(unit_names, function(unit_name) {
          var service = db.services.getById(unit_name.split('/')[0]);
          var units = service.get('units');
          units.remove(units.getById(unit_name));
        });
        service.set(
            'unit_count', service.get('unit_count') - unit_names.length);
      }
      this.viewletManager.get('container')
        .one('.num-units-control')
        .set('disabled', false);
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
      var db = this.viewletManager.get('db');
      var unitName = ev.currentTarget.getData('unit');
      var service = db.services.getById(unitName.split('/')[0]);
      var unit = service.get('units').getById(unitName);
      this.viewletManager.showViewlet('unitDetails', unit);
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
      Upgrades a service to the one specified in the event target's upgradeto
      data attribute.

      @method upgradeService
      @param {Y.EventFacade} ev Click event object.
    */
    upgradeService: function(ev) {
      ev.halt();
      var viewletManager = this.viewletManager,
          db = viewletManager.get('db'),
          env = viewletManager.get('env'),
          store = viewletManager.get('store'),
          service = this.model,
          upgradeTo = ev.currentTarget.getData('upgradeto');
      if (!upgradeTo) {
        return;
      }
      if (!env.setCharm) {
        db.notifications.add(new db.models.Notification({
          title: 'Environment does not support setCharm',
          message: 'Your juju environment does not support setCharm/' +
              'upgrade-charm through the API; please try from the ' +
              'command line.',
          level: 'error'
        }));
        console.warn('Environment does not support setCharm.');
      }
      env.setCharm(service.get('id'), upgradeTo, false, function(result) {
        if (result.err) {
          db.notifications.create({
            title: 'Error setting charm.',
            message: result.err,
            level: 'error'
          });
          return;
        }
        env.get_charm(upgradeTo, function(data) {
          if (data.err) {
            db.notifications.create({
              title: 'Error retrieving charm.',
              message: data.err,
              level: 'error'
            });
          }
          // Set the charm on the service.
          service.set('charm', upgradeTo);
          store.promiseUpgradeAvailability(data.result, db.charms).then(
              function(latestId) {
                // Redraw(?) the inspector.
                service.set('upgrade_available', !!latestId);
                service.set('upgrade_to', !!latestId ? 'cs:' + latestId : '');
              },
              function(error) {
                db.notifications.create({
                  title: 'Error retrieving charm.',
                  message: error,
                  level: 'error'
                });
              });
        });
      });
    },



    // These methods are exposed here to allow us access for testing.
    categoryName: categoryName,
    generateAndBindStatusHeaders: generateAndBindStatusHeaders,
    generateActionButtonList: generateActionButtonList,
    updateStatusList: updateStatusList,
    addCharmUpgrade: addCharmUpgrade,
    sortStatuses: sortStatuses
  });

}, '0.0.1', {
  requires: [
    'node',
    'd3',
    'd3-statusbar',
    'juju-charm-models',
    'viewlet-view-base',
    'juju-view'
  ]
});
