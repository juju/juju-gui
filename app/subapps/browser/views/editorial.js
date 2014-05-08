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
     Editorial view for landing pages.

     @class Editorial
     @extends {juju.browser.views.CharmResults}
   */
  ns.EditorialView = Y.Base.create('browser-view-sidebar', ns.CharmResults, [],
      {
        template: views.Templates.editorial,

        // How many of each charm container do we show by default.
        cutoffs: {
          sidebar: {
            featured: 3,
            popular: 2,
            'new': 2
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
        _renderInteresting: function(results) {
          var tpl = this.template(this.getAttrs()),
              tplNode = Y.Node.create(tpl),
              cutoffs;
          // Add featured charms
          var featuredCharms = results.featuredCharms;
          var featuredContainer = tplNode.one('.featured');

          cutoffs = this.cutoffs.sidebar;

          var featuredCharmObjects = featuredCharms.map(function(charm) {
                return charm.getAttrs();
              });
          var featuredCount = featuredCharmObjects.length;
          var featuredTokenContainer = new widgets.browser.TokenContainer(
              Y.merge({
                name: 'Featured',
                cutoff: featuredCount,
                children: featuredCharmObjects
              }, {
                additionalChildConfig: {
                  size: 'small',
                  isDraggable: true
                }
              }));
          featuredTokenContainer.render(featuredContainer);

          // Add popular charms
          var popularCharms = results.popularCharms;
          var popularContainer = tplNode.one('.popular');
          var popularTokenContainer = new widgets.browser.TokenContainer(
              Y.merge({
                name: 'Popular',
                cutoff: cutoffs.popular,
                children: popularCharms.map(function(charm) {
                  return charm.getAttrs();
                })}, {
                additionalChildConfig: {
                  size: 'small',
                  isDraggable: true
                }
              }));
          popularTokenContainer.render(popularContainer);

          // Add in the charm tokens for the new as well.
          var newCharms = results.newCharms;
          var newContainer = tplNode.one('.new');
          var newTokenContainer = new widgets.browser.TokenContainer(
              Y.merge({
                name: 'New',
                cutoff: cutoffs['new'],
                children: newCharms.map(function(charm) {
                  return charm.getAttrs();
                })}, {
                additionalChildConfig: {
                  size: 'small',
                  isDraggable: true
                }
              }));
          newTokenContainer.render(newContainer);

          var container = this.get('container');
          container.append(tplNode);
          this.get('renderTo').setHTML(container);
          this.hideIndicator(this.get('renderTo'));

          this.tokenContainers = [
            featuredTokenContainer,
            newTokenContainer,
            popularTokenContainer
          ];

          // Set the active charm if available.
          var active = this.get('activeID');
          if (active) {
            this.updateActive(
                container.one('.token[data-charmid="' + active + '"]')
            );
          }

          // Send updated cache data to the app
          var cache = {
            interesting: results,
            charms: new models.CharmList()
          };
          cache.charms.add(newCharms);
          cache.charms.add(popularCharms);
          cache.charms.add(featuredCharms);
          this.fire(this.EV_CACHE_UPDATED, {cache: cache});

          this.makeStickyHeaders();
        },

        /**
         * Load the editorial content into the container specified. Implements
         * an abstract method in CharmResults.
         *
         * @method _renderResults
         * @param {Node} container An optional node to override where it's
         * going.
         *
         */
        _renderResults: function() {
          var store = this.get('store'),
              cachedResults = this.get('cachedResults');
          this.showIndicator(this.get('renderTo'));

          // By default we grab the editorial content from the api to use for
          // display.
          if (cachedResults) {
            this._renderInteresting(cachedResults);
          } else {
            store.interesting({
              'success': function(data) {
                var results = {
                  featuredCharms: store.transformResults(
                      data.result.featured),
                  newCharms: store.transformResults(
                      data.result['new']),
                  popularCharms: store.transformResults(
                      data.result.popular)
                };
                this._renderInteresting(results);
              },
              'failure': this.apiFailure
            }, this);
          }
        },

        /**
           Destroy this view and clear from the dom world.

           @method destructor
         */
        destructor: function() {
          if (this.tokenContainers) {
            Y.Array.each(this.tokenContainers, function(container) {
              container.destroy();
            });
          }
        }
      }, {
        ATTRS: {
          /**
           * Cached API results.
           *
           * @attribute cachedResults
           * @default {Object}
           * @type {Object}
           */
          cachedResults: {}
        }
      });

}, '0.1.0', {
  requires: [
    'browser-token-container',
    'browser-search-widget',
    'juju-charm-store',
    'juju-models',
    'juju-templates',
    'juju-view-utils',
    'subapp-browser-charmresults'
  ]
});
