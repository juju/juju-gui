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
 * Provide the machine token view.
 *
 * @module views
 */

YUI.add('machine-token', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      Templates = views.Templates;

  /**
   * The view associated with the machine token.
   *
   * @class MachineToken
   */
  var MachineToken = Y.Base.create('MachineToken', Y.View,
      [
        Y.Event.EventTracker,
        views.MVDropTargetViewExtension
      ], {
        template: Templates['machine-token'],

        events: {
          '.delete': {
            click: 'handleDelete'
          },
          '.token': {
            click: 'handleTokenSelect'
          }
        },

        /**
          Initialize events.

          @method initializer
        */
        initializer: function() {
          this._attachDragEvents(); // drop-target-view-extension
        },

        /**
         * Fire the delete event.
         *
         * @method handleDelete
         * @param {Event} ev the click event created.
         */
        handleDelete: function(e) {
          e.preventDefault();
          this.fire('deleteToken');
        },

        /**
         * Fire the click event.
         *
         * @method handleToken
         * @param {Event} ev the click event created.
         */
        handleTokenSelect: function(e) {
          e.preventDefault();
          this.fire('selectToken');
        },

        /**
         * Mark the token as uncommitted.
         *
         * @method setUncommitted
         */
        setUncommitted: function() {
          this.set('committed', false);
          this.get('container').one('.token').addClass('uncommitted');
        },

        /**
         * Mark the token as committed.
         *
         * @method setCommitted
         */
        setCommitted: function() {
          this.set('committed', true);
          this.get('container').one('.token').removeClass('uncommitted');
        },

        /**
         * Change the token to the drop state.
         *
         * @method setDroppable
         */
        setDroppable: function() {
          this.get('container').addClass('droppable');
        },

        /**
         * Change the token back from drop state to the default state.
         *
         * @method setNotDroppable
         */
        setNotDroppable: function() {
          this.get('container').removeClass('droppable');
        },

        /**
         * Format the hardware details.
         *
         * @method _formatHardware
         */
        _formatHardware: function(hardware) {
          hardware.disk = isNaN(hardware.disk) ?
              null : (hardware.disk / 1024).toFixed(1);
          hardware.cpuPower = isNaN(hardware.cpuPower) ?
              null : hardware.cpuPower / 100;
          hardware.mem = isNaN(hardware.mem) ?
              null : (hardware.mem / 1024).toFixed(1);
          return hardware;
        },

        /**
         * Sets up the DOM nodes and renders them to the DOM.
         *
         * @method render
         */
        render: function() {
          var container = this.get('container'),
              machine = this.get('machine'),
              hardware = machine.hardware || {};
          // The clone here is required because we don't want to modify the
          // original object but we want to pass all of the hardware values into
          // the formatter.
          machine.formattedHardware = this._formatHardware(Y.clone(hardware));
          if (!machine.formattedHardware.disk &&
              !machine.formattedHardware.cpuPower &&
              !machine.formattedHardware.mem &&
              !machine.formattedHardware.cpuCores) {
            machine.noHardware = true;
          }
          container.setHTML(this.template(machine));
          container.addClass('machine-token');
          container.one('.token').addClass(
              this.get('committed') ? 'committed' : 'uncommitted');
          // Tells the machine view panel drop handler where the unplaced unit
          // token was dropped.
          var token = container.one('.token');
          // Even though this is a machine we want it to create a container
          // when something is dropped on it.
          token.setData('drop-action', 'container');
          // This must be setAttribute, not setData, as setData does not
          // manipulate the dom, which we need for our namespaced code
          // to read.
          token.setAttribute('data-id', machine.id);
          return this;
        },

        ATTRS: {
          /**
           * @attribute machine
           * @default undefined
           * @type {Object}
          */
          machine: {},

          /**
           * @attribute committed
           * @default true
           * @type {Bool}
          */
          committed: {
            value: true
          }
        }
      });

  views.MachineToken = MachineToken;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'event-tracker',
    'node',
    'handlebars',
    'juju-templates',
    'machine-token-header',
    'mv-drop-target-view-extension'
  ]
});
