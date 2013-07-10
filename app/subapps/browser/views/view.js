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
 * Browser SubApp Sidebar View handler.
 *
 * @module juju.browser
 * @submodule views
 *
 */
YUI.add('subapp-browser-mainview', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');

  /**
   * Base shared view for MainView sidebar and fullscreen.
   *
   * @class MainView
   * @extends {Y.View}
   *
   */
  ns.MainView = Y.Base.create('browser-view-mainview', Y.View, [
    Y.Event.EventTracker
  ], {

    /**
     * When we click the fullscreen toggle UX widget, what url do we route to.
     * We have to dump this into the template because we can't dynamically
     * showView/navigate from here.
     *
     * Views extending this should implement the url path.
     *
     * @attribute _fullscreenTarget
     * @default ''
     * @type {String}
     *
     */
    _fullscreenTarget: '',
    /**
     * Extending classes need to specify the template used to render display.
     *
     * @attribute template
     * @default ''
     * @type {Object}
     *
     */
    template: '',
    /**
     * Is this view currently visible? Tracked for use with the show/hide
     * toggle control in the Search widget.
     *
     * @attribute visible
     * @default true
     * @type {Boolean}
     *
     */
    visible: true,

    /**
     * Bind events watching for search widget changes.
     *
     * @method _bindSearchWidgetEvents
     * @private
     *
     */
    _bindSearchWidgetEvents: function() {
      this.addEvent(
          this.controls.on(
              this.controls.EVT_TOGGLE_VIEWABLE, this._toggleBrowser, this)
      );

      this.addEvent(
          this.controls.on(
              this.controls.EVT_FULLSCREEN, this._goFullscreen, this)
      );
      this.addEvent(
          this.controls.on(
              this.controls.EVT_SIDEBAR, this._goSidebar, this)
      );

      this.addEvent(
          this.search.on(
              this.search.EVT_SEARCH_CHANGED, this._searchChanged, this)
      );
    },

    /**
     * Render out the main search widget and controls shared across various
     * views.
     *
     * @method _renderSearchWidget
     * @param {Node} node the node to render into.
     *
     */
    _renderSearchWidget: function(node) {
      this.search = new widgets.browser.Search({
        autocompleteSource: Y.bind(
            this.get('store').autocomplete,
            this.get('store')
        ),
        filters: this.get('filters')
      });
      this.search.render(node.one('.bws-header'));

      this.controls = new widgets.ViewmodeControls();
      this.controls.render();
    },

    /**
       When search box text has changed navigate away.

       @method _searchChanged
       @param {Event} ev the form submit event.

     */
    _searchChanged: function(ev) {
      var change = {
        search: true,
        filter: {
          text: ev.newVal
        }
      };
      this.fire('viewNavigate', {change: change});
    },

    /**
       Toggle the visibility of the browser. Bound to nav controls in the
       view, however this will be expanded to be controlled from the new
       constant nav menu outside of the view once it's completed.

       @method _toggle_sidebar
       @param {Event} ev event to trigger the toggle.

     */
    _toggleBrowser: function(ev) {
      ev.halt();

      this.fire('viewNavigate', {
        change: {
          viewmode: 'minimized'
        }
      });
    },

    /**
      Upon clicking the browser icon make sure we re-route to the
      new form of the UX.

      @method _goFullscreen
      @param {Event} ev the click event handler on the button.

     */
    _goFullscreen: function(ev) {
      ev.halt();
      this.fire('viewNavigate', {
        change: {
          viewmode: 'fullscreen'
        }
      });
    },

    /**
      Upon clicking the build icon make sure we re-route to the
      new form of the UX.

      @method _goSidebar
      @param {Event} ev the click event handler on the button.

     */
    _goSidebar: function(ev) {
      ev.halt();
      this.fire('viewNavigate', {
        change: {
          viewmode: 'sidebar'
        }
      });
    },

    /**
     * Destroy this view and clear from the dom world.
     *
     * @method destructor
     *
     */
    destructor: function() {
      // Clean up any details view we might have hanging around.
      if (this.details) {
        this.details.destroy(true);
      }
    },

    /**
     * Check if this view is the fullscreen version to help aid us in
     * template work.
     *
     * @method isFullscreen
     * @return {{Bool}}
     *
     */
    isFullscreen: function() {
      if (this.name.indexOf('fullscreen') === -1) {
        return false;
      } else {
        return true;
      }
    }

  }, {
    ATTRS: {
      /**
       * If this view is called from the point of view of a specific charmId
       * it'll be set here.
       *
       * @attribute charmID
       * @default undefined
       * @type {String}
       *
       */
      charmID: {},

      /**
         The list of filters to be used in the rendering of the view.

         This is always handed down from the subapp, but default to something
         sane for tests and just in case.

         @attribute filters
         @default {Object}
         @type {Object}

       */
      filters: {
        value: {
          text: ''
        }
      },

      /**
       * An instance of the Charmworld API object to hit for any data that
       * needs fetching.
       *
       * @attribute store
       * @default undefined
       * @type {Charmworld2}
       *
       */
      store: {},

      /**
       * If this were a route that had a subpath component it's passed into
       * the view to aid in rendering.
       *
       * e.g. /fullscreen/*charmid/hooks to load the hooks tab correctly.
       *
       * @attribute subpath
       * @default undefined
       * @type {String}
       *
       */
      subpath: {}
    }
  });

}, '0.1.0', {
  requires: [
    'browser-charm-token',
    'browser-search-widget',
    'event-tracker',
    'juju-charm-store',
    'juju-models',
    'querystring-stringify',
    'view',
    'viewmode-controls'
  ]
});
