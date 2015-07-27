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
 * Provide the environment header view.
 *
 * @module views
 */

YUI.add('environment-header', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      Templates = views.Templates;

  /**
   * The view associated with the environment header.
   *
   * @class EnvironmentHeaderView
   */
  var EnvironmentHeaderView = Y.Base.create('EnvironmentHeaderView', Y.View,
      [
        Y.Event.EventTracker
      ], {
        template: Templates['environment-header'],

        events: {
          '.tab a': {
            click: 'clickTab'
          }
        },

        /**
         * Select the visible tab.
         *
         * @method clickTab
         * @param {Event} ev the click event created.
         */
        clickTab: function(e) {
          e.halt();
          this.switchTab(e.currentTarget);
        },

        /**
         * Switch to the selected tab.
         *
         * @method switchTab
         * @param {Node} The corresponding tab anchor.
         */
        switchTab: function(link) {
          var environment = link.getData('view');

          // Highlight the selected tab
          if (environment === 'machineView') {
            this.setSelectedTab('machines');
          } else {
            this.setSelectedTab('services');
          }

          // Fire the change event.
          this.fire('changeEnvironmentView', {environment: environment});
        },

        /**
         * Highlight the selected tab.
         *
         * @method setSelectedTab
         * @param {Node} The corresponding tab.
         */
        setSelectedTab: function(tab) {
          var container = this.get('container');
          var tabNode = container.one('.tab.' + tab);
          var tabs = container.all('.tab');

          // Set the active link.
          tabs.removeClass('active');
          tabNode.addClass('active');
        },

        /**
         * Sets up the DOM nodes and renders them to the DOM.
         *
         * @method render
         */
        render: function() {
          var container = this.get('container');
          container.setHTML(this.template());
          container.addClass('environment-header');
          this.setSelectedTab('services');
          return this;
        }
      });

  views.EnvironmentHeaderView = EnvironmentHeaderView;

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
