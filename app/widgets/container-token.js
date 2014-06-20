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
 * Provide the container token view.
 *
 * @module views
 */

YUI.add('container-token', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      Templates = views.Templates;

  /**
   * The view associated with the container token.
   *
   * @class ContainerToken
   */
  var ContainerToken = Y.Base.create('ContainerToken', Y.View,
      [
        views.MVDropTargetViewExtension
      ], {
        template: Templates['container-token'],

        events: {
          '.delete': {
            click: 'handleDelete'
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
         * Sets up the DOM nodes and renders them to the DOM.
         *
         * @method render
         */
        render: function() {
          var container = this.get('container'),
              machine = this.get('machine');
          container.setHTML(this.template(machine));
          container.addClass('container-token');
          container.one('.token').addClass(
              this.get('committed') ? 'committed' : 'uncommitted');
          // Tells the machine view panel drop handler where the unplaced unit
          // token was dropped.
          var token = container.one('.token');
          token.setData('drop-action', 'container');
          // This must be setAttribute, not setData, as setData does not
          // munipulate the dom, which we need for our namespaced code
          // to read.
          token.setAttribute('data-id', machine.id);
          this.get('containerParent').append(container);
          return this;
        }
      }, {
        ATTRS: {
          /**
           * @attribute machine
           * @default undefined
           * @type {Object}
          */
          machine: {},

          /**
           * @attribute containerParent
           * @default undefined
           * @type {Object}
          */
          containerParent: {},

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

  views.ContainerToken = ContainerToken;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'event-tracker',
    'node',
    'handlebars',
    'juju-templates',
    'mv-drop-target-view-extension'
  ]
});
