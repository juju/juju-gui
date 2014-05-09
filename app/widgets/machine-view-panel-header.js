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
 * Provide the machine view panel header view.
 *
 * @module views
 */

YUI.add('machine-view-panel-header', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      Templates = views.Templates;

  /**
   * The view associated with the machine view panel header.
   *
   * @class MachineViewPanelHeaderView
   */
  var MachineViewPanelHeaderView = Y.Base.create(
      'MachineViewPanelHeaderView',
      Y.View,
      [
        Y.Event.EventTracker
      ], {
        template: Templates['machine-view-panel-header'],

        events: {
          'a': {
            click: 'clickAction'
          }
        },

        /**
         * Fire the action event.
         *
         * @method clickAction
         * @param {Event} ev the click event created.
         */
        clickAction: function(e) {
          e.preventDefault();
          this.fire('actionFired');
        },

        /**
         * Set the header label.
         *
         * @method setLabel
         */
        setLabel: function(label) {
          this.get('container').one('.label').set('text', label);
        },

        /**
         * Change the header to the drop state.
         *
         * @method setDroppable
         */
        setDroppable: function(label) {
          this.get('container').addClass('droppable');
        },

        /**
         * Change the header back from drop state to the default state.
         *
         * @method setNotDroppable
         */
        setNotDroppable: function(label) {
          this.get('container').removeClass('droppable');
        },

        /**
         * Sets up the DOM nodes and renders them to the DOM.
         *
         * @method render
         */
        render: function() {
          var container = this.get('container'),
              attrs = this.getAttrs();
          container.setHTML(this.template(attrs));
          container.addClass('machine-view-panel-header');
          return this;
        }
      });

  MachineViewPanelHeaderView.ATTRS = {
    /**
    @attribute title
    @default undefined
    @type {String}
    */
    title: {},

    /**
    @attribute label
    @default undefined
    @type {String}
    */
    label: {},

    /**
    @attribute action
    @default undefined
    @type {String}
    */
    action: {},

    /**
    @attribute dropLabel
    @default undefined
    @type {String}
    */
    dropLabel: {}
  };

  views.MachineViewPanelHeaderView = MachineViewPanelHeaderView;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'event-tracker',
    'node',
    'handlebars',
    'juju-templates'
  ]
});
