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
 * Provide a dropdown menu for use within the main header navigation.
 *
 * @namespace juju
 * @module widgets
 */
YUI.add('dropdown', function(Y) {
  var ns = Y.namespace('juju.widgets');

  /**
   * A dropdown menu that provides additional navigation and content in
   * the header.
   *
   * @class Dropdown
   * @extends {Y.Widget}
   */
  ns.Dropdown = Y.Base.create('Dropdown', Y.Widget, [
    Y.Event.EventTracker,
    Y.WidgetParent
  ], {

    /**
     * Toggle the visibility of the dropdown panel.
     *
     * @method _toggleDropdown
     * @param {Event} ev the click event from the control.
     * @private
     *
     */
    _toggleDropdown: function(ev) {
      ev.halt();
      this.get('node').toggleClass('open');
    },

    /**
     * Hide the dropdown panel.
     *
     * @method _close
     * @private
     *
     */
    _close: function(ev) {
      ev.halt();
      this.get('node').removeClass('open');
    },

    /**
     * Sets up events and binds them to listeners.
     *
     * @method bindUI
     */
    bindUI: function() {
      var container = this.get('node');
      if (container) {
        this.addEvent(
            container.one('.menu-link').on(
                'click', this._toggleDropdown, this)
        );
        this.addEvent(
            container.on(
                'clickoutside', this._close, this)
        );
      }
    },

    /**
     * Sets up the DOM nodes and renders them to the DOM.
     *
     * @method renderUI
     */
    renderUI: function() {
      var container = this.get('node');
      if (container) {
        container.addClass('dropdown-menu');
      }
    }
  }, {
    ATTRS: {

      /**
       * @attribute node
       * @default ''
       * @type {Node} the existing HTML to control.
       */
      node: {
        value: ''
      }
    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'event-tracker',
    'handlebars',
    'juju-templates',
    'widget',
    'widget-parent'
  ]
});
