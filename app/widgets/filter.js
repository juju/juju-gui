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
   Provides the filter widget, for selecting filters on search.

   @namespace juju
   @module widgets
   @submodule browser
 */
YUI.add('browser-filter-widget', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models.browser'),
      ns = Y.namespace('juju.widgets.browser');
  /**
     Filter widget

     @class Filter
     @extends {Y.Widget}
     @event EV_FILTER_CHANGED when the filter values have changed will fire
     with a change object stating what field/value is updated.

   */
  ns.Filter = Y.Base.create('Filter', Y.Widget, [Y.Event.EventTracker], {
    EV_FILTER_CHANGED: 'filter_changed',
    template: views.Templates.filters,

    /**
       When the filter inputs have changed, update the filters based on the
       current state and fire an event to let everyone know.

       @method _changeFilters
       @param {Event} e The change event from the inputs in the filter.

     */
    _changeFilters: function(e) {
      var filters = this.get('filters'),
          target = e.currentTarget,
          val = target.get('value');

      var filterType = target.get('parentNode').get('parentNode').get('id');
      filterType = filterType.replace('search-filter-', '');

      var filterValue = this.get(filterType);

      if (target.get('checked')) {
        // In this case we've checked a new filter that needs to be added to
        // the correct property.
        if (!filters[filterType]) {
          filters[filterType] = [];
        }
        filters[filterType].push(val);

        // update our filters data.
        this.fire(this.EV_FILTER_CHANGED, {
          change: {
            field: filterType,
            value: filters[filterType]
          }
        });
      } else {
        // Otherwise we're unchecking a filter and need to remove it from the
        // list and determine if that list is now empty.
        filterValue = filters[filterType].filter(function(item) {
          return item !== val;
        });
        filters[filterType] = filterValue;
        this.fire(this.EV_FILTER_CHANGED, {
          change: {
            field: filterType,
            value: filters[filterType]
          }
        });
      }

    },

    /**
       Widget UI binding.

       @method bindUI

     */
    bindUI: function() {
      var cb = this.get('contentBox');
      this.addEvent(
          cb.delegate(
              'click', this._changeFilters, 'input[type="checkbox"]', this)
      );
    },

    /**
      Widget render method.

      @method renderUI

     */
    renderUI: function() {
      var tplNode = this.template(this.getAttrs());
      this.get('contentBox').setHTML(tplNode);
    }

  }, {
    ATTRS: {
      /**
         @attribute categories
         @default See models.browser.Filter
         @type {Array}

       */
      'categories': {
        /**
           Given the list of filters available, which of ours are set or not
           set.

           @method categories.getter
           @return {Array} list of the categories set.

         */
        getter: function() {
          var filters = this.get('filters');
          var res = [];
          if (!filters || !filters.categories) {
            filters = {categories: []};
          }
          Y.Object.each(models.FILTER_CATEGORIES, function(val, key) {
            res.push({
              name: val,
              value: key,
              checked: filters.categories.indexOf(key) !== -1
            });
          });
          return res;
        }
      },

      /**
         An object of the combined filters for all of the properties we track.

         This is the primary source of data as the other's are basically for
         the template to use to generate the ul's of the various filter
         options.

         @attribute filters
         @default See models.browser.Filter
         @type {Object}

       */
      'filters': {},

      /**
         @attribute providers
         @default See models.browser.Filter
         @type {Array}

       */
      'provider': {
        /**
           Given the list of filters available, which of ours are set or not
           set.

           @method providers.getter
           @return {Array} list of the providers set.

         */
        getter: function() {
          var filters = this.get('filters');
          var res = [];
          if (!filters || !filters.provider) {
            filters = {provider: []};
          }
          Y.Object.each(models.FILTER_PROVIDERS, function(val, key) {
            res.push({
              name: val,
              value: key,
              checked: filters.provider.indexOf(key) !== -1
            });
          });
          return res;
        }
      },

      /**
         @attribute series
         @default See models.browser.Filter
         @type {Array}

       */
      'series': {
        /**
           Given the list of filters available, which of ours are set or not
           set.

           @method series.getter
           @return {Array} list of the series set.

         */
        getter: function() {
          var filters = this.get('filters');
          var res = [];
          if (!filters || !filters.series) {
            filters = {series: []};
          }
          Y.Object.each(models.FILTER_SERIES, function(val, key) {
            res.push({
              name: val,
              value: key,
              checked: filters.series.indexOf(key) !== -1
            });
          });
          return res;
        }
      },

      /**
         @attribute types
         @default See models.browser.Filter
         @type {Array}

       */
      'type': {
        /**
           Given the list of filters available, which of ours are set or not
           set.

           @method types.getter
           @return {Array} list of the types set.

         */
        getter: function() {
          var filters = this.get('filters');
          var res = [];
          if (!filters || !filters.type) {
            filters = {type: []};
          }
          Y.Object.each(models.FILTER_TYPES, function(val, key) {
            res.push({
              name: val,
              value: key,
              checked: filters.type.indexOf(key) !== -1
            });
          });
          return res;
        }
      }
    }
  });

}, '0.1.0', {
  requires: [
    'base-build',
    'event-tracker',
    'juju-templates',
    'juju-browser-models',
    'juju-view-utils',
    'widget'
  ]
});
