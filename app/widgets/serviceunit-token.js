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
 * Provides the Unit widget, for handling the deployment of units to machines
 * or containers.
 *
 * @module views
 */
YUI.add('juju-serviceunit-token', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      utils = views.utils,
      Templates = views.Templates;

  /**
   * The view associated with the machine token.
   *
   * @class ServiceUnitToken
   */
  var ServiceUnitToken = Y.Base.create('ServiceUnitToken', Y.View, [
    Y.Event.EventTracker
  ], {
    template: Templates['serviceunit-token'],

    events: {
      '.unplaced-unit .machines select': {
        change: '_handleMachineSelection'
      },
      '.unplaced-unit .containers select': {
        change: '_handleContainerSelection'
      },
      '.unplaced-unit .actions .move': {
        click: '_placeUnitToken'
      },
      '.unplaced-unit .actions .cancel': {
        click: '_handleCancelClick'
      }
    },

    /**
      Initialise the more menu.

     @method _initMoreMenu
    */
    _initMoreMenu: function() {
      this._moreMenu = new widgets.MoreMenu({
        items: [
          {label: 'Deploy to...', callback:
                this._handleMoveIconClick.bind(this)},
          {label: 'Remove', callback:
                this._handleRemoveUnplaced.bind(this)}
        ]
      });
    },

    /**
      Show the more menu.

     @method showMoreMenu
     @param {Object} e Click event facade.
    */
    showMoreMenu: function(e) {
      // If the token has been re-rendered the menu will have been
      // destroyed, so we need to recreate it here.
      if (!this._moreMenu) {
        this._initMoreMenu();
      }
      if (!this._moreMenu.get('rendered')) {
        this._moreMenu.render(this.get('container').one('.more-menu'));
      }
      this._moreMenu.showMenu(e);
      return this._moreMenu;
    },

    /**
     * Handle initial view setup.
     *
     * @method initializer
     */
    initializer: function() {
      this._initMoreMenu();
    },

    /**
     * Handles clicks on the Move icon.
     *
     * @method _handleMoveIconClick
     * @param {Y.Event} e EventFacade object.
     */
    _handleMoveIconClick: function(e) {
      e.preventDefault();
      this._populateMachines();
      utils.setStateClass(this.get('container'), 'select-machine');
    },

    /**
     * Handles clicks on the Remove menu item.
     *
     * @method _handleRemoveUnplaced
     * @param {Y.Event} e EventFacade object
     */
    _handleRemoveUnplaced: function(e) {
      e.preventDefault();
      var unit = this.get('unit');
      this.get('db').removeUnits(unit);
      this.get('env').get('ecs').removeByModelId(unit.id);
      this.remove();
    },

    /**
     * Handles clicks on the Move action.
     *
     * @method _placeUnitToken
     * @param {Y.Event} e EventFacade object.
     */
    _placeUnitToken: function(e) {
      e.preventDefault();
      var machineValue = this._getSelectedMachine();
      var containerValue = this._getSelectedContainer();
      var constraints = {};

      if (machineValue === 'new' || containerValue === 'kvm') {
        constraints = this._getConstraints();
      } else if (!containerValue) {
        // Do nothing, the user has not yet selected a container.
        return;
      }
      this.fire('moveToken', {
        unit: this.get('unit'),
        machine: machineValue,
        container: containerValue,
        constraints: constraints
      });
    },

    /**
      Get the constraints from the form values.

      @method _getConstraints
    */
    _getConstraints: function() {
      var constraintsForm = this.get('container').one('.constraints');
      return {
        'cpu-power': constraintsForm.one('input[name="cpu"]').get('value'),
        mem: constraintsForm.one('input[name="ram"]').get('value'),
        'root-disk': constraintsForm.one('input[name="disk"]').get('value')
      };
    },

    /**
     * Handles clicks on the cancel action.
     *
     * @method _handleCancelClick
     * @param {Y.Event} e EventFacade object.
     */
    _handleCancelClick: function(e) {
      e.preventDefault();
      this.reset();
    },

    /**
     * Handles changes to the machine selection
     *
     * @method _handleMachineSelection
     * @param {Y.Event} e EventFacade object.
     */
    _handleMachineSelection: function(e) {
      e.preventDefault();
      var machineValue = this._getSelectedMachine();

      if (machineValue === 'new') {
        utils.setStateClass(this.get('container'), 'new-machine');
      } else {
        this._populateContainers(machineValue);
        utils.setStateClass(this.get('container'), 'select-container');
      }
    },

    /**
     * Handles changes to the container selection
     *
     * @method _handleContainerSelection
     * @param {Y.Event} e EventFacade object.
     */
    _handleContainerSelection: function(e) {
      e.preventDefault();
      var containerValue = this._getSelectedContainer();

      if (containerValue === 'kvm') {
        utils.setStateClass(this.get('container'), containerValue);
      } else {
        utils.setStateClass(this.get('container'), 'select-container');
      }
    },

    /**
      Get the selected machine.

      @method _getSelectedMachine
    */
    _getSelectedMachine: function(e) {
      return this.get('container').one('.machines select').get('value');
    },

    /**
      Get the selected container.

      @method _getSelectedContainer
    */
    _getSelectedContainer: function(e) {
      return this.get('container').one('.containers select').get('value');
    },

    /**
      Populate the select with the current machines.

      @method _populateMachines
    */
    _populateMachines: function() {
      var machinesSelect = this.get('container').one('.machines select');
      var machines = this.get('db').machines.filterByParent(null);
      var newMachines = '';
      // Remove current machines. Leave the default options.
      machinesSelect.all('option:not(.default)').remove();
      // Sort machines by id.
      machines.sort(function(obj1, obj2) {
        return obj1.id - obj2.id;
      });
      // Add all the machines to the select
      machines.forEach(function(machine) {
        newMachines += this._createMachineOption(machine);
      }, this);
      machinesSelect.append(newMachines);
    },

    /**
      Populate the select with the current containers.

      @method _populateContainers
      @param {String} parentID A machine id
    */
    _populateContainers: function(parentId) {
      var containersSelect = this.get('container').one('.containers select');
      var containers = this.get('db').machines.filterByParent(parentId);
      var newContainers = '';
      // Remove current containers. Leave the default options.
      containersSelect.all('option:not(.default)').remove();
      // Sort containers by id.
      containers.sort(function(obj1, obj2) {
        // Need to reverse the order as the order will be reversed again
        // when the items are prepended, no appended.
        return obj1.id.split('/')[2] - obj2.id.split('/')[2];
      });
      // Add the root container to the top of the list.
      newContainers += this._createMachineOption(
          {displayName: parentId + '/root container', id: 'root-container'});
      // Add all the containers to the select.
      containers.forEach(function(container) {
        newContainers += this._createMachineOption(container);
      }, this);
      containersSelect.insert(newContainers, 2);
    },

    /**
      Create an option for a machine or container.

      @method _createMachineOption
      @param {Object} machine A machine object
    */
    _createMachineOption: function(machine) {
      return '<option value="' + machine.id + '">' +
          machine.displayName + '</option>';
    },

    /**
      Makes the token draggable so it can be dropped on a machine, container,
      or column header.

      @method _makeDraggable
    */
    _makeDraggable: function() {
      var container = this.get('container');
      container.setAttribute('draggable', 'true');
      this.addEvent(container.on('dragstart',
          this._makeDragStartHandler(this.getAttrs()), this));
      this.addEvent(container.on('dragend', this._fireDragEndEvent, this));
    },

    /**
      Fires the unit-token-drag-end event

      @method _fireDragEndEvent
    */
    _fireDragEndEvent: function() {
      this.fire('unit-token-drag-end');
    },

    /**
      Generate a function that generates the drag start handler data when
      the drag starts.

      @method _makeDragStartHandler
      @param {Object} attrs The tokens attributes.
      @return {Function} The drag start handler function.
    */
    _makeDragStartHandler: function(attrs) {
      return function(e) {
        var evt = e._event; // We need the real event not the YUI wrapped one.
        var dataTransfer = evt.dataTransfer;
        dataTransfer.effectAllowed = 'move';
        var dragData = {
          id: attrs.unit.id
        };
        dataTransfer.setData('Text', JSON.stringify(dragData));
        // This event is registered on many nested elements, but we only have
        // to handle the drag start once, so stop now.
        evt.stopPropagation();
        this.fire('unit-token-drag-start');
      };
    },

    /**
      Reset the token to the initial state.

      @method reset
    */
    reset: function() {
      // In lieu of resetting every element, just re-render the HTML.
      this._renderTemplate();
      this._destroyMoreMenu();
    },

    /**
      Render the template and set the appropriate classes.

      @method _renderTemplate
    */
    _renderTemplate: function() {
      var container = this.get('container');
      var unit = this.get('unit');
      container.setHTML(this.template(unit));
      // This must be setAttribute, not setData, as setData does not
      // manipulate the dom, which we need for our namespaced code
      // to read.
      container.one('.unplaced-unit').setAttribute('data-id', unit.id);
      utils.setStateClass(container, 'initial');
    },

    /**
     * Sets up the DOM nodes and renders them to the DOM.
     *
     * @method render
     */
    render: function() {
      this.get('container').addClass('serviceunit-token');
      this._renderTemplate();
      this._makeDraggable();
      return this;
    },

    /**
      Removes the view container and all its contents.

      @method destructor
    */
    destructor: function() {
      this._destroyMoreMenu();
    },

    /**
      Destroy the more menu widget.

      @method _destroyMoreMenu
    */
    _destroyMoreMenu: function() {
      if (this._moreMenu) {
        this._moreMenu.destroy();
        // Null the more menu so we can check if we need to reinitialise it.
        this._moreMenu = null;
      }
    },

    ATTRS: {
      /**
        The Node instance that contains this token.

        @attribute container
        @type {Object}
       */
      container: {},

      /**
        The model wrapped by this token.

        @attribute unit
        @type {Object}
       */
      unit: {},

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
      env: {}
    }
  });

  views.ServiceUnitToken = ServiceUnitToken;

}, '0.1.0', {
  requires: [
    'base',
    'view',
    'event-tracker',
    'more-menu',
    'node',
    'juju-templates',
    'juju-view-utils',
    'handlebars'
  ]
});
