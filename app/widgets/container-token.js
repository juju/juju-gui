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
        Y.Event.EventTracker
      ], {
        template: Templates['container-token'],

        events: {
          '.delete': {
            click: 'handleDelete'
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
         * Mark the token as uncommitted.
         *
         * @method setUncommitted
         */
        setUncommitted: function() {
          this.get('container').one('.token').addClass('uncommitted');
        },

        /**
         * Mark the token as committed.
         *
         * @method setCommitted
         */
        setCommitted: function() {
          this.get('container').one('.token').removeClass('uncommitted');
        },

        /**
          Attaches the dragenter, dragover, drop events on the tokens container
          so that it can have a unit token dropped on it.

          @method _attachDragEvents
        */
        _attachDragEvents: function() {
          var container = this.get('container'),
              token = '.token';
          container.delegate('drop', this._unitDropHandler, token, this);
          container.delegate('dragenter', this._ignore, token, this);
          container.delegate('dragover', this._ignore, token, this);
        },

        /**
          Event handler for the unit dropping on the container token. Fires the
          unit-token-drop event with the unit id and machine information.

          @method _unitDropHandler
          @param {Object} e The drop event object.
        */
        _unitDropHandler: function(e) {
          var dragData = JSON.parse(e._event.dataTransfer.getData('Text'));
          this.fire('unit-token-drop', {
            unit: dragData.id,
            machine: this.get('machine')
          });
        },

        /**
          * Ignore a drag event.
          * @method _ignore
          */
        _ignore: function(e) {
          // This used to be an e.halt() which also stops event propogation but
          // that prevented listening to any drag events above the canvas.
          e.preventDefault();
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
          this._attachDragEvents();
          this.get('containerParent').append(container);
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
           * @attribute containerParent
           * @default undefined
           * @type {Object}
          */
          containerParent: {}
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
    'juju-templates'
  ]
});
