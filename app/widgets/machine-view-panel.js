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
 * Provide the machine view panel view.
 *
 * @module views
 */

YUI.add('machine-view-panel', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      Templates = views.Templates;

  /**
   * The view associated with the machine view panel.
   *
   * @class MachineViewPanelView
   */
  var MachineViewPanelView = Y.Base.create('MachineViewPanelView', Y.View,
      [
        Y.Event.EventTracker
      ], {
        template: Templates['machine-view-panel'],

        events: {
          '.machine-token .token': {
            click: 'handleTokenSelect'
          }
        },

        /**
         * Handle initial view setup.
         *
         * @method initializer
         */
        initializer: function() {
          this._bindModelEvents();
        },

        /**
         * Bind the events to the models.
         *
         * @method _bindModelEvents
         */
        _bindModelEvents: function() {
          this.get('db').machines.after(['add', 'remove', '*:change'],
              this._updateMachines, this);
        },

        /**
         * Display containers for the selected machine.
         *
         * @method handleTokenSelect
         * @param {Event} ev the click event created.
         */
        handleTokenSelect: function(e) {
          var container = this.get('container'),
              machineTokens = container.all('.machines .content .items .token'),
              selected = e.currentTarget,
              parentId = selected.ancestor().getData('id'),
              containers = this.get('db').machines.filterByParent(parentId);
          e.preventDefault();
          // Select the active token.
          machineTokens.removeClass('active');
          selected.addClass('active');
          this._renderContainerTokens(containers, parentId);
        },

        /**
         * Render the header widgets.
         *
         * @method _renderHeaders
         */
        _renderHeaders: function() {
          this._machinesHeader = this._renderHeader(
              '.column.machines .head', {
                title: 'Environment',
                action: 'New machine',
                dropLabel: 'Create new machine'
              });
          this._containersHeader = this._renderHeader(
              '.column.containers .head', {
                action: 'New container',
                dropLabel: 'Create new container'
              });
          this._unplacedHeader = this._renderHeader(
              '.column.unplaced .head', {
                title: 'Unplaced units'
              });
        },

        /**
         * Render a header widget.
         *
         * @method _renderHeader
         * @param {String} container the column class the header will be
         * rendered to.
         * @param {Object} attrs the attributes to be passed to the view.
         */
        _renderHeader: function(container, attrs) {
          attrs.container = this.get('container').one(container);
          return new views.MachineViewPanelHeaderView(attrs).render();
        },

        /**
         * Display a list of given containers.
         *
         * @method _renderContainerTokens
         * @param {Array} containers the list of containers to render.
         */
        _renderContainerTokens: function(containers, parentId) {
          var containerParent = this.get('container').one(
              '.containers .content .items');
          var allUnits = this._getAllUnits({id: parentId});

          var containersPlural = containers.length !== 1 ? 's' : '';
          var unitsPlural = allUnits.length !== 1 ? 's' : '';

          this._clearContainerColumn();
          this._containersHeader.setLabel(
              containers.length + ' container' + containersPlural + ', ' +
              allUnits.length + ' unit' + unitsPlural);

          if (containers.length > 0) {
            Y.Object.each(containers, function(container) {
              this._updateMachineWithUnitData(container);
              new views.ContainerToken({
                containerTemplate: '<li/>',
                containerParent: containerParent,
                machine: container
              }).render();
            }, this);
          }

          // Create the 'bare metal' container.
          var units = this.get('db').units.filterByMachine(parentId);
          if (units.length > 0) {
            var machine = {displayName: 'Bare metal'};
            this._updateMachineWithUnitData(machine, units);
            new views.ContainerToken({
              containerTemplate: '<li/>',
              containerParent: containerParent,
              machine: machine
            }).render();
          }
        },

        /**
         * Clear the container column.
         *
         * @method _clearContainerColumn
         */
        _clearContainerColumn: function() {
          var container = this.get('container');
          var containerParent = container.one('.containers .content .items');
          // Remove all the container items.
          containerParent.get('childNodes').remove();
          // Set the header label text to the default.
          this._containersHeader.setLabel('0 containers, 0 units');
        },

        /**
         * Render the machine token widgets.
         *
         * @method _updateMachines
         */
        _updateMachines: function() {
          var exists, newElement;
          var machines = this.get('db').machines.filterByParent(null);
          var container = this.get('container');
          var machineList = container.one('.machines .content .items');
          if (!machines || !machineList) {
            return;
          }
          var machineElements = machineList.all('li');
          var plural = machines.length !== 1 ? 's' : '';

          // Update the header to show the machine count.
          this._machinesHeader.setLabel(
              machines.length + ' machine' + plural);

          machines.forEach(function(machine) {
            exists = machineElements.some(function(element) {
              // If the machine already exists in the dom, mark it as such.
              if (String(machine.id) === element.getData('id')) {
                element.setData('exists', true);
                return true;
              }
            });
            if (!exists) {
              // If the machine does not exist in the dom, render the token.
              newElement = this._renderMachineToken(machine, machineList);
              newElement.setData('exists', true);
            }
          }, this);

          machineElements.each(function(element) {
            if (!element.getData('exists')) {
              // If the element exists in the dom, but not in the model
              // list then it must have been remove, so remove it from
              // the dom.
              if (element.one('.token').hasClass('active')) {
                // If the selected machine was removed then stop showing
                // its containers.
                this._clearContainerColumn();
              }
              element.remove();
            } else if (machines.length === 0) {
              element.remove();
              this._clearContainerColumn();
            } else {
              // Clean up the 'exists' flag for the next loop through
              // the machine nodes.
              element.setData('exists', undefined);
            }
          }, this);
        },

        /**
         * Render a machine token.
         *
         * @method _renderMachineToken
         * @param {Object} machine the machine object.
         * @param {Node} list the list node to append the machine to.
         */
        _renderMachineToken: function(machine, list) {
          var node = Y.Node.create('<li></li>'),
              units = this._getAllUnits(machine);
          this._updateMachineWithUnitData(machine, units);
          new views.MachineToken({
            container: node,
            machine: machine
          }).render();
          list.append(node);
          return node;
        },

        /**
         * Get all units on the machine, including those on containers in the
         * machine.
         *
         * @method _getAllUnits
         * @param {Object} machine The machine object.
         */
        _getAllUnits: function(machine) {
          var db = this.get('db'),
              units = db.units.filterByMachine(machine.id),
              containers = db.machines.filterByParent(machine.id);
          Y.Array.each(containers, function(container) {
            units.push(db.units.filterByMachine(container.id));
          });
          return Y.Array.flatten(units);
        },

        /**
         * Add units and their icons to the machine.
         *
         * @method _getAllUnits
         * @param {Object} machine The machine object.
         * @param {Array} units (optional) The units to add to the machine.
         */
        _updateMachineWithUnitData: function(machine, units) {
          var db = this.get('db');
          if (!units) {
            units = db.units.filterByMachine(machine.id);
          }
          Y.Object.each(units, function(unit) {
            unit.icon = db.services.getById(unit.service).get('icon');
          });
          machine.units = units;
          return units;
        },

        /**
         * Render the undeployed service unit tokens.
         *
         * @method _renderServiceUnitTokens
         */
        _renderServiceUnitTokens: function() {
          var container = this.get('container'),
              listContainer = container.one('.unplaced .content'),
              parentNode = listContainer.one('.items'),
              units = this.get('db').serviceUnits;

          if (units && units.length && units.length > 0) {
            Y.Object.each(units, function(unit) {
              var node = Y.Node.create('<li></li>');
              new views.ServiceUnitToken({
                container: node,
                title: unit.displayName,
                id: unit.id,
                machines: this.get('db').machines.filterByParent(null),
                containers: [] // XXX Need to find query for getting containers
              }).render();
              parentNode.append(node);
            });
            // only append to the DOM once
            listContainer.append(parentNode);
          }
        },

        /**
         * Render the scale up UI.
         *
         * @method _renderScaleUp
         */
        _renderScaleUp: function() {
          var scaleUpContainer = this.get('container')
                              .one('.column.unplaced .scale-up');
          this._scaleUpView = new views.ServiceScaleUpView({
            container: scaleUpContainer,
            services: this.get('db').services
          }).render();
          this.addEvent(
              this._scaleUpView.on('addUnit', this._scaleUpService, this));
        },

        /**
          Handler for addUnit events emitted by the ServiceScaleUpView.

          @method _scaleUpService
          @param {Object} e The addUnit event facade.
        */
        _scaleUpService: function(e) {
          this.get('env').add_unit(e.serviceName, e.unitCount, null, null);
        },

        /**
         * Sets up the DOM nodes and renders them to the DOM.
         *
         * @method render
         */
        render: function() {
          var container = this.get('container');
          container.setHTML(this.template());
          container.addClass('machine-view-panel');
          this._renderHeaders();
          this._updateMachines();
          this._renderServiceUnitTokens();
          this._renderScaleUp();
          this._clearContainerColumn();
          return this;
        },

        /**
          Empties the views container and removes attached classes

          @method destructor
        */
        destructor: function() {
          var container = this.get('container');
          container.setHTML('');
          container.removeClass('machine-view-panel');
          if (this._scaleUpView) {
            this._scaleUpView.destroy();
          }
        },

        ATTRS: {
          /**
           * The container element for the view.
           *
           * @attribute container
           * @type {Object}
           */
          container: {},

          /**
            Reference to the application db

            @attribute db
            @type {Object}
          */
          db: {}
        }
      });

  views.MachineViewPanelView = MachineViewPanelView;

}, '0.1.0', {
  requires: [
    'event-tracker',
    'handlebars',
    'juju-serviceunit-token',
    'juju-templates',
    'juju-view-utils',
    'container-token',
    'machine-token',
    'juju-serviceunit-token',
    'machine-view-panel-header',
    'node',
    'service-scale-up-view',
    'view'
  ]
});
