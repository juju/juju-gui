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
            click: 'handleMachineTokenSelect'
          },
          '.container-token .token': {
            click: 'handleContainerTokenSelect'
          }
        },

        /**
         * Handle initial view setup.
         *
         * @method initializer
         */
        initializer: function() {
          this._bindEvents();
        },

        /**
         * Bind the events to the models.
         *
         * @method _bindEvents
         */
        _bindEvents: function() {
          var db = this.get('db');
          this.addEvent(db.machines.after(
              ['add', 'remove', '*:change'], this._onMachinesChange, this)
          );

          this.addEvent(db.units.after(
              ['add', 'remove', '*:change'], this._onUnitsChange, this));

          this.on('*:unit-token-drag-start', this._showDraggingUI, this);
          this.on('*:unit-token-drag-end', this._hideDraggingUI, this);
          this.on('*:unit-token-drop', this._unitTokenDropHandler, this);
        },

        /**
          Handle changes to the units in the db unit model list.

         @method _onUnitsChange
         @param {Object} e Custom model change event facade.
        */
        _onUnitsChange: function(e) {
          if (e.changed) {
            // Need to update any machines that now have new units
            var machineChanged = e.changed.machine;
            if (machineChanged) {
              this._updateMachine(machineChanged.newVal);
            }
          }
          this._renderUnplacedUnits();
        },

        /**
          Handles changes to the machines in the db model list.

         @method _onMachinesChange
         @param {Object} e Custom model change event facade.
        */
        _onMachinesChange: function(e) {
          this._renderMachines();
        },

        /**
          Converts the machine view into the dragging UI.

          @method _showDraggingUI
          @param {Object} e Custom drag start event facade.
        */
        _showDraggingUI: function(e) {
          this._machinesHeader.setDroppable();
          // We only show that the container header is droppable if the user
          // has selected a machine as a parent already.
          if (this.get('selectedMachine')) {
            this._containersHeader.setDroppable();
          }
        },

        /**
          Converts the machine view into the normal UI from it's dragging UI.

          @method _hideDraggingUI
          @param {Object} e Custom drag end event facade.
        */
        _hideDraggingUI: function(e) {
          this._machinesHeader.setNotDroppable();
          this._containersHeader.setNotDroppable();
        },

        /**
          Unit token drop handler. Handles the unit beind dropped on anything
          in the machine view.

          @method _unitTokenDropHandler
          @param {Object} e The custom drop event facade.
        */
        _unitTokenDropHandler: function(e) {
          var selected = this.get('selectedMachine');
          var dropAction = e.dropAction;
          var parentId = e.targetId;
          var containerType = (dropAction === 'container') ? 'lxc' : undefined;
          var env = this.get('env');
          var db = this.get('db');
          var unit;

          if (dropAction === 'container' &&
              (parentId && parentId.indexOf('/') !== -1)) {
            // If the user drops a unit on an already created container then
            // place the unit.
            unit = db.units.getById(e.unit);
            env.placeUnit(unit, parentId);
          } else {
            var machine = env.addMachines([{
              containerType: containerType,
              parentId: parentId || selected
              // XXX A callback param MUST be provided even if it's just an
              // empty function, the ECS relies on wrapping this function so if
              // it's null it'll just stop executing. This should probably be
              // handled properly on the ECS side. Jeff May 12 2014
            }], function() {}, { modelId: null });

            unit = db.units.getById(e.unit);
            env.placeUnit(unit, machine.id);
          }
        },

        /**
         * Display containers for the selected machine.
         *
         * @method handleMachineTokenSelect
         * @param {Event} ev the click event created.
         */
        handleMachineTokenSelect: function(e) {
          var container = this.get('container'),
              machineTokens = container.all('.machines .content .items .token'),
              selected = e.currentTarget,
              parentId = selected.getData('id');
          var containers = this.get('db').machines.filterByParent(parentId);
          e.preventDefault();
          // A lot of things in the machine view rely on knowing when the user
          // selects a machine.
          this.set('selectedMachine', parentId);
          // Select the active token.
          machineTokens.removeClass('active');
          selected.addClass('active');
          this._renderContainerTokens(containers, parentId);
        },

        /**
         * Set the active container.
         *
         * @method handleContainerTokenSelect
         * @param {Event} ev the click event created.
         */
        handleContainerTokenSelect: function(e) {
          var container = this.get('container');
          var machineTokens = container.all(
              '.containers .content .items .token');
          var selected = e.currentTarget;
          // Select the active token.
          machineTokens.removeClass('active');
          selected.addClass('active');
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
                action: 'machine',
                actionLabel: 'Add machine',
                dropLabel: 'Create new machine'
              });
          this._machinesHeader.addTarget(this);
          this._containersHeader = this._renderHeader(
              '.column.containers .head', {
                action: 'container',
                actionLabel: 'Add container',
                dropLabel: 'Create new container'
              });
          this._containersHeader.addTarget(this);
          this._unplacedHeader = this._renderHeader(
              '.column.unplaced .head', {
                title: 'Unplaced units'
              });
          this._unplacedHeader.addTarget(this);
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
         * @param {String} parentId the ancestor machine name.
         */
        _renderContainerTokens: function(containers, parentId) {
          var db = this.get('db');
          var containerParent = this.get('container').one(
              '.containers .content .items');
          var numUnits = db.units.filterByMachine(parentId, true).length;

          var containersPlural = containers.length !== 1 ? 's' : '';
          var unitsPlural = numUnits !== 1 ? 's' : '';

          this._clearContainerColumn();
          this._containersHeader.setLabel(
              containers.length + ' container' + containersPlural + ', ' +
              numUnits + ' unit' + unitsPlural);

          if (containers.length > 0) {
            Y.Object.each(containers, function(container) {
              this._createContainerToken(containerParent, container);
            }, this);
          }

          // Create the 'bare metal' container.
          var units = db.units.filterByMachine(parentId);
          if (units.length > 0) {
            var machine = {displayName: 'Bare metal'};
            this._createContainerToken(containerParent, machine, units);
          }
        },

        /**
           Create a container token
           @param {Y.Node} containerParent The parent node for the token's
             container
           @param {Object} container The lxc or kvm container object
           @param {Array} units Optional list of units on the container.
             If not provided, the container's units will be looked up.
           @method _createContainerToken
         */
        _createContainerToken: function(containerParent, container, units) {
          if (!units) {
            units = this.get('db').units.filterByMachine(container.id);
          }
          this._updateMachineWithUnitData(container, units);
          var token = new views.ContainerToken({
            containerTemplate: '<li/>',
            containerParent: containerParent,
            machine: container
          });
          token.render();
          token.addTarget(this);
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
         * @method _renderMachines
         */
        _renderMachines: function() {
          var machines = this.get('db').machines.filterByParent(null);
          var container = this.get('container');
          var machineList = container.one('.machines .content .items');
          var plural = machines.length !== 1 ? 's' : '';

          // Update the header to show the machine count.
          this._machinesHeader.setLabel(
              machines.length + ' machine' + plural);

          this._smartUpdateList(machines, machineList,
                                this._renderMachineToken.bind(this),
                                this._clearContainerColumn.bind(this));
        },

        /**
         * Find and re-render a specific machine token.
         *
         * @method _updateMachine
         * @param {Integer} id the ID of the machine to update
         */
        // XXX: replace this with direct access to the upcoming _machineTokens
        // list
        _updateMachine: function(machineOrId) {
          var id;
          if (typeof machineOrId === 'string') {
            id = machineOrId;
          } else {
            id = machineOrId.id;
          }
          var container = this.get('container'),
              selector = '.machines .content .machine-token[data-id="{id}"]',
              machineNode = container.one(Y.Lang.sub(selector, {id: id}));
          if (machineNode) {
            machineNode.replace(this._renderMachineToken(machineOrId));
          }
        },

        /**
         * Render a machine token.
         *
         * @method _renderMachineToken
         * @param {Object} machine the machine object.
         * @param {Node} list the list node to append the machine to.
         */
        _renderMachineToken: function(machineOrId) {
          var db = this.get('db'),
              machine;
          if (typeof machineOrId === 'string') {
            machine = db.machines.getById(machineOrId);
          } else {
            machine = machineOrId;
          }
          var node = Y.Node.create('<li></li>'),
              units = db.units.filterByMachine(machine.id, true);
          this._updateMachineWithUnitData(machine, units);
          var token = new views.MachineToken({
            container: node,
            machine: machine
          });
          token.render();
          token.addTarget(this);
          return node;
        },

        /**
         * Add units and their icons to the machine.
         *
         * @method _updateMachineWithUnitData
         * @param {Object} machine The machine object.
         * @param {Array} units The units to add to the machine.
         */
        _updateMachineWithUnitData: function(machine, units) {
          this._addIconsToUnits(units);
          machine.units = units;
          return units;
        },

        /**
         * Add icon data to units by using the service information.
         *
         * @method _addIconsToUnits
         * @param {Array} units The units to decorate
         */
        _addIconsToUnits: function(units) {
          var db = this.get('db'),
              service;
          Y.Object.each(units, function(unit) {
            service = db.services.getById(unit.service);
            if (service) {
              unit.icon = service.get('icon');
            } else {
              console.error('Unit ' + unit.id + ' has no service.');
            }
          });
          return units;
        },

        /**
           A helper function that handles intelligently updating the lists in
           the machine view columns. When an update comes in, we don't want to
           re-render the entire view, just the items in the list that have
           changed. The logic below handles that and uses the render and
           cleanup callbacks to allow for column-specific logic.

           @method _smartUpdateList
           @param {Array} models The models that are bound to the list
           @param {NodeList} list The DOM list
           @param {Function} renderFn A callback to handle rendering one item
             in the list
           @param {Function} cleanupFn Any other changes that need to occur
             after an update in the list, i.e., clearing the
                                     container column
         */
        _smartUpdateList: function(models, list, render, cleanup) {
          if (!models || !list) {
            return;
          }
          var elements = list.all('li');
          var newElements = this._addNewTokens(models, elements, render);
          newElements.forEach(function(newToken) {
            list.append(newToken);
          });
          this._removeOldTokens(models, elements, cleanup);
        },

        /**
           Creates new tokens for any models not yet found in the DOM.

           @method _addNewTokens
           @param {Array} models The list of machine models
           @param {Y.NodeList} elements The list of tokens in the DOM
           @param {function} renderFn The function to create the rendered token.
         */
        _addNewTokens: function(models, elements, renderFn) {
          var list = [],
              exists,
              newElement;
          models.forEach(function(model) {
            exists = elements.some(function(element) {
              // If the model already exists in the dom, mark it as such.
              if (String(model.id) === element.getAttribute('data-id')) {
                element.setData('exists', true);
                return true;
              }
            });

            if (!exists) {
              // If the model does not exist in the dom, render the token.
              newElement = renderFn(model);
              list.push(newElement);
              newElement.setData('exists', true);
            }
          }, this);
          return list;
        },

        /**
           Removes tokens for items that no longer have a corresponding model.

           @method _removeOldTokens
           @param {Array} models The list of machine models
           @param {Y.NodeList} elements The list of tokens in the DOM
           @param {function} cleanupFn Option cleanup function
         */
        _removeOldTokens: function(models, elements, cleanupFn) {
          elements.each(function(element) {
            if (!element.getData('exists')) {
              // If the element exists in the dom, but not in the model
              // list then it must have been removed from the DB, so remove it
              // from the dom.
              var token = element.one('.token');
              if (token && token.hasClass('active') && cleanupFn) {
                // If the selected model was removed then stop showing
                // its containers.
                if (cleanupFn) {
                  cleanupFn();
                }
              }
              element.remove();
            } else if (models.length === 0) {
              if (cleanupFn) {
                cleanupFn();
              }
              element.remove();
            } else {
              // Clean up the 'exists' flag for the next loop through
              // the nodes.
              element.setData('exists', undefined);
            }
          }, this);
        },

        /**
           Render the undeployed service unit tokens.

           @method _renderUnplacedUnits
         */
        _renderUnplacedUnits: function() {
          var container = this.get('container'),
              units = this.get('db').units.filterByMachine(null),
              unitList = container.one('.unplaced .content .items');

          if (!units || !units.length) {
            this._toggleAllPlacedMessage(true);
          } else {
            this._toggleAllPlacedMessage(false);
            this._addIconsToUnits(units);
          }

          this._smartUpdateList(
              units, unitList,
              this._renderUnplacedUnitToken.bind(this)
          );
        },

        /**
           Render a serviceunit token.

           @method _renderUnplacedUnitToken
           @param {Object} model The model data for the unplaced unit
         */
        _renderUnplacedUnitToken: function(model) {
          var node = Y.Node.create('<li></li>');
          var token = new views.ServiceUnitToken({
            container: node,
            title: model.displayName,
            id: model.id,
            icon: model.icon
          });
          token.render();
          token.addTarget(this);
          return node;
        },

        /**
          Toggle the message for when all units are placed.

          @method _toggleAllPlacedMessage
          @param {Boolean} show Boolean value weather to force the placed
            message to be visible or not (optional).
        */
        _toggleAllPlacedMessage: function(show) {
          if (show !== true && show !== false) {
            show = !this.get('db').units.filterByMachine(null).length;
          }
          this.get('container')
              .one('.column.unplaced .all-placed')
              .toggleView(show);
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
          this.addEvent(this._scaleUpView.on('listOpened',
              this._toggleAllPlacedMessage.bind(this, false)));
          this.addEvent(this._scaleUpView.on('listClosed',
              this._toggleAllPlacedMessage.bind(this, undefined)));
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
          this._renderMachines();
          this._renderUnplacedUnits();
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
          db: {},

          /**
            Reference to the application env

            @attribute env
            @type {Object}
          */
          env: {},

          /**
            The currently selected machine id.

            @attribute selectedMachine
            @type {String}
          */
          selectedMachine: {}
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
