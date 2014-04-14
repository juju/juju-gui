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
        },

        /**
         * Handle initial view setup.
         *
         * @method initializer
         */
        initializer: function() {
          var machines = this.get('machines');
          machines.after('*:change', this.render, this);
          machines.after('add', this.render, this);
          machines.after('remove', this.render, this);
        },

        /**
         * Set the panel to be the full width of the screen.
         *
         * @method setWidthFull
         */
        setWidthFull: function() {
          this.get('container').addClass('full');
        },

        /**
         * Set the panel to leave space for the sidebar.
         *
         * @method removeWidthFull
         */
        removeWidthFull: function() {
          this.get('container').removeClass('full');
        },

        /**
         * Render the header widgets.
         *
         * @method _renderHeaders
         */
        _renderHeaders: function(label) {
          var columns = this.get('container').all('.column'),
              machines = this.get('machines');

          columns.each(function(column) {
            var attrs = {container: column.one('.head')};

            if (column.hasClass('unplaced')) {
              attrs.title = 'Unplaced units';
            }
            else if (column.hasClass('machines')) {
              attrs.title = 'Environment';
              attrs.label = 'machine';
              attrs.action = 'New machine';
              attrs.count = machines.size();
            }
            else if (column.hasClass('containers')) {
              attrs.label = '0 containers, 1 unit';
              attrs.action = 'New container';
            }
            new views.MachineViewPanelHeaderView(attrs).render();
          });
        },

        /**
         * Render the machine token widgets.
         *
         * @method _renderMachineTokens
         */
        _renderMachineTokens: function(label) {
          var container = this.get('container'),
              machineList = container.one('.machines .content ul'),
              machines = this.get('machines').filterByParent(null);

          if (machines.length > 0) {
            Y.Object.each(machines, function(machine) {
              var node = Y.Node.create('<li></li>');
              new views.MachineToken({
                container: node,
                title: machine.displayName,
                id: machine.id,
                hardware: machine.hardware
              }).render();
              machineList.append(node);
            });
          }
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
          this._renderMachineTokens();
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
           * The machines to display in this view.
           *
           * @attribute machines
           * @type {Object}
           */
          machines: {}
        }
      });

  views.MachineViewPanelView = MachineViewPanelView;

}, '0.1.0', {
  requires: [
    'event-tracker',
    'handlebars',
    'juju-serviceunit',
    'juju-templates',
    'juju-view-utils',
    'machine-token',
    'machine-view-panel-header',
    'node',
    'view'
  ]
});
