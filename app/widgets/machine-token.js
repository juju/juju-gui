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
        Y.Event.EventTracker
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
         * Format the hardware details.
         *
         * @method _formatHardware
         */
        _formatHardware: function(hardware) {
          hardware.disk = (hardware.disk / 1024).toFixed(1);
          hardware.cpuPower = hardware.cpuPower / 100;
          hardware.mem = (hardware.mem / 1024).toFixed(1);
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
          machine.formattedHardware = this._formatHardware(Y.clone(hardware));
          container.setHTML(this.template(machine));
          container.addClass('machine-token');
          container.setAttribute('data-id', machine.id);
          return this;
        },

        ATTRS: {
          /**
           * @attribute machine
           * @default undefined
           * @type {Object}
          */
          machine: {}
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
    'machine-token-header'
  ]
});
