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
      utils = Y.namespace('juju.views.utils'),
      Templates = views.Templates;

  var ROOT_CONTAINER_PLACEHOLDER = 'root-container';

  /**
   * The view associated with the machine view panel.
   *
   * @class MachineViewPanelView
   */
  var MachineViewPanelView = Y.Base.create('MachineViewPanelView', Y.View,
      [
        Y.Event.EventTracker,
        widgets.AutodeployExtension
      ], {
        template: Templates['machine-view-panel'],

        events: {
          '.machine-token .token': {
            click: 'handleMachineTokenSelect'
          },
          '.container-token .token': {
            click: 'handleContainerTokenSelect'
          },
          '.machine-token .moreMenuItem-0': {
            click: 'deleteMachine'
          },
          '.container-token .moreMenuItem-0': {
            click: 'deleteMachine'
          },
          '.unplaced-unit .moreMenuItem-0': {
            click: '_cancelUnitPlacement'
          },
          '.column.machines .onboarding .add-machine': {
            click: '_displayCreateMachine'
          },
          '.column.unplaced .auto-place': {
            click: '_autoPlaceUnits'
          },
          '.unplaced-unit .more-menu .open-menu': {
            click: '_unplacedUnitMoreMenuClick'
          },
          '.machine-token .more-menu .open-menu': {
            click: '_tokenMoreMenuClick'
          },
          '.container-token .more-menu .open-menu': {
            click: '_tokenMoreMenuClick'
          },
          '.head .more-menu .open-menu': {
            click: '_headerMoreMenuClick'
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
          var tokenConstraintsVisible = this.get('tokenConstraintsVisible');
          // Turn machine models into tokens and store internally.
          machines.forEach(function(machine) {
            var token = new views.MachineToken({
              containerTemplate: '<li/>',
              machine: machine,
              committed: machine.id.indexOf('new') !== 0,
              constraintsVisible: tokenConstraintsVisible
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

          // Service change handlers
          this.addEvent(db.services.after(
              ['add', 'remove'], this._toggleScaleUp, this));

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

          // When the environment name becomes available, display it.
          this.get('env').after('environmentNameChange',
              this._displayEnvironmentName, this);
        },


        /**
          Hide the currently visible more menu.

         @method _hideVisibleMoreMenu
         @param {Object} e Click event facade.
        */
        _hideVisibleMoreMenu: function(e) {
          // Need to manually close the currently open more menu as
          // clicks on the "open menu" button have e.halt() to prevent
          // the clickoutside from triggering (so the menu would open
          // and then instantly close). Only close it if it exists in the DOM.
          if (this._visibleMoreMenu && this._visibleMoreMenu.get(
              'boundingBox')._node) {
            this._visibleMoreMenu.hideMenu();
          }
        },


        /**
          Render the more menu for unplaced units.

         @method _unplacedUnitMoreMenuClick
         @param {Object} e Click event facade.
        */
        _unplacedUnitMoreMenuClick: function(e) {
          var id = e.currentTarget.ancestor('.unplaced-unit').getData('id');
          this._hideVisibleMoreMenu();
          this._visibleMoreMenu = this.get('unitTokens')[id].showMoreMenu(e);
        },


        /**
          Render the more menu for machine tokens.

         @method _tokenMoreMenuClick
         @param {Object} e Click event facade.
        */
        _tokenMoreMenuClick: function(e) {
          var id = e.currentTarget.ancestor('.token').getData('id');
          var machine = this.get('db').machines.getById(id);
          var token = this.get(machine.parentId ?
              'containerTokens' : 'machineTokens')[id];
          this._hideVisibleMoreMenu();
          this._visibleMoreMenu = token.showMoreMenu(e);
        },


        /**
          Render the more menu for the headers.

         @method _headerMoreMenuClick
         @param {Object} e Click event facade.
        */
        _headerMoreMenuClick: function(e) {
          var column = e.currentTarget.ancestor('.column'),
              header;

          if (column.hasClass('machines')) {
            header = this._machinesHeader;
          } else {
            var machineId = this.get('selectedMachine');
            var machine = this.get('db').machines.getById(machineId);
            header = this._containersHeader;
            if (machine && machine.deleted) {
              header.disableHeaderMenuItem('Add container', true);
            } else {
              header.disableHeaderMenuItem('Add container', false);
            }
          }
          this._hideVisibleMoreMenu();
          this._visibleMoreMenu = header.showMoreMenu(e);
        },

        /**
          Display the environment name in the machines header.

         @method _displayEnvironmentName
         @param {Object} e Change event facade.
        */
        _displayEnvironmentName: function(e) {
          this.get('container').one('.column.machines .head .title').setHTML(
              this.get('env').get('environmentName'));
        },

        /**
          Cancel placing units as only one unit should display the
          placement form at a time.

         @method _cancelUnitPlacement
         @param {Object} e Custom model change event facade.
        */
        _cancelUnitPlacement: function(e) {
          var unitTokens = this.get('unitTokens');
          var clickedId = e.currentTarget.ancestor(
              '.unplaced-unit').getData('id');
          Object.keys(unitTokens).forEach(function(id) {
            if (id.toString() !== clickedId) {
              unitTokens[id].reset();
            }
          });
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
            // Need to update any machines and containers that now have
            // new units.
            if (changed.machine) {
              if (changed.machine.newVal) {
                var machineTokens = this.get('machineTokens'),
                    containerTokens = this.get('containerTokens'),
                    id = changed.machine.newVal,
                    machineToken = machineTokens[id],
                    containerToken = containerTokens[id];
                if (containerToken) {
                  var container = containerToken.get('machine');
                  this._updateMachineWithUnitData(container);
                  containerToken.renderUnits();
                  // Get the parent machine token to update as well.
                  machineToken = machineTokens[container.parentId];
                }
                // Update the machine/parent token. This is always updated
                // as the unit is either added to the root container or a
                // child container. Either way we need to display the unit
                // on the parent.
                this._updateMachineWithUnitData(machineToken.get('machine'));
                machineToken.renderUnits();
              } else {
                // This is a (now unplaced) uncommitted unit from a destroyed
                // machine. Add it to the unittokens.
                var unit = this.get('db').units.getById(target.get('id'));
                this._createServiceUnitToken(unit);
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
          Determines if the machine or container id that's been passed in is
          for an uncommitted model.

          @method _isMachineCommitted
          @param {String} id The id of the model.
          @return {Boolean} If the model is uncommitted.
        */
        _isMachineCommitted: function(id) {
          return String(id).indexOf('new');
        },

        /**
          Handles changes to the machines in the db model list.

         @method _onMachineChange
         @param {Object} e Custom model change event facade.
        */
        _onMachineChange: function(e) {
          var token,
              tokenList,
              changed = e.changed,
              prevId,
              newId,
              key;
          var parentId = e.target.get('parentId');
          if (changed) {
            if (parentId) {
              tokenList = this.get('containerTokens');
            } else {
              tokenList = this.get('machineTokens');
            }
            if (changed.id) {
              prevId = changed.id.prevVal;
              newId = changed.id.newVal;
              token = tokenList[prevId];
              tokenList[newId] = token;
              delete tokenList[prevId];
            } else {
              // The machine can be a model or a POJO depending on what
              // triggered the change.
              key = e.target.id || e.target.get('id');
              token = tokenList[key];
            }
            var machine = token.get('machine'),
                machineId = machine.id;
            if (!parentId) {
              this._updateMachineWithUnitData(machine);
            }
            token.set('committed', this._isMachineCommitted(machineId));
            token.render();
            var selectedMachine = this.get('selectedMachine');
            if ((selectedMachine === machineId) ||
                (selectedMachine === prevId) ||
                (selectedMachine === key)) {
              // If the selected machine is the machine id then we also want to
              // update the container lists committed status. If the machines
              // id changes we still want to select the same machine token
              // so it compares against the prevVal as well.
              this._selectMachineToken(
                  tokenList[machineId].get('container').one('.token'));
            }
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
          var selectedMachine = this.get('selectedMachine');
          var parentId = machine.parentId;
          if (parentId) {
            committed = machine.id.split('/').pop().indexOf('new') !== 0;
            // All containers added here will be real containers, so
            // show the delete action.
            machine.displayDelete = true;
            this._createContainerToken(containerParent, machine, committed);
            if (parentId === selectedMachine) {
              this._containersHeader.updateLabelCount('container', 1);
            }
          } else {
            committed = machine.id.indexOf('new') !== 0;
            this._createMachineToken(machine, committed);
            this._machinesHeader.updateLabelCount('machine', 1);
          }
          if (!selectedMachine) {
            this._selectFirstMachine();
          }
          this._toggleOnboarding();
        },

        /**
          Handles machines removed from the db model list.

          @method _onMachineRemove
          @param {Object} e Custom model change event facade.
        */
        _onMachineRemove: function(e) {
          var tokenList;
          var machine = e.model;
          var selectedMachine = this.get('selectedMachine');
          var parentId = machine.parentId;
          if (parentId) {
            tokenList = this.get('containerTokens');
            if (parentId === selectedMachine) {
              this._containersHeader.updateLabelCount('container', -1);
            }
          } else {
            tokenList = this.get('machineTokens');
            // If the active machine is being removed then stop showing
            // its containers.
            if (machine.id === selectedMachine) {
              this._clearContainerColumn();
              this.set('selectedMachine', null);
            }
            this._machinesHeader.updateLabelCount('machine', -1);
          }
          tokenList[machine.id].destroy({remove: true});
          delete tokenList[machine.id];
          this._toggleOnboarding();
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
          // When an unplaced unit is dropped on the container header drop
          // target, we need to pull the parentId from the currently selected
          // machine.
          if (dropAction === 'container' && !parentId) {
            parentId = selected;
          }
          var db = this.get('db');
          var unit = db.units.getById(evt.unit);

          this._hideDraggingUI();
          if (dropAction === 'container' &&
              (parentId && parentId.indexOf('/') !== -1)) {
            // If the user drops a unit on an already created container then
            // place the unit.
            // Before proceeding, rename the machine in the case the top level
            // container has been selected.
            if (parentId === selected + '/' + ROOT_CONTAINER_PLACEHOLDER) {
              parentId = selected;
            }
            this._placeUnit(unit, parentId);
            var token = this._findMachineOrContainerToken(parentId, true);
            this._selectContainerToken(token);
          } else {
            this._displayCreateMachine(unit, dropAction, parentId);
          }
        },

        /**
          Show the widget to create a machine with constraints.

          @method _displayCreateMachine
          @param {Object} unit either the unit or a custom event
        */
        _displayCreateMachine: function(unit, action, parentId) {
          var container = this.get('container'),
              createContainer;
          if (unit._event) {
            action = action || unit.currentTarget.ancestor(
                '.column').hasClass('machines') ? 'machine' : 'container';
            unit = undefined;
          }
          if (action === 'container') {
            parentId = parentId || this.get('selectedMachine');
            // Only begin the create container process if we have a parent ID.
            if (!parentId) {
              return;
            }
            createContainer = container.one('.create-container');
          } else {
            createContainer = container.one('.create-machine');
          }
          var createMachine = new views.CreateMachineView({
            container: createContainer,
            parentId: parentId,
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
          this._hideOnboarding();
        },

        /**
          Handle creating a machine from a createMachine event.

          @method _handleCreateMachine
          @param {Object} unit The event.
        */
        _handleCreateMachine: function(e) {
          var machine = this._createMachine(
              e.containerType, e.parentId, e.constraints);
          if (e.unit) {
            this.get('env').placeUnit(e.unit, machine.id);
          }
          var token;
          if (machine.id.indexOf('/') !== -1) {
            token = this._findMachineOrContainerToken(machine.id, true);
            this._selectContainerToken(token);
          } else {
            token = this._findMachineOrContainerToken(machine.id, false);
            this._selectMachineToken(token);
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
          this._toggleOnboarding();
        },

        /**
         * Handles placing an unplaced unit.
         *
         * @method _placeServiceUnit
         * @param {Y.Event} e EventFacade object.
         */
        _placeServiceUnit: function(e) {
          var machineInput = e.machine,
              containerInput = e.container,
              placeId, machine;

          if (machineInput === 'new') {
            machine = this._createMachine(undefined, null, e.constraints);
            placeId = machine.id;
          } else if (containerInput === 'kvm' || containerInput === 'lxc') {
            var constraints = {};
            if (containerInput === 'kvm') {
              constraints = e.constraints;
            }
            machine = this._createMachine(
                containerInput, machineInput, constraints);
            placeId = machine.id;
          } else if (containerInput === ROOT_CONTAINER_PLACEHOLDER) {
            placeId = machineInput;
          } else {
            // Add the unit to the container.
            placeId = containerInput;
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
          var env = this.get('env');
          var err = env.placeUnit(unit, parentId);
          if (err) {
            this.get('db').notifications.add({
              title: 'Unable to place the unit on the specified location',
              message: err,
              level: 'error'
            });
            return;
          }
          this._removeUnit(unit.id);
        },

        /**
         * Handle the click event to show containers for the selected machine.
         *
         * @method handleMachineTokenSelect
         * @param {Event} ev the click event created.
         */
        handleMachineTokenSelect: function(e) {
          e.preventDefault();
          this._selectMachineToken(e.currentTarget);
        },

        /**
         * Display containers for the selected machine.
         *
         * @method _selectMachineToken
         * @param {Object} selected the node for the token that was selected.
         */
        _selectMachineToken: function(selected) {
          var container = this.get('container'),
              machineTokens = container.all('.column.machines .items .token'),
              parentId = selected.getData('id');
          var containers = this.get('db').machines.filterByParent(parentId);
          // A lot of things in the machine view rely on knowing when the user
          // selects a machine.
          this.set('selectedMachine', parentId);
          // Select the active token.
          machineTokens.removeClass('active');
          selected.addClass('active');
          this._renderContainerTokens(containers, parentId);
          this._selectRootContainer(parentId);
        },

        /**
         * Handle the click event to show the active container.
         *
         * @method handleContainerTokenSelect
         * @param {Event} ev the click event created.
         */
        handleContainerTokenSelect: function(e) {
          e.preventDefault();
          this._selectContainerToken(e.currentTarget);
        },

        /**
         * Set the active container.
         *
         * @method _selectContainerToken
         * @param {Object} selected the node for the token that was selected.
         */
        _selectContainerToken: function(selected) {
          var container = this.get('container');
          var containerTokens = container.all(
              '.containers .content .items .token');
          // Select the active token.
          containerTokens.removeClass('active');
          selected.addClass('active');
        },

        /**
         * Queue up deleting the machine from the environment.
         *
         * @method deleteMachine
         * @param {Object} e The event
         */
        deleteMachine: function(e) {
          var machineName = e.currentTarget.ancestor('.token').getData('id');
          var db = this.get('db');
          var machine = db.machines.getById(machineName);
          var token = this.get(machine.parentId ?
              'containerTokens' : 'machineTokens')[machineName];
          if (!db.machines.getById(machineName).deleted) {
            token.setDeleted();
            this.get('env').destroyMachines([machineName], false,
                function(data) {
                  if (data.err) {
                    db.notifications.add({
                      title: 'Error destroying machine or container',
                      message: data.err,
                      level: 'error'
                    });
                  }
                }.bind(this), {modelId: machineName});
          }
          this.removeUncommittedUnitsFromMachine(machine);
        },

        /**
           Removes uncommitted units from a machine when it is being destroyed
           and returns them to the unplaced service units column.

           @method removeUncommittedUnitsFromMachine
           @param {Object} machine The machine being deleted.
         */
        removeUncommittedUnitsFromMachine: function(machine) {
          if (machine.parentId) {
            // Remove the removed units from the parent machines unit list.
            var machineTokens = this.get('machineTokens');
            var parentMachineToken = machineTokens[machine.parentId];
            parentMachineToken.renderUnits();
          }

          this._renderUnplacedUnits();
          this._toggleOnboarding();
        },

        /**
         * Render the header widgets.
         *
         * @method _renderHeaders
         */
        _renderHeaders: function() {
          this._machinesHeader = this._renderHeader(
              '.column.machines .head', {
                title: this.get('env').get('environmentName'),
                action: 'machine',
                dropLabel: 'Create new machine',
                customTemplate: 'machine-view-panel-header-label-alt',
                menuItems: [
                  {label: 'Add machine',
                    callback: this._displayCreateMachine.bind(this)},
                  {label: 'Hide constraints',
                    callback: this._toggleTokenConstraints.bind(this)}
                ]
              });
          this._machinesHeader.addTarget(this);
          this._containersHeader = this._renderHeader(
              '.column.containers .head', {
                action: 'container',
                dropLabel: 'Create new container',
                menuItems: [
                  {label: 'Add container',
                    callback: this._displayCreateMachine.bind(this)}
                ]
              });
          this._containersHeader.addTarget(this);
        },

        /**
          Toggle the visibility of the constraints on machine tokens.

         @method _toggleTokenConstraints
         @param {Object} e Click event facade.
        */
        _toggleTokenConstraints: function(e) {
          var makeVisible = !this.get('tokenConstraintsVisible');
          var machineTokens = this.get('machineTokens');
          var label;
          var machineToken;
          this.set('tokenConstraintsVisible', makeVisible);
          Object.keys(machineTokens).forEach(function(token) {
            machineToken = machineTokens[token];
            if (makeVisible) {
              machineToken.showConstraints();
              label = 'Hide constraints';
            } else {
              machineToken.hideConstraints();
              label = 'Show constraints';
            }
          });
          this._machinesHeader.get('container').one('.moreMenuItem-1').set(
              'text', label);
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
          Toggle the onboarding to the appropriate message given the
          number of machines present.

          @method _toggleOnboarding
        */
        _toggleOnboarding: function() {
          // ensure everything is hidden first
          this._hideOnboarding();
          var machines = this.get('container').one('.column.machines'),
              machineCount = this.get('db').machines.size();
          if (machineCount === 0) {
            machines.one('.onboarding.zero').removeClass('hidden');
          } else if (machineCount === 1) {
            machines.one('.onboarding.one').removeClass('hidden');
          }
        },

        /**
          Hide the onboarding messages.

          @method _hideOnboarding
        */
        _hideOnboarding: function() {
          var container = this.get('container'),
              messages = container.all('.column.machines .onboarding');
          messages.addClass('hidden');
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

          // Create the root container. Should be above other
          // containers.
          var units = db.units.filterByMachine(parentId);
          var machine = {
            displayDelete: false,
            displayName: 'Root container',
            id: parentId + '/' + ROOT_CONTAINER_PLACEHOLDER
          };
          this._createContainerToken(containerParent, machine,
              committed, units);

          if (containers.length > 0) {
            Y.Object.each(containers, function(container) {
              container.displayDelete = true;
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
          // Root containers appear not to have a parentId here, so we
          // need to get the parent from the id.
          var parentId = container.parentId || container.id.split('/')[0];
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
          if (parentId !== this.get('selectedMachine')) {
            // We don't want to display the container's token if the
            // parent machine token is not selected. The way the tokens
            // are cached we need to render the token here and then
            // remove it from the DOM.
            token.get('container').remove();
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
              container = this.get('container'),
              nodeContainer = container.one('.column.machines .items');

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
            committed: committed,
            constraintsVisible: this.get('tokenConstraintsVisible')
          });
          machineTokens[machine.id] = token;
          this._updateMachineWithUnitData(machine);
          token.render();
          token.addTarget(this);
          this.get('container').one('.column.machines .items').append(
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
            units = this.get('db').units.filterByMachine(machine.id, true);
          }
          this._addIconsToUnits(units);
          machine.units = units;
          return units;
        },

        /**
           Given a machine name, find the associated token.

           @method _findMachineOrContainerToken
           @param {String} name The machine name.
           @param {bool} isContainer If the machine is a container.
           @return {Object} The DOM node of the machine token.
         */
        _findMachineOrContainerToken: function(name, isContainer) {
          var token;
          if (isContainer) {
            token = this.get('containerTokens')[name];
          } else {
            token = this.get('machineTokens')[name];
          }
          if (token) {
            return token.get('container').one('.token');
          }
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
          var state;
          var unitCount = this.get('db').units.filterByMachine(null).length;
          if (show !== true && show !== false) {
            show = !unitCount;
          }
          state = show ? 'placed' : 'units';
          if (state === 'units' && unitCount === 0) {
            state = 'hidden';
          }
          this._setUnitListState(state);
        },

        /**
          Set the state of the unit list.

          @method _setUnitListState
          @param {String} state The state class to set
        */
        _setUnitListState: function(state) {
          utils.setStateClass(this.get('container').one(
              '.column.unplaced .units'), state);
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
          this._toggleScaleUp();
          this.addEvent(
              this._scaleUpView.on('addUnit', this._scaleUpService, this));
          this.addEvent(this._scaleUpView.on('listOpened',
              this._toggleAllPlacedMessage.bind(this, false)));
          this.addEvent(this._scaleUpView.on('listClosed',
              this._toggleAllPlacedMessage.bind(this, undefined)));
        },

        /**
          Hide or show the scale up UI depending on whether there are
          any services.

          @method _toggleScaleUp
        */
        _toggleScaleUp: function() {
          var scaleUpView = this._scaleUpView;
          if (scaleUpView) {
            if (this.get('db').services.size() === 0) {
              scaleUpView.disableScaleUp();
              this._setUnitListState('add');
            }
            else {
              scaleUpView.enableScaleUp();
            }
          }
        },

        /**
          Handler for addUnit events emitted by the ServiceScaleUpView.

          @method _scaleUpService
          @param {Object} e The addUnit event facade.
        */
        _scaleUpService: function(e) {
          var db = this.get('db');
          utils.addGhostAndEcsUnits(
              db,
              this.get('env'),
              db.services.getById(e.serviceName),
              e.unitCount,
              this._addUnitCallback);
        },

        /**
          Handles showing the successful unit notifications

          @method _addUnitCallback
          @param {Object} e The event facade.
          @param {Object} db Reference to the db.
          @param {Object} ghostUnit The unit which was created in the db.

        */
        _addUnitCallback: function(e, db, ghostUnit) {
          if (e.err) {
            // Add a notification and exit if the API call failed.
            db.notifications.add({
              title: 'Error adding unit ' + ghostUnit.displayName,
              message: 'Could not add the requested unit. Server ' +
                  'responded with: ' + e.err,
              level: 'error'
            });
            return;
          }
          // Notify the unit has been successfully created.
          db.notifications.add({
            title: 'Added unit ' + ghostUnit.displayName,
            message: 'Successfully created the requested unit.',
            level: 'info'
          });
        },

        /**
          Select the first machine.

          @method _selectFirstMachine
        */
        _selectFirstMachine: function() {
          // Get the first token in the dom. The dom order is the one we
          // care about.
          var machineNode = this.get('container').one(
              '.column.machines .items li .token');
          if (machineNode) {
            this._selectMachineToken(machineNode);
          }
        },

        /**
          Select the root container.

          @method _selectRootContainer
          @param {String} machineId The id of the selected machine.
        */
        _selectRootContainer: function(machineId) {
          var rootContainerId = machineId + '/' + ROOT_CONTAINER_PLACEHOLDER;
          var containerTokens = this.get('containerTokens');
          this._selectContainerToken(containerTokens[rootContainerId].get(
              'container').one('.token'));
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
          this._selectFirstMachine();
          this._toggleOnboarding();
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
        }

      }, {
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
            A flag for whether token constraints are visible.

            @attribute tokenConstraintsVisible
            @default true
            @type {Bool}
           */
          tokenConstraintsVisible: {
            value: true
          },

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
    'autodeploy-extension',
    'container-token',
    'create-machine-view',
    'event-tracker',
    'handlebars',
    'juju-serviceunit-token',
    'juju-templates',
    'juju-view-utils',
    'machine-token',
    'machine-view-panel-header',
    'node',
    'service-scale-up-view',
    'view',
    'yui-patches'
  ]
});
