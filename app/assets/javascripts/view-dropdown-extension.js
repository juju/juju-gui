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


YUI.add('view-dropdown-extension', function(Y) {

  /**
   * Extension for a Y.View derrived class. Adds the dropdown
   * functionality to the view. You need to call the _addDropdownFunc
   * from the render method of the view to trigger because
   * Y.View's do not offer any render event.
   *
   * @namespace juju
   * @class Dropdown
   */
  function Dropdown() {}

  Dropdown.prototype = {
    /**
     * Toggle the visibility of the dropdown panel.
     *
     * @method _toggleDropdown
     * @param {Event} ev the click event from the control.
     */
    __toggleDropdown: function(ev) {
      ev.preventDefault();
      this.get('container').toggleClass('open');
    },

    /**
     * Hide the dropdown panel.
     *
     * @method close
     */
    __close: function() {
      this.get('container').removeClass('open');
    },

    /**
     * Sets up events and binds them to listeners.
     *
     * @method __bindUI
     * @param {Y.Node} container The views container element.
     */
    __bindUI: function(container) {
      this.addEvent(
          container.one('.menu-link').on(
              'click', this.__toggleDropdown, this));
      this.addEvent(
          container.on(
              'clickoutside', this.__close, this));
    },

    /**
     * Sets up the DOM nodes and renders them to the DOM.
     *
     * @method _addDropdownFunc
     */
    _addDropdownFunc: function() {
      var container = this.get('container');
      if (container) {
        container.addClass('dropdown-menu');
        this.__bindUI(container);
      }
    }
  };

  Y.namespace('juju').Dropdown = Dropdown;

}, '0.1.0', {
  requires: [
    'event-tracker',
    'view'
  ]
});
