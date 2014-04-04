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
         * Sets up the DOM nodes and renders them to the DOM.
         *
         * @method render
         */
        render: function() {
          var container = this.get('container'),
              machines, html;
          // look only at top level machines; the rest are containers
          machines = this.get('machines').filterByParent(null);
          html = this.template({
            machines: machines
          });
          container.setHTML(html);
          container.addClass('machine-view-panel');
          this._renderHeaders();
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
    'view',
    'juju-view-utils',
    'event-tracker',
    'node',
    'handlebars',
    'juju-templates',
    'machine-view-panel-header'
  ]
});
