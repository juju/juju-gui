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
   Provides searching functionality for the charm browser.

   @namespace juju
   @module browser
   @submodule views
 */
YUI.add('subapp-browser-searchview', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      models = Y.namespace('juju.models');

  /**
     Search results display view.

     @class BrowserSearchView
     @extends {juju.browser.views.CharmResults}
   */
  ns.BrowserSearchView = Y.Base.create(
      'browser-view-searchview',
      ns.CharmResults, [], {
        template: views.Templates.search,

        /**
           Renders the search results from the the store query.

           @method _renderSearchResults

         */
        _renderSearchResults: function(results) {
          var target = this.get('renderTo'),
              tpl = this.template({
                count: results.best.length + results.remainder.length,
                isFullscreen: this.get('isFullscreen')
              }),
              tplNode = Y.Node.create(tpl),
              results_container = tplNode.one('.search-results');
          var bestContainer = new widgets.browser.CharmContainer(
              Y.merge({
                name: 'Top results',
                cutoff: 10,
                children: results.best.map(function(charm) {
                  return charm.getAttrs();
                })}, {
                additionalChildConfig: {
                  size: 'small',
                  isDraggable: !this.get('isFullscreen')
                }
              }));

          var remainderContainer = new widgets.browser.CharmContainer(
              Y.merge({
                cutoff: 10,
                children: results.remainder.map(function(charm) {
                  return charm.getAttrs();
                })}, {
                additionalChildConfig: {
                  size: 'small',
                  isDraggable: !this.get('isFullscreen')
                }
              }));
          bestContainer.render(results_container.one('.best'));
          remainderContainer.render(results_container.one('.remainder'));
          this.get('container').setHTML(tplNode);
          target.setHTML(this.get('container'));
          // XXX: We shouldn't have to do this; calling .empty before rending
          // should reset where the node's overflow is scrolled to, but it
          // doesn't. Se we scroll the heading into view to ensure the view
          // renders at the top of the content.
          target._node.scrollTop = 0;
          this.hideIndicator(this.get('renderTo'));

          // Set the active charm if available.
          var active = this.get('activeID');
          if (active) {
            this._updateActive(
                this.get('container').one(
                    '.charm-token[data-charmid="' + active + '"]')
            );
          }
          var cache = {
            search: results,
            charms: new models.BrowserCharmList()
          };
          cache.charms.add(results.best);
          cache.charms.add(results.remainder);
          this.fire(this.EV_CACHE_UPDATED, {cache: cache});
        },

        /**
         * Generates a message to the user based on a bad api call.
         * @method apiFailure
         * @param {Object} data the json decoded response text.
         * @param {Object} request the original io_request object for debugging.
         */
        apiFailure: function(data, request) {
          this._apiFailure(data, request, 'Failed to load search results.');
        },

        /**
           Renders the searchview, rendering search results for the view's
           search text.

           @method render
         */
        render: function(cachedResults) {
          this.showIndicator(this.get('renderTo'));
          // This is only rendered once from the subapp and so the filters is
          // the initial set from the application. All subsequent renders go
          // through the subapp so we don't have to keep the filters in sync
          // here.  If caching/reusing comes into play though an event to
          // track the change of the filters ATTR would make sense to re-draw.
          if (cachedResults) {
            this._renderSearchResults(cachedResults);
          } else {
            this.get('store').search(this.get('filters'), {
              'success': function(data) {
                var results = this.get('store').resultsToCharmlist(
                    data.result);
                var best = [],
                    remainder = [];
                results.map(function(charm) {
                  if (charm.get('is_approved')) {
                    best.push(charm);
                  } else {
                    remainder.push(charm);
                  }
                }, this);
                this._renderSearchResults({
                  best: best,
                  remainder: remainder
                });
              },
              'failure': this.apiFailure
            }, this);
          }
        }
      }, {
        ATTRS: {
          /**
             The search data object which is a Filter instance.

             @attribute filters
             @default undefined
             @type {Filter}
           */
          filters: {}
        }
      });

}, '0.1.0', {
  requires: [
    'base-build',
    'browser-charm-token',
    'browser-charm-container',
    'browser-filter-widget',
    'event-tracker',
    'juju-browser-models',
    'juju-view-utils',
    'subapp-browser-charmresults'
  ]
});
