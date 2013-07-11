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
 * The widget used across Browser view to manage the search box and the
 * controls for selecting which view you're in.
 *
 * @module widgets
 * @submodule browser
 *
 */
YUI.add('viewmode-controls', function(Y) {
  var ns = Y.namespace('juju.widgets');


  /**
   * Search widget present in the Charm browser across both fullscreen and
   * sidebar views.
   *
   * @class ViewmodeControls
   * @extends {Y.Widget}
   * @event EV_TOGGLE_VIEWABLE toggle if the browser is visible.
   * @event EV_FULLSCREEN force fullscreen viewmode.
   * @event EV_SIDEBAR force the sidebar viewmode.
   *
   */
  ns.ViewmodeControls = Y.Base.create('viewmode-controls', Y.Widget, [
    Y.Event.EventTracker
  ], {
    CONTENT_TEMPLATE: null,
    EVT_TOGGLE_VIEWABLE: 'toggle_viewable',
    EVT_FULLSCREEN: 'fullscreen',
    EVT_SIDEBAR: 'sidebar',

    /**
     * Expose to the outside world that we've got a request to go fullscreen.
     *
     * @method _goFullscreen
     * @param {Event} ev the click event from the control.
     * @private
     *
     */
    _goFullscreen: function(ev) {
      ev.halt();
      this._updateActiveNav('fullscreen');
      this.fire(this.EVT_FULLSCREEN);
    },

    /**
     * Expose to the outside world that we've got a request to go sidebar.
     *
     * @method _goSidebar
     * @param {Event} ev the click event from the control.
     * @private
     *
     */
    _goSidebar: function(ev) {
      ev.halt();
      this._updateActiveNav('sidebar');
      this.fire(this.EVT_SIDEBAR);
    },

    /**
     * Expose to the outside world that we've got a request to hide from
     * sight.
     *
     * @method _toggleViewable
     * @param {Event} ev the click event from the control.
     * @private
     *
     */
    _toggleViewable: function(ev) {
      ev.halt();
      this.fire(this.EVT_TOGGLE_VIEWABLE);
    },

    /**
      Update the css on the controls to mark one as 'active'.

      @method _updateActiveNav
      @param {String} viewmode Which is the 'active' control.

     */
    _updateActiveNav: function(viewmode) {
      var container = this.get('boundingBox');

      if (container) {
        var active = container.one('.active');
        if (active) {
          active.removeClass('active');
        }
        var selector = '.' + viewmode;
        var item = container.one(selector);
        if (item) {
          item.addClass('active');
        }
      }
    },

    /**
     * bind the UI events to the DOM making up the widget control.
     *
     * @method bindUI
     *
     */
    bindUI: function() {
      var container = this.get('boundingBox');

      this.addEvent(
          Y.one('#content').delegate(
              'click',
              this._toggleViewable,
              '.bws-icon',
              this
          )
      );
      this.addEvent(
          container.one('.fullscreen').on(
              'click', this._goFullscreen, this)
      );
      this.addEvent(
          container.one('.sidebar').on(
              'click', this._goSidebar, this)
      );

      // If there's not a currently active node, then we need to set an
      // initial active control based on the viewmode.
      if (!container.one('.active')) {
        this._updateActiveNav(this.get('initialViewmode'));
      }
    },

    /**
     * Generic initializer for the widget. Publish events we expose for
     * outside use.
     *
     * @method initializer
     * @param {Object} cfg configuration override object.
     *
     */
    initializer: function(cfg) {
      /*
       * Fires when the "Charm Browser" link is checked. Needs to communicate
       * with the parent view so that it can handle filters and the like. This
       * widget only needs to clear the search input box.
       *
       */
      this.publish(this.EVT_TOGGLE_VIEWABLE);
      this.publish(this.EVT_SIDEBAR);
      this.publish(this.EVT_FULLSCREEN);
    }

  }, {
    ATTRS: {
      /**
       * @attribute boundingBox
       * @default {Node} the .browser-nav ul
       * @type {Node}
       *
       */
      boundingBox: {
        /**
         * @method boundingBox.valueFn
         * @return {Node} The already present browser-nav node.
         *
         */
        valueFn: function() {
          return Y.one('#browser-nav');
        }
      },

      initialViewmode: {
        value: undefined
      }
    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'event',
    'event-tracker',
    'widget'
  ]
});
