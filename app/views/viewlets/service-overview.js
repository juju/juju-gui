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


YUI.add('viewlet-inspector-overview', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      views = Y.namespace('juju.views'),
      templates = Y.namespace('juju.views').Templates,
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

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
      var additions = {
        category: category,
        categoryType: categoryType
      };
      statuses.push({
        type: 'unit',
        category: category,
        categoryType: categoryType,
        units: pushIntoUnitList(unitByStatus[category], additions)
      });
    });

    return sortStatuses(addCharmUpgrade(statuses, this.model));
  }

  /**
    Adds a reference to each unit in the given list to an object along with
    all keys and values from the additions object.

    @method pushIntoUnitList
    @param {Array} list an array of units
    @param {Object} additions a key/value pair collection of data to add to
      each unit in the unit list
    @return {Array} The unit list with the new values pushed into each unit.
  */
  function pushIntoUnitList(list, additions) {
    return list.map(function(item) {
      var unit = { unit: item };
      Object.keys(additions).forEach(function(key) {
        unit[key] = additions[key];
      });
      return unit;
    });
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


  ns.overview = {
    name: 'overview',
    template: templates.serviceOverview,
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
    // These methods are exposed here to allow us access for testing.
    categoryName: categoryName,
    generateAndBindStatusHeaders: generateAndBindStatusHeaders,
    generateActionButtonList: generateActionButtonList,
    updateStatusList: updateStatusList,
    addCharmUpgrade: addCharmUpgrade,
    sortStatuses: sortStatuses
  };

}, '0.0.1', {
  requires: [
    'node',
    'd3',
    'd3-statusbar',
    'juju-charm-models',
    'juju-view'
  ]
});
