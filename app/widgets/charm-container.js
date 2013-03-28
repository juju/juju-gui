'use strict';


/**
 * browser-charm-container provides a container used for categorizing charm
 * small widgets.
 *
 * @namespace juju
 * @module widgets
 * @submodule browser
 */
YUI.add('browser-charm-container', function(Y) {
  var ns = Y.namespace('juju.widgets.browser');

  /**
   * A container for charm small widgets, used to control how many are
   * displayed and provide categorization.
   *
   * @class CharmContainer
   * @extends {Y.Widget}
   */
  ns.CharmContainer = Y.Base.create('CharmContainer', Y.Widget, [
    Y.WidgetParent
  ], {

    TEMPLATE: Y.namespace('juju.views').Templates['charm-container'],

    /**
     * Sets up some attributes that are needed before render, but can only be
     * calculated after initialization completes.
     *
     * @method _afterInit
     */
    _afterInit: function() {
      var cutoff = this.get('cutoff'),
          total = this.size(),
          extra = total - cutoff;
      this.set('extra', extra);
    },

    /**
     * Hides all but the children before the designated cutoff. e.g. if cutoff
     * is three, hides all but the first three items.
     *
     * @method _hideSomeChildren
     */
    _hideSomeChildren: function() {
      var cutItems = this._items.slice(this.get('cutoff'));
      Y.Array.each(cutItems, function(item) {
        item.hide();
      });
      this.set('allVisible', false);
    },

    /**
     * Show all items.
     *
     * @method _showAll
     */
    _showAll: function() {
      Y.Array.each(this._items, function(item) {
        item.show();
      });
      this.set('allVisible', true);
    },

    /**
     * Toggles between the _showAll condition and the _hideSomeChildern
     * condition.
     *
     * @method _toggleExpand
     */
    _toggleExpand: function(e) {
      var visible = this.get('allVisible'),
          expander = e.currentTarget;
      if (visible) {
        this._hideSomeChildren();
        var msg = Y.Lang.sub('See {extra} more', {extra: this.get('extra')});
        expander.set('text', msg);
      } else {
        this._showAll();
        expander.set('text', 'See less');
      }
    },

    /**
     * Sets up events and binds them to listeners.
     *
     * @method bindUI
     */
    bindUI: function() {
      var expander = this.get('contentBox').one('.expand');
      this.get('_events').push(expander.on('click', this._toggleExpand, this));
    },

    /**
     * Destructor
     *
     * @method destructor
     */
    destructor: function() {
      Y.Array.each(this._events, function(e) {
        e.detach();
      });
    },

    /**
     * Initializer
     *
     * @method initializer
     */
    initializer: function(cfg) {
      this.get('_events').push(
          this.after('initializedChange', this._afterInit, this));
    },

    /**
     * Sets up the DOM nodes and renders them to the DOM.
     *
     * @method renderUI
     */
    renderUI: function() {
      var content = this.TEMPLATE(this.getAttrs()),
          cb = this.get('contentBox');
      cb.setHTML(content);
      this._childrenContainer = cb.one('.charms');
      this._hideSomeChildren();
    }
  }, {
    ATTRS: {
      /**
       * @attribute _events
       * @default []
       * @type {Array}
       */
      _events: {
        value: []
      },

      /**
       * @attribute allVisible
       * @default false
       * @type {boolean}
       */
      allVisible: {
        value: false
      },

      /**
       * @attribute cutoff
       * @default 3
       * @type {Integer}
       */
      cutoff: {
        value: 3
      },

      /**
       * @attribute defaultChildType
       * @default Y.juju.widgets.browser.CharmSmall
       * @type {Function}
       */
      defaultChildType: {
        value: ns.CharmSmall
      },

      /**
       * @attribute extra
       * @default undefined
       * @type {Integer}
       */
      extra: {},

      /**
       * @attribute name
       * @default ''
       * @type {String}
       */
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
