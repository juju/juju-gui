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
  ns.Filter = Y.Base.create('Filter', Y.Widget, [], {
    template: views.Templates.filters,
    initializer: function() {
      this.set('data', new models.Filter());
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
    //'event-tracker',
    'juju-templates',
    'juju-browser-models',
    'juju-view-utils',
    'widget'
  ]
});
