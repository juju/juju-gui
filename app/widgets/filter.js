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
    template: views.Templates.filters,

    _updateFilters: function(e) {
      var target = e.currentTarget,
          val = target.get('value'),
          filter_type = target.get('parentNode').get('parentNode').get('id');
      filter_type = filter_type.replace('search-filter-', '');
      var filter_data = this.get('data');
      if (target.get('checked')) {
        filter_data.get(filter_type).push(val);

      } else {
        var data = filter_data.get(filter_type);
        filter_data.set(
            filter_type,
            data.filter(function(item) {
              return item !== val; }));
      }
    },

    initializer: function() {
      this.set('data', new models.Filter());
    },

    bindUI: function() {
      this.addEvent(
        this.get('contentBox').one('form').delegate(
          'click', this._updateFilters, 'input[type="checkbox"]', this)
      );
    },

    renderUI: function() {
      var tplNode = this.template(this.getAttrs());
      this.get('contentBox').setHTML(tplNode);
    }

  }, {
    ATTRS: {
      categories: {
        valueFn: function() {
          return models.FILTER_TYPES;
        }
      },
      data: {},
      providers: {
        valueFn: function() {
          return models.FILTER_PROVIDERS;
        }
      },
      series: {
        valueFn: function() {
          return models.FILTER_SERIES;
        }
       },
      types: {
        valueFn: function() {
          return models.FILTER_TYPES;
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
