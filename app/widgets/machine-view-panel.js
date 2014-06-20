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
          var db = this.get('db'),
              env = this.get('env'),
              machines = db.machines.filterByParent(null),
              machineTokens = {},
              units = db.units.filterByMachine(null),
              unitTokens = {};
          // Turn machine models into tokens and store internally.
          machines.forEach(function(machine) {
            var token = new views.MachineToken({
              containerTemplate: '<li/>',
              machine: machine,
              committed: machine.id.indexOf('new') !== 0
            });
            machineTokens[machine.id] = token;
          });
          this.set('machineTokens', machineTokens);
          this.set('containerTokens', {});
          // Turn unit models into tokens and store internally.
          this._addIconsToUnits(units);
          units.forEach(function(unit) {
            var token = new views.ServiceUnitToken({
              unit: unit,
              db: db,
              env: env
            });
            unitTokens[unit.id] = token;
          }, this);
          this.set('unitTokens', unitTokens);
          this._bindEvents();
        },

        /**
         * Bind the events to the models.
         *
         * @method _bindEvents
         */
        _bindEvents: function() {
          var db = this.get('db');

          // Machine change handlers
          this.addEvent(db.machines.after(
              'add', this._onMachineAdd, this));
          this.addEvent(db.machines.after(
              'remove', this._onMachineRemove, this));
          this.addEvent(db.machines.after(
              '*:change', this._onMachineChange, this));

          // Unit change handlers
          this.addEvent(db.units.after(
              'add', this._onUnitAdd, this));
          this.addEvent(db.units.after(
              'remove', this._onUnitRemove, this));
          this.addEvent(db.units.after(
              '*:change', this._onUnitChange, this));

          // Drag-n-drop handlers
          this.on('*:unit-token-drag-start', this._showDraggingUI, this);
          this.on('*:unit-token-drag-end', this._hideDraggingUI, this);
          this.on('*:unit-token-drop', this._unitTokenDropHandler, this);

          this.on('*:moveToken', this._placeServiceUnit, this);
        },

        /**
          Handle changes to the units in the db unit model list.

         @method _onUnitChange
         @param {Object} e Custom model change event facade.
        */
        _onUnitChange: function(e) {
          var unitTokens = this.get('unitTokens'),
              changed = e.changed,
              target = e.target;
          if (changed) {
            // Need to update any machines that now have new units
            if (changed.machine) {
              var machineTokens = this.get('machineTokens'),
                  id = changed.machine.newVal,
                  machineToken = machineTokens[id];
              if (machineToken) {
                this._updateMachineWithUnitData(machineToken.get('machine'));
                machineToken.render();
              }
            }
            if (target.get('machine')) {
              // It's a placed unit; make sure it gets removed from our
              // internal list.
              this._removeUnit(target.get('id'));
            } else {
              unitTokens[target.get('id')].render();
            }
          }
        },

        /**
          Handle units added to the db unit model list.

         @method _onUnitAdd
         @param {Object} e Custom model change event facade.
        */
        _onUnitAdd: function(e) {
          var unit = e.model;
          if (!unit.machine) {
            this._createServiceUnitToken(unit);
          }
        },

        /**
          Handle creating and rendering the token for the unit.

         @method _createServiceUnitToken
         @param {Object} unit The unit to create the token for.
        */
        _createServiceUnitToken: function(unit) {
          var token,
              unitTokens = this.get('unitTokens'),
              node = Y.Node.create('<li></li>');
          this._addIconToUnit(unit);
          token = new views.ServiceUnitToken({
            container: node,
            unit: unit,
            db: this.get('db'),
            env: this.get('env')
          });
          unitTokens[unit.id] = token;
          token.render();
          token.addTarget(this);
          this.get('container').one('.unplaced .items').append(node);
          this._renderAllPlacedMessage(Object.keys(unitTokens));
        },

        /**
          Handle units removed from the db unit model list.

         @method _onUnitRemove
         @param {Object} e Custom model change event facade.
        */
        _onUnitRemove: function(e) {
          var unit = e.model;
          // Ignore placed units
          if (unit.machine) {
            return;
          }
          this._removeUnit(unit.id);
        },

        /**
          Helper method that removes/cleans up a single unit token.

         @method _removeUnit
         @param {Integer} id the ID of the unit token to remove
        */
        _removeUnit: function(id) {
          var unitTokens = this.get('unitTokens'),
              token = unitTokens[id];
          if (token) {
            token.destroy({remove: true});
            delete unitTokens[id];
            this._renderAllPlacedMessage(Object.keys(unitTokens));
          }
        },

        /**
          Handles changes to the machines in the db model list.

         @method _onMachineChange
         @param {Object} e Custom model change event facade.
        */
        _onMachineChange: function(e) {
          var token,
              tokenList,
              changed = e.changed;
          var parentId = e.target.get('parentId');
          if (changed) {
            if (parentId) {
              tokenList = this.get('containerTokens');
            } else {
              tokenList = this.get('machineTokens');
            }
            if (changed.id) {
              var prevId = changed.id.prevVal,
                  newId = changed.id.newVal;
              token = tokenList[prevId];
              tokenList[newId] = token;
              delete tokenList[prevId];
            } else {
              token = tokenList[e.target.id];
            }
            if (!parentId) {
              this._updateMachineWithUnitData(token.get('machine'));
            }
            token.render();
          }
        },

        /**
          Handles machines added to the db model list.

          @method _onMachineAdd
          @param {Object} e Custom model change event facade.
        */
        _onMachineAdd: function(e) {
          var machine = e.model;
          var committed;
          var containerParent = this.get('container').one(
              '.containers .content .items');
          if (machine.parentId) {
            committed = machine.id.split('/').pop().indexOf('new') !== 0;
            this._createContainerToken(containerParent, machine, committed);
          } else {
            committed = machine.id.indexOf('new') !== 0;
            this._createMachineToken(machine, committed);
            this._machinesHeader.updateLabelCount('machine', 1);
          }
        },

        /**
          Handles machines removed from the db model list.

          @method _onMachineRemove
          @param {Object} e Custom model change event facade.
        */
        _onMachineRemove: function(e) {
          var tokenList;
          var machine = e.model;
          if (machine.parentId) {
            tokenList = this.get('containerTokens');
          } else {
            tokenList = this.get('machineTokens');
            // If the active machine is being removed then stop showing
            // its containers.
            if (machine.id === this.get('selectedMachine')) {
              this._clearContainerColumn();
            }
          }
          tokenList[machine.id].destroy({remove: true});
          delete tokenList[machine.id];
          if (!machine.parentId) {
            this._machinesHeader.updateLabelCount('machine', -1);
          }
        },

        /**
          Converts the machine view into the dragging UI.

          @method _showDraggingUI
          @param {Object} e Custom drag start event facade.
        */
        _showDraggingUI: function(e) {
          var machineTokens = this.get('machineTokens');
          var containerTokens = this.get('containerTokens');
          this._machinesHeader.setDroppable();
          // We only show that the container header is droppable if the user
          // has selected a machine as a parent already.
          if (this.get('selectedMachine')) {
            this._containersHeader.setDroppable();
          }
          // Show the drop states for all visible machines and containers.
          Object.keys(machineTokens).forEach(function(id) {
            var token = machineTokens[id];
            token.setDroppable();
          }, this);
          Object.keys(containerTokens).forEach(function(id) {
            var token = containerTokens[id];
            token.setDroppable();
          }, this);
        },

        /**
          Converts the machine view into the normal UI from it's dragging UI.

          @method _hideDraggingUI
          @param {Object} e Custom drag end event facade.
        */
        _hideDraggingUI: function(e) {
          var machineTokens = this.get('machineTokens');
          var containerTokens = this.get('containerTokens');
          this._machinesHeader.setNotDroppable();
          this._containersHeader.setNotDroppable();
          // Hide the drop states for all visible machines and containers.
          Object.keys(machineTokens).forEach(function(id) {
            var token = machineTokens[id];
            token.setNotDroppable();
          }, this);
          Object.keys(containerTokens).forEach(function(id) {
            var token = containerTokens[id];
            token.setNotDroppable();
          }, this);
        },

        /**
          Unit token drop handler. Handles the unit being dropped on anything
          in the machine view.

          @method _unitTokenDropHandler
          @param {Object} evt The custom drop event facade.
        */
        _unitTokenDropHandler: function(evt) {
          var selected = this.get('selectedMachine');
          var dropAction = evt.dropAction;
          var parentId = evt.targetId;
          var containerType = (dropAction === 'container') ? 'lxc' : undefined;
          var db = this.get('db');
          var unit = db.units.getById(evt.unit);

          this._hideDraggingUI();
          if (dropAction === 'container' &&
              (parentId && parentId.indexOf('/') !== -1)) {
            // If the user drops a unit on an already created container then
            // place the unit.
            this._placeUnit(unit, parentId);
          } else if (dropAction === 'container') {
            var machine = this._createMachine(containerType,
                parentId || selected, {});
            this._placeUnit(unit, machine.id);
          } else {
            this._displayCreateMachine(unit);
          }
        },

        /**
          Show the widget to create a machine with constraints.

          @method _displayCreateMachine
          @param {Object} unit The unit to place on the machine.
        */
        _displayCreateMachine: function(unit) {
          if (unit._event) {
            unit = null;
          }
          var createMachine = new views.CreateMachineView({
            container: this.get('container').one('.create-machine'),
            unit: unit
          }).render();
          if (unit) {
            this._removeUnit(unit.id);
          }
          var createHandler, cancelHandler, handler;
          createHandler = createMachine.on('createMachine',
                                           this._handleCreateMachine,
                                           this);
          cancelHandler = createMachine.on('cancelCreateMachine',
                                           this._handleCancelCreateMachine,
                                           this);
          handler = createMachine.after('destroy', function() {
            createHandler.detach();
            cancelHandler.detach();
            handler.detach();
          });
        },

        /**
          Handle creating a machine from a createMachine event.

          @method _handleCreateMachine
          @param {Object} unit The event.
        */
        _handleCreateMachine: function(e) {
          var machine = this._createMachine(undefined, null, e.constraints);
          if (e.unit) {
            this.get('env').placeUnit(e.unit, machine.id);
          }
        },

        /**
          Handle cancelling creating a machine.

          @method _handleCancelCreateMachine
          @param {Object} unit The event.
        */
        _handleCancelCreateMachine: function(e) {
          if (e.unit) {
            this._createServiceUnitToken(e.unit);
          }
        },

        /**
         * Handles placing an unplaced unit.
         *
         * @method _placeServiceUnit
         * @param {Y.Event} e EventFacade object.
         */
        _placeServiceUnit: function(e) {
          var placeId;
          var machine;

          if (e.machine === 'new') {
            machine = this._createMachine(undefined, null, e.constraints);
            placeId = machine.id;
          } else if (e.container === 'new-kvm' || e.container === 'new-lxc') {
            var constraints = {};
            if (e.container === 'new-kvm') {
              constraints = e.constraints;
            }
            machine = this._createMachine(e.container.split('-')[1],
                e.machine, constraints);
            placeId = machine.id;
          } else if (e.container === 'bare-metal') {
            placeId = e.machine;
          } else {
            // Add the unit to the container.
            placeId = e.container;
          }
          // Place the unit onto the existing or newly created
          // machine/container.
          this._placeUnit(e.unit, placeId);
        },

        /**
         * Handles placing unit and updating the UI.
         *
         * @method _placeUnit
         * @param {Object} unit The unit to be placed.
         * @param {String} parentId The machine/container id to place on.
         */
        _placeUnit: function(unit, parentId) {
          this.get('env').placeUnit(unit, parentId);
          this._removeUnit(unit.id);
        },

        /**
          Create a new machine/container.

          @method _createMachine
          @param {String} containerType The container type to create.
          @param {String} parentId The parent for the container.
          @param {Object} constraints The machine/container constraints.
          @return {Object} The newly created ghost machine model instance.
        */
        _createMachine: function(containerType, parentId, constraints) {
          var db = this.get('db');
          var machine = db.machines.addGhost(parentId, containerType);
          // XXX A callback param MUST be provided even if it's just an
          // empty function, the ECS relies on wrapping this function so if
          // it's null it'll just stop executing. This should probably be
          // handled properly on the ECS side. Jeff May 12 2014
          var callback = Y.bind(this._onMachineCreated, this, machine);
          this.get('env').addMachines([{
            containerType: containerType,
            parentId: parentId,
            constraints: constraints || {}
          }], callback, {modelId: machine.id});
          return machine;
        },

        /**
          Callback called when a new machine is created.

          @method _onMachineCreated
          @param {Object} machine The corresponding ghost machine.
          @param {Object} response The juju-core response. The response is an
            object like the following:
            {
              err: 'only defined if a global error occurred'
              machines: [
                {name: '1', err: 'a machine error occurred'},
              ]
            }
        */
        _onMachineCreated: function(machine, response) {
          var db = this.get('db');
          var errorTitle;
          var errorMessage;
          // Ensure the addMachines call executed successfully.
          if (response.err) {
            errorTitle = 'Error creating the new machine';
            errorMessage = response.err;
          } else {
            var machineResponse = response.machines[0];
            if (machineResponse.err) {
              errorTitle = 'Error creating machine ' + machineResponse.name;
              errorMessage = machineResponse.err;
            }
          }
          // Add an error notification if adding a machine failed.
          if (errorTitle) {
            db.notifications.add({
              title: errorTitle,
              message: 'Could not add the requested machine. Server ' +
                  'responded with: ' + errorMessage,
              level: 'error'
            });
          }
          // In both success and failure cases, destroy the ghost machine.
          db.machines.remove(machine);
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
          this.addEvent(this.on(
              '*:createMachine', this._displayCreateMachine, this));
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
          var committed = parentId.indexOf('new') !== 0;

          this._clearContainerColumn();
          this._containersHeader.set('labels', [
            {label: 'container', count: containers.length},
            {label: 'unit', count: numUnits}
          ]);

          // Create the 'bare metal' container. Should be above other
          // containers.
          var units = db.units.filterByMachine(parentId);
          var machine = {
            displayName: 'Bare metal',
            id: parentId + '/bare-metal'
          };
          this._createContainerToken(containerParent, machine,
              committed, units);

          if (containers.length > 0) {
            Y.Object.each(containers, function(container) {
              this._createContainerToken(containerParent, container, committed);
            }, this);
          }
        },

        /**
           Create a container token
           @param {Y.Node} containerParent The parent node for the token's
             container
           @param {Object} container The lxc or kvm container object
           @param {Bool} committed The committed state.
           @param {Array} units Optional list of units on the container.
             If not provided, the container's units will be looked up.
           @method
           _createContainerToken
         */
        _createContainerToken: function(containerParent, container,
            committed, units) {
          var token;
          var containerTokens = this.get('containerTokens');
          if (!units) {
            units = this.get('db').units.filterByMachine(container.id);
          }
          this._updateMachineWithUnitData(container, units);
          if (!containerTokens[container.id]) {
            token = new views.ContainerToken({
              containerTemplate: '<li/>',
              containerParent: containerParent,
              machine: container,
              committed: committed
            });
            containerTokens[container.id] = token;
          } else {
            token = containerTokens[container.id];
          }
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
          this._containersHeader.set('labels', [
            {label: 'container', count: 0},
            {label: 'unit', count: 0}
          ]);
        },

        /**
         * Render the machine token widgets.
         *
         * @method _renderMachines
         */
        _renderMachines: function() {
          var machineTokens = this.get('machineTokens'),
              machineIds = Object.keys(machineTokens),
              nodeContainer = this.get('container').one('.machines .items');

          // Update the header to show the machine count.
          this._machinesHeader.set('labels', [
            {label: 'machine', count: machineIds.length}
          ]);

          // Render each of the machine tokens out to a list
          machineIds.forEach(function(id) {
            var token = machineTokens[id];
            this._updateMachineWithUnitData(token.get('machine'));
            token.render();
            token.addTarget(this);
            nodeContainer.append(token.get('container'));
          }, this);
        },

        /**
         * Create a machine token widget.
         *
         * @method _createMachineToken
           @param {Object} machine The machine model object
           @param {Bool} committed The committed state.
         */
        _createMachineToken: function(machine, committed) {
          var token;
          var machineTokens = this.get('machineTokens');
          token = new views.MachineToken({
            containerTemplate: '<li/>',
            machine: machine,
            committed: committed
          });
          machineTokens[machine.id] = token;
          this._updateMachineWithUnitData(machine);
          token.render();
          token.addTarget(this);
          this.get('container').one('.machines .items').append(
              token.get('container'));
        },

        /**
         * Add units and their icons to the machine.
         *
         * @method _updateMachineWithUnitData
         * @param {Object} machine The machine object.
         * @param {Array} units The units associated with the machine.
         */
        _updateMachineWithUnitData: function(machine, units) {
          if (!units) {
            units = this.get('db').units.filterByMachine(machine.id);
          }
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
          Y.Object.each(units, this._addIconToUnit.bind(this));
          return units;
        },

        /**
         * Add icon data to a single unit by using the service information.
         *
         * @method _addIconToUnit
         * @param {Array} unit The unit to decorate
         */
        _addIconToUnit: function(unit) {
          var service = this.get('db').services.getById(unit.service);
          if (service) {
            unit.icon = service.get('icon');
          } else {
            console.error('Unit ' + unit.id + ' has no service.');
          }
          return unit;
        },

        /**
           Render the undeployed service unit tokens.

           @method _renderUnplacedUnits
         */
        _renderUnplacedUnits: function() {
          var unitTokens = this.get('unitTokens'),
              unitIds = Object.keys(unitTokens),
              nodeContainer = this.get('container').one('.unplaced .items'),
              plural = unitIds.length !== 1 ? 's' : '';

          this._renderAllPlacedMessage(unitIds);

          // Render each of the unit tokens out to a list
          unitIds.forEach(function(id) {
            var token = unitTokens[id],
                node = Y.Node.create('<li></li>');
            token.set('container', node);
            token.render();
            token.addTarget(this);
            nodeContainer.append(node);
          }, this);
        },

        /**
          Conditionally renders the "All placed" message.

          @method _renderAllPlacedMessage
          @param {Array} units A list of the units (or unit IDs) to determine
            if everything's been placed or not.
        */
        _renderAllPlacedMessage: function(units) {
          if (!units || !units.length) {
            this._toggleAllPlacedMessage(true);
          } else {
            this._toggleAllPlacedMessage(false);
          }
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
          var container = this.get('container'),
              machineTokens = this.get('machineTokens'),
              machineIds = Object.keys(machineTokens),
              containerTokens = this.get('containerTokens'),
              containerIds = Object.keys(containerTokens),
              unitTokens = this.get('unitTokens'),
              unitIds = Object.keys(unitTokens);

          container.setHTML('');
          container.removeClass('machine-view-panel');

          if (this._scaleUpView) {
            this._scaleUpView.destroy();
          }

          machineIds.forEach(function(id) {
            machineTokens[id].destroy();
            delete machineTokens[id];
          });

          containerIds.forEach(function(id) {
            containerTokens[id].destroy();
            delete containerTokens[id];
          });

          unitIds.forEach(function(id) {
            unitTokens[id].destroy();
            delete unitTokens[id];
          });
        },

        ATTRS: {
          /**
            The container element for the view.

            @attribute container
            @type {Object}
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
          selectedMachine: {},

          /**
            The key/value store of machine tokens currently displayed in the
            machine column. Allows for fast, efficient updates because we can
            only re-render the information that's changed.

            @attribute machineTokens
            @type {Object}
           */
          machineTokens: {},

          /**
            The key/value store of container tokens that can be displayed in the
            containers column. Allows for fast, efficient updates because we can
            only re-render the information that's changed.

            @attribute containerTokens
            @type {Object}
           */
          containerTokens: {},

          /**
            The key/value store of unit tokens currently displayed in the
            unplaced units column. Allows for fast, efficient updates because we
            can only re-render the information that's changed.

            @attribute unitTokens
            @type {Object}
           */
          unitTokens: {}
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
    'create-machine-view',
    'machine-token',
    'machine-view-panel-header',
    'node',
    'service-scale-up-view',
    'view'
  ]
});
