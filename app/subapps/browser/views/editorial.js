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
 * Browser Editorial View.
 *
 * @module juju.browser
 * @submodule views
 *
 */
YUI.add('subapp-browser-editorial', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');


  /**
   * Editorial view for landing pages.
    
     @class Editorial
     @extends {juju.browser.views.CharmResults}
     @event EV_CACHE_UPDATED when the cache has been updated this is fired
   */
  ns.EditorialView = Y.Base.create('browser-view-sidebar', ns.CharmResults, [],
      {
        EV_CACHE_UPDATED: 'cache-updated',
        template: views.Templates.editorial,

        // How many of each charm container do we show by default.
        cutoffs: {
          sidebar: {
            featured: 2,
            popular: 2,
            'new': 2
          },
          fullscreen: {
            featured: 6,
            popular: 3,
            'new': 3
          }
        },

        /**
         * Generates a message to the user based on a bad api call.
         * @method apiFailure
         * @param {Object} data the json decoded response text.
         * @param {Object} request the original io_request object for debugging.
         */
        apiFailure: function(data, request) {
          this._apiFailure(data, request, 'Failed to load editorial content.');
        },

        /**
           Renders the editorial, "interesting" data to the view.

           @private
           @method _renderInteresting
           @param {Object} data The interesting data, cached or returned from
           the API.
         */
        _renderInteresting: function(data) {
          this._cache.interesting = data;
          var tpl = this.template(this.getAttrs()),
              tplNode = Y.Node.create(tpl),
              cutoffs;
          // Add featured charms
          var featuredCharms = this.get('store').resultsToCharmlist(
              data.result.featured);
          var featuredContainer = tplNode.one('.featured');
          if (this.get('isFullscreen')) {
            cutoffs = this.cutoffs.fullscreen;
          } else {
            cutoffs = this.cutoffs.sidebar;
          }

          var containerCfg = {
            additionalChildConfig: {
              size: this.get('isFullscreen') ? 'large' : 'small'
            }
          };

          var featuredCharmContainer = new widgets.browser.CharmContainer(
              Y.merge({
                name: 'Featured Charms',
                cutoff: cutoffs.featured,
                children: featuredCharms.map(function(charm) {
                  return charm.getAttrs();
                })},
              containerCfg));
          featuredCharmContainer.render(featuredContainer);

          // Add popular charms
          var popularCharms = this.get('store').resultsToCharmlist(
              data.result.popular);
          var popularContainer = tplNode.one('.popular');
          var popularCharmContainer = new widgets.browser.CharmContainer(
              Y.merge({
                name: 'Popular Charms',
                cutoff: cutoffs.popular,
                children: popularCharms.map(function(charm) {
                  return charm.getAttrs();
                })},
              containerCfg));
          popularCharmContainer.render(popularContainer);

          // Add in the charm tokens for the new as well.
          var newContainer = tplNode.one('.new');
          var newCharms = this.get('store').resultsToCharmlist(
              data.result['new']);
          var newCharmContainer = new widgets.browser.CharmContainer(
              Y.merge({
                name: 'New Charms',
                cutoff: cutoffs['new'],
                children: newCharms.map(function(charm) {
                  return charm.getAttrs();
                })},
              containerCfg));
          newCharmContainer.render(newContainer);

          var container = this.get('container');
          container.append(tplNode);
          this.get('renderTo').setHTML(container);
          this.hideIndicator(this.get('renderTo'));

          this.charmContainers = [
            featuredCharmContainer,
            newCharmContainer,
            popularCharmContainer
          ];

          // Set the active charm if available.
          var active = this.get('activeID');
          if (active) {
            this._updateActive(
                container.one('.charm-token[data-charmid="' + active + '"]')
            );
          }
          // Add the charms to the cache for use in other views.
          // Start with a reset to empty any current cached models.
          this._cache.charms.reset(newCharms);
          this._cache.charms.add(popularCharms);
          this._cache.charms.add(featuredCharms);
          this._cache.interesting = data;
          this.fire(this.EV_CACHE_UPDATED, {cache: this._cache});
        },

        /**
         * Load the editorial content into the container specified.
         *
         * @method render
         * @param {Node} container An optional node to override where it's
         * going.
         *
         */
        render: function() {
          var store = this.get('store');
          this.showIndicator(this.get('renderTo'));

          // By default we grab the editorial content from the api to use for
          // display.
          if (this._cache.interesting) {
            this._renderInteresting(this._cache.interesting);
          } else {
            this.get('store').interesting({
              'success': this._renderInteresting,
              'failure': this.apiFailure
            }, this);
          }
        },

        /**
           Destroy this view and clear from the dom world.

           @method destructor
         */
        destructor: function() {
          if (this.charmContainers) {
            Y.Array.each(this.charmContainers, function(container) {
              container.destroy();
            });
          }
          this._cache.charms.destroy();
        },

        /**
           Initializer

           @method initializer
           @param {cfg} Basic initializer object.
         */
        initializer: function(cfg) {
          this._cache = {
            interesting: null,
            charms: new models.BrowserCharmList()
          };
          if (cfg && cfg.interesting) {
            this._cache.interesting = cfg.interesting;
          }
        }
      }, {
        ATTRS: {}
      });

}, '0.1.0', {
  requires: [
    'browser-charm-container',
    'browser-charm-token',
    'browser-search-widget',
    'juju-charm-store',
    'juju-models',
    'juju-templates',
    'juju-view-utils',
    'subapp-browser-charmresults'
  ]
});
