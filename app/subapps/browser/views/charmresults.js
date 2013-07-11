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
 * Charm Results View.
 *
 * @module juju.browser
 * @submodule views
 *
 */
YUI.add('subapp-browser-charmresults', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');


  /**
     Charm results view.

     The Editorial and the Search results view share some basic info. This
     View is there to provide common handling of events shared in both uses.
     Since this view is incomplete (has no render, template, etc.) it's not
     tested directly, but through the SearchView and the EditorialView which
     verify both rendering and expected event behavior.

     @class CharmReults
     @extends {juju.browser.views.CharmResults}
     @event EV_CACHE_UPDATED when the cache has been updated this is fired
   */
  ns.CharmResults = Y.Base.create('browser-view-charmresults', Y.View, [
    views.utils.apiFailingView,
    widgets.browser.IndicatorManager,
    Y.Event.EventTracker
  ], {
    EV_CACHE_UPDATED: 'cache-updated',
    events: {
      '.charm-token': {
        click: '_handleCharmSelection'
      }
    },

    /**
       Watch for selecting a charm in the results.

       @method _bindEvents

     */
    _bindEvents: function() {
      // Watch for changse to the activeID so that we can mark/unmark active
      // as required.
      this.addEvent(
          this.on('activeIDChange', function(ev) {
            var id = ev.newVal;
            if (id) {
              id = this.get('container').one(
                  '.charm-token[data-charmid="' + id + '"]');
            }
            this._updateActive(id);
          })
      );
    },

    /**
        When selecting a charm from the list make sure we re-route the app to
        the details view with that charm selected.

        @method _handleCharmSelection
        @param {Event} ev the click event handler for the charm selected.

     */
    _handleCharmSelection: function(ev) {
      ev.halt();
      var charm = ev.currentTarget;
      var charmID = charm.getData('charmid');

      // Update the UI for the active one.
      if (!this.get('isFullscreen')) {
        this._updateActive(ev.currentTarget);
      }

      var change = {
        charmID: charmID,
        hash: undefined
      };

      this.fire('viewNavigate', {change: change});
    },

    /**
      Update the node in the editorial list marked as 'active'.

      @method _updateActive
      @param {Node} clickTarget the charm-token clicked on to activate.

    */
    _updateActive: function(clickTarget) {
      // Remove the active class from any nodes that have it.
      Y.all('.yui3-charmtoken.active').removeClass('active');

      // Add it to the current node.
      if (clickTarget) {
        clickTarget.ancestor('.yui3-charmtoken').addClass('active');
      }
    },



    /**
     * General YUI initializer.
     *
     * @method initializer
     * @param {Object} cfg configuration object.
     *
     */
    initializer: function(cfg) {
      // Hold onto charm data so we can pass model instances to other views when
      // charms are selected.
      this._cache = {
        charms: new models.BrowserCharmList()
      };
      this._bindEvents();
    },

    /**
     * Destroy this view and clear from the dom world.
     *
     * @method destructor
     *
     */
    destructor: function() {
      this._cache.charms.destroy();
    }
  }, {
    ATTRS: {
      /**
       * The charm id to start out selected as active.
       *
       * @attribute setActive
       * @default undefined
       * @type {String}
       *
       */
      activeID: {},

      /**
       * Is this rendering of the editorial view for fullscreen or sidebar
       * purposes?
       *
       * @attribute isFullscreen
       * @default false
       * @type {Boolean}
       */
      isFullscreen: {
        value: false
      },

      /**
       * What is the container node we should render our container into?
       *
       * @attribute renderTo
       * @default undefined
       * @type {Node}
       */
      renderTo: {},

      /**
       * The Charmworld2 Api store instance for loading content.
       *
       * @attribute store
       * @default undefined
       * @type {Charmworld2}
       */
      store: {}
    }
  });

}, '0.1.0', {
  requires: [
    'juju-models',
    'browser-overlay-indicator',
    'juju-view-utils',
    'view'
  ]
});
