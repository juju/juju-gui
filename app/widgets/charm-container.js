'use strict';


/**
 * browser-charm-container provides a container used for categorizing charm
 * tokens.
 *
 * @namespace juju
 * @module widgets
 * @submodule browser
 */
YUI.add('browser-charm-container', function(Y) {
  var ns = Y.namespace('juju.widgets.browser');

  /**
    * hasExtra helps conditional rendering of control elements for the charm
    * token.
    */
  Y.Handlebars.registerHelper('hasExtra', function(block) {
    if (this.extra > 0) {
      return block.fn(this);
    }
  });

  /**
   * A container for charm tokens, used to control how many are
   * displayed and provide categorization.
   *
   * @class CharmContainer
   * @extends {Y.Widget}
   */
  ns.CharmContainer = Y.Base.create('CharmContainer', Y.Widget, [
    Y.WidgetParent
  ], {

    TEMPLATE: Y.namespace('juju.views').Templates['charm-container'],
    SEE_MORE: 'See {extra} more {result}',
    SEE_LESS: 'See fewer results',

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
    },

    /**
     * Toggles between the _showAll condition and the _hideSomeChildern
     * condition.
     *
     * @method _toggleExpand
     */
    _toggleExpand: function(e) {
      var invisible = this.get('contentBox').one('.yui3-charmtoken-hidden'),
          expander = e.currentTarget;
      if (invisible) {
        this._showAll();
        expander.set('text', this.SEE_LESS);
      } else {
        this._hideSomeChildren();
        var extra = this.get('extra'),
            result;
        if (extra !== 1) {
          result = 'results';
        } else {
          result = 'result';
        }
        var msg = Y.Lang.sub(
            this.SEE_MORE, {extra: extra, result: result});
        expander.set('text', msg);
      }
    },

    /**
     * Sets up events and binds them to listeners.
     *
     * @method bindUI
     */
    bindUI: function() {
      if (this.get('extra') > 0) {
        var expander = this.get('contentBox').one('.expand');
        this._events.push(expander.on('click', this._toggleExpand, this));
      }
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
      this._events = [];
      this._events.push(
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
       * @attribute cutoff
       * @default 3
       * @type {Integer}
       */
      cutoff: {
        value: 3,
        /**
         * Verify the cutoff is non-negative.
         *
         * @method validator
         * @param {Number} val The cutoff value being validated.
         */
        validator: function(val) {
          return (val >= 0);
        }

      },

      /**
       * @attribute defaultChildType
       * @default Y.juju.widgets.browser.CharmToken
       * @type {Function}
       */
      defaultChildType: {
        value: ns.CharmToken
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
    'base-build',
    'browser-charm-token',
    'handlebars',
    'juju-templates',
    'juju-view-utils',
    'widget',
    'widget-parent'
  ]
});
