'use strict';


YUI.add('browser-charm-container', function(Y) {
  var ns = Y.namespace('juju.widgets.browser');

  ns.CharmContainer = Y.Base.create('CharmContainer', Y.Widget, [
    Y.WidgetParent
  ], {
    _events: [],

    TEMPLATE: Y.namespace('juju.views').Templates['charm-container'],

    _afterInit: function() {
      var cutoff = this.get('cutoff'),
          total = this._items.length,
          extra = total - cutoff;
      this.set('extra', extra);
    },

    _showAll: function() {
      Y.Array.each(this._items, function(item) {
        item.show();
      });
    },


    bindUI: function() {
      var more = this.get('contentBox').one('.more');
      this._events.push(more.on('click', this._showAll, this));
    },

    destructor: function() {
      Y.Array.each(this._events, function(e) {
        e.detach();
      });
    },

    initializer: function(cfg) {
      ns.CharmContainer.superclass.initializer.apply(this, cfg);
      this._events.push(
          this.after('initializedChange', this._afterInit, this));
    },

    renderUI: function() {
      var content = this.TEMPLATE(this.getAttrs()),
          cb = this.get('contentBox');
      cb.setHTML(content);
      this._childrenContainer = cb.one('.charms');
      var cut_items = this._items.slice(this.get('cutoff'), this.get('total'));
      Y.Array.each(cut_items, function(item) {
        item.set('visible', false);
      });
    }
  }, {
    ATTRS: {
      cutoff: {
        value: 3
      },

      defaultChildType: {
        value: ns.CharmSmall
      },

      extra: {},

      name: {
        value: ''
      }
    }
  });

}, '0.1.0', {
  requires: [
    'array',
    'base',
    'browser-charm-small',
    'handlebars',
    'juju-templates',
    'widget',
    'widget-parent'
  ]
});
