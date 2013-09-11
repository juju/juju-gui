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

  var unitListNameMap = {
    error: 'Error',
    pending: 'Pending',
    running: 'Running',
    'landscape-needs-reboot': 'Needs Reboot',
    'landscape-security-upgrades': 'Security Upgrade'
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

    var name = nameMap[status.type][status.category];
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
  function updateStatusList(values) {
    var statuses = [],
        unitByStatus = {};

    values.each(function(value) {
      var category = utils.simplifyState(value);
      if (!unitByStatus[category]) {
        unitByStatus[category] = [];
      }
      unitByStatus[category].push(value);

      // landscape annotations
      var lIds = utils.landscapeAnnotations(value);
      lIds.forEach(function(annotation) {
        if (!unitByStatus[annotation]) {
          unitByStatus[annotation] = [];
        }
        unitByStatus[annotation].push(value);
      });
    });

    // This will generate a list with all categories.
    Y.Object.each(unitListNameMap, function(value, key) {
      var unit = {};
      if (unitByStatus[key]) {
        unit = unitByStatus[key];
      }
      statuses.push({type: 'unit', category: key, units: unit});
    });

    var flags = window.flags;
    if (flags.upgradeCharm) {
      // Disable strict violation warning for use of `this`.
      /* jshint -W040 */
      var service = this.model;
      var upgradeServiceStatus = {
        type: 'service',
        category: 'upgrade-service',
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
      } else {
        statuses.push(upgradeServiceStatus);
      }
    }

    return statuses;
  }

  /**
    Generates the list of allowable buttons for the
    different inspector unit lists.

    @method generateActionButtonList
    @param {String} category The unit status category.
    */
  function generateActionButtonList(category) {
    var showingButtons = {},
        buttonTypes = ['resolve', 'retry', 'remove', 'landscape'],
        // if you adjust this list don't forget to edit
        // the list in the unit tests
        buttons = {
          error: ['resolve', 'retry', 'remove'],
          pending: ['retry', 'remove'],
          running: ['remove'],
          'landscape-needs-reboot': ['landscape'],
          'landscape-security-upgrades': ['landscape']
        };

    buttonTypes.forEach(function(buttonType) {
      buttons[category].forEach(function(allowedButton) {
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
    .classed('unit-list-wrapper hidden', true);

    var categoryStatusHeader = categoryStatusWrapper
    .append('div')
    .attr('class', function(d) {
          return 'status-unit-header ' +
              'closed-unit-list ' + d.category;
        });

    var serviceStatusContentForm = categoryStatusWrapper
    .filter(function(d) { return d.type === 'service'; })
    .append('div')
    .attr('class', function(d) {
          return 'status-unit-content ' +
              'close-unit ' + d.category;
        });

    var serviceUpgradeLi = serviceStatusContentForm
    .filter(function(d) {
          return d.category === 'upgrade-service' && d.upgradeAvailable;
        })
    .append('li');

    serviceUpgradeLi.append('a')
      .attr('href', function(d) {
          return '/' + d.upgradeTo.replace(/^cs:/, '');
        })
      .text(function(d) { return d.upgradeTo; });

    serviceUpgradeLi.append('a')
      .classed('upgrade-link right-link', true)
      .attr('data-upgradeto', function(d) { return d.upgradeTo; })
      .text('Upgrade');

    serviceStatusContentForm
      .filter(function(d) {
          return d.category === 'upgrade-service' && d.upgradeAvailable;
        })
      .append('li')
      .append('a')
      .classed('right-link', true)
      .text(function(d) {
          return d.downgrades.length + ' hidden upgrades';
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
      .classed('hidden', function(d) {
          return d.upgradeAvailable;
        })
      .selectAll('.other-charm')
      .data(function(d) {
          return d.downgrades;
        })
      .enter()
      .append('li')
      .classed('other-charm', true);

    serviceUpgradeOtherCharms
      .append('a')
      .attr('href', function(d) {
          return '/' + d.replace(/^cs:/, '');
        })
      .text(function(d) { return d; });

    serviceUpgradeOtherCharms
      .append('a')
      .classed('upgrade-link right-link', true)
      .attr('data-upgradeto', function(d) { return d; })
      .text('Upgrade');

    var unitStatusContentForm = categoryStatusWrapper
    .filter(function(d) { return d.type === 'unit'; })
    .append('div')
    .attr('class', function(d) {
          return 'status-unit-content ' +
              'close-unit ' + d.category;
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
          var context = generateActionButtonList(d.category);
          if (context.landscape) {
            context.landscapeURL = utils.getLandscapeURL(
              environment, self.model);
          }
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

    // Toggles the sections visible or hidden based on if this is a service
    // status or, if it's a unit status, whether there are units in the list.
    categoryWrapperNodes.filter(function(d) {
      return d.type === 'service' || (d.type === 'unit' && d.units.length > 0);
    })
    .classed('hidden', false);

    categoryWrapperNodes.filter(function(d) {
      return d.type === 'unit' && d.units.length === undefined;
    })
    .classed('hidden', true);

    // Add the category label to each heading
    categoryWrapperNodes.select('.category-label')
    .text(categoryName);

    var unitsList = categoryWrapperNodes
    .filter(function(d) { return d.type === 'unit'; })
    .select('ul')
    .selectAll('li')
    .data(function(d) {
          return d.units;
        }, function(unit) {
          return unit.id;
        });

    // D3 content enter section
    var unitItem = unitsList.enter()
    .append('li');

    unitItem.append('input')
    .attr({
          'type': 'checkbox',
          'name': function(unit) {
            return unit.id;
          }});

    unitItem.append('a').text(
        function(d) {
          return d.id;
        })
      .attr('data-unit', function(d) {
          return d.service + '/' + d.number;
        });

    // Handle Landscape actions.
    unitItem.filter(function() {
      return Y.Node(this).ancestor('.landscape-needs-reboot');
    }).append('a').classed('right-link', true).attr({
      // Retrieve the Landscape reboot URL for the unit.
      'href': function(d) {
        return utils.getLandscapeURL(environment, d, 'reboot');
      },
      target: '_blank'
    }).text('Reboot');

    unitItem.filter(function() {
      return Y.Node(this).ancestor('.landscape-security-upgrades');
    }).append('a').classed('right-link', true).attr({
      // Retrieve the Landscape security upgrade URL for the unit.
      'href': function(d) {
        return utils.getLandscapeURL(environment, d, 'security');
      },
      target: '_blank'
    }).text('Upgrade');

    // D3 content update section
    unitsList.sort(
        function(a, b) {
          return a.number - b.number;
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
      }
    },
    // These methods are exposed here to allow us access for testing.
    categoryName: categoryName,
    generateAndBindStatusHeaders: generateAndBindStatusHeaders,
    generateActionButtonList: generateActionButtonList,
    updateStatusList: updateStatusList
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
