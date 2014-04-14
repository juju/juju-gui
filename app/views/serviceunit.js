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
YUI.add('serviceunit-token', function(Y) {

  var views = Y.namespace('juju.views'),
      Templates = views.Templates;

  /**
   * The view associated with the machine token.
   *
   * @class ServiceUnitToken
   */
  var ServiceUnitToken = Y.Base.create('ServiceUnitToken', Y.View,
      [
        Y.Event.EventTracker
      ], {
        template: Templates['serviceunit-token'],

        events: {
          '.unit .icons .move': {
            click: '_handleStartMove'
          },
          '.unit .machines select': {
            change: '_handleMachineSelection'
          },
          '.unit .actions .move': {
            click: '_handleFinishMove'
          }
        },

        /**
         * Handles clicks on the Move icon.
         *
         * @method _startMoveHandler
         * @param {Y.Event} e EventFacade object.
         */
        _handleStartMove: function(e) {
          e.halt();
          var target = e.target,
              container = this.get('container');
          container.all('.name, .icons').hide();
          container.one('.machines').show();
        },

        /**
         * Handles clicks on the Move action.
         *
         * @method _finishMoveHandler
         * @param {Y.Event} e EventFacade object.
         */
        _handleFinishMove: function(e) {
          e.halt();
          var target = e.target,
              container = this.get('container');
          // XXX Not sure if this is the right approach or if instead we should
          // re-render the view. -kadams
          container.all('.name, .icons').show();
          container.all('.machines, .containers, .actions').hide();
          this.fire('moveToken');
        },

        /**
         * Handles changes to the machine selection
         *
         * @method _machineSelectionHandler
         * @param {Y.Event} e EventFacade object.
         */
        _handleMachineSelection: function(e) {
          e.halt();
          var target = e.target,
              container = this.get('container');
          // ensure valid selection
          if (target.get('value') === 'new') {
            container.one('.containers').hide();
            container.one('.actions').hide();
          } else {
            container.one('.containers').show();
            container.one('.actions').show();
          }
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
          container.addClass('serviceunit-token');
          container.setAttribute('data-id', attrs.id);
          return this;
        },

        ATTRS: {
          /**
           * The container element for the view.
           *
           * @attribute container
           * @type {Object}
           */
          container: {}
        }
      });

  views.ServiceUnitToken = ServiceUnitToken;

}, '0.1.0', {
  requires: [
    'base',
    'juju-templates',
    'handlebars'
  ]
});
