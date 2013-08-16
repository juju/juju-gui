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
    Generates the unit list sorted by status category and landscape
    annotation key and returns an array with the data to
    generate the unit list UI.

    @method updateUnitList
    @param {Object} values From the databinding update method.
    @return {Array} An array of objects with agent_state or landscape
    annotation id as category and an array of units
    [{ category: 'started', units: [model, model, ...]}].
    */
  function updateUnitList(values) {
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
      statuses.push({category: key, units: unit});
    });

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
        buttonTypes = ['resolve', 'retry', 'replace', 'landscape'],
        // if you adjust this list don't forget to edit
        // the list in the unit tests
        buttons = {
          error: ['resolve', 'retry', 'replace'],
          pending: ['retry', 'replace'],
          running: ['replace'],
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

    @method generateAndBindUnitHeaders
    @param {Array} statuses A key value pair of categories to unit list.
    */
  function generateAndBindUnitHeaders(node, statuses) {
    /* jshint -W040 */
    var self = this,
        buttonHeight;

    var categoryWrapperNodes = d3.select(node.getDOMNode())
    .selectAll('.unit-list-wrapper')
    .data(statuses, function(d) {
          return d.category;
        });

    // D3 header enter section
    var unitStatusWrapper = categoryWrapperNodes
    .enter()
    .append('div')
    .classed('unit-list-wrapper hidden', true);

    var unitStatusHeader = unitStatusWrapper
    .append('div')
    .attr('class', function(d) {
          return 'status-unit-header ' +
              'closed-unit-list ' + d.category;
        });

    var unitStatusContentForm = unitStatusWrapper
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
          var tmpl = templates['unit-action-buttons'](
            generateActionButtonList(d.category));
          buttonHeight = tmpl.offsetHeight;
          return tmpl;
        });

    unitStatusHeader.append('span')
    .classed('unit-qty', true);

    unitStatusHeader.append('span')
    .classed('category-label', true);

    unitStatusHeader.append('span')
    .classed('chevron', true);

    // D3 header update section
    categoryWrapperNodes.select('.unit-qty')
    .text(function(d) {
          return d.units.length;
        });

    // Toggles the sections visible or hidden based on
    // whether there are units in their list.
    categoryWrapperNodes.filter(function(d) { return d.units.length > 0; })
    .classed('hidden', false);

    categoryWrapperNodes.filter(function(d) {
      return d.units.length === undefined;
    })
    .classed('hidden', true);

    // Add the category label to each heading
    categoryWrapperNodes.select('.category-label')
    .text(function(d) {
          return unitListNameMap[d.category];
        });

    var unitsList = categoryWrapperNodes.select('ul')
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

    // D3 content update section
    unitsList.sort(
        function(a, b) {
          return a.number - b.number;
        });

    categoryWrapperNodes
      .select('.status-unit-content')
      .style('max-height', function(d) {
          if (!self._unitItemHeight) {
            self._unitItemHeight =
                d3.select(this).select('li').property('offsetHeight');
          }
          return ((self._unitItemHeight *
              (d.units.length + 1)) + buttonHeight) + 'px';
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
              target: node.getDOMNode()
            }).render();
          }
          bar.update(value);
        }
      },
      units: {
        depends: ['aggregated_status'],
        'update': function(node, value) {
          // Called under the databinding context.
          // Subordinates may not have a value.
          if (value) {
            var statuses = this.viewlet.updateUnitList(value);
            this.viewlet.generateAndBindUnitHeaders(node, statuses);
          }
        }
      }
    },
    // These methods are exposed here to allow us access for testing.
    updateUnitList: updateUnitList,
    generateAndBindUnitHeaders: generateAndBindUnitHeaders,
    generateActionButtonList: generateActionButtonList
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
