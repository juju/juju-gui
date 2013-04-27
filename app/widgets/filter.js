'use strict';


/**
 * Provides the filter widget, for selecting filters on search.
 *
 * @namespace juju
 * @module widgets
 * @submodule browser
 */
YUI.add('browser-filter-widget', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models.browser'),
      ns = Y.namespace('juju.widgets.browser');
  /**
   * Filter widget
   *
   * @class
   * @extends {Y.Widget}
   */
  ns.Filter = Y.Base.create('Filter', Y.Widget, [Y.Event.EventTracker], {
    EV_FILTER_CHANGED: 'filter_changed',
    template: views.Templates.filters,

    _changeFilters: function(e) {
      var target = e.currentTarget,
          val = target.get('value'),
          filter_type = target.get('parentNode').get('parentNode').get('id');

      filter_type = filter_type.replace('search-filter-', '');

      if (target.get('checked')) {
        var filters = this.get('filters')
        filters[filter_type].push(val);
        this.fire(this.EV_FILTER_CHANGED, {
          change: {
            field: filter_type,
            value: filters[filter_type]
          }
        });
      } else {
        var filter = this.get('filters')[filter_type]
        filter = filter.filter(function(item) {
            return item !== val;
        });
        this.fire(this.EV_FILTER_CHANGED, {
          change: {
            field: filter_type,
            value: filter
          }
        });
      }
    },

    bindUI: function() {
      var cb = this.get('contentBox');
      this.addEvent(
          cb.one('form').delegate(
              'click', this._changeFilters, 'input[type="checkbox"]', this)
      );
      this.addEvent(
          cb.one('form').on(
              'submit', this._handleSubmit, this)
      );
    },

    renderUI: function() {
      var tplNode = this.template(this.getAttrs());
      this.get('contentBox').setHTML(tplNode);
    }

  }, {
    ATTRS: {
      'categories': {
        getter: function() {
          var filters = this.get('filters');
          var res = [];
          Y.Object.each(models.FILTER_CATEGORIES, function(val, key) {
            res.push({
              name: val,
              value: key,
              checked: filters.category.indexOf(key) !== -1 ? true : false
            });
          });
          return res;
        }
      },
      'filters': {},
      'providers': {
        getter: function() {
          var filters = this.get('filters');
          var res = [];
          Y.Object.each(models.FILTER_PROVIDERS, function(val, key) {
            res.push({
              name: val,
              value: key,
              checked: filters.provider.indexOf(key) !== -1 ? true : false
            });
          });
          return res;
        }
      },
      'series': {
        getter: function() {
          var filters = this.get('filters');
          var res = [];
          Y.Object.each(models.FILTER_SERIES, function(val, key) {
            res.push({
              name: val,
              value: key,
              checked: filters.series.indexOf(key) !== -1 ? true : false
            });
          });
          return res;
        }
      },
      'types': {
        getter: function() {
          var filters = this.get('filters');
          var res = [];
          Y.Object.each(models.FILTER_TYPES, function(val, key) {
            res.push({
              name: val,
              value: key,
              checked: filters.type.indexOf(key) !== -1 ? true : false
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
