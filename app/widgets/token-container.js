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
   * A container for charm tokens, used to control how many are
   * displayed and provide categorization.
   *
   * @class TokenContainer
   * @extends {Y.Widget}
   */
  ns.TokenContainer = Y.Base.create('TokenContainer', Y.Widget, [
    Y.Event.EventTracker,
    Y.WidgetParent
  ], {

    TEMPLATE: Y.namespace('juju.views').Templates['token-container'],

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
      this._selectLast();
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
      this._selectLast();
    },

    /**
     * Add class to the last visible node.
     *
     * @method _selectLast
     */
    _selectLast: function() {
      var contentBox = this.get('contentBox');
      contentBox.all('.yui3-token.last').removeClass('last');
      contentBox.all('.yui3-token:not(.yui3-token-hidden)').slice(
          -1).addClass('last');
    },

    /**
     * Toggles between the _showAll condition and the _hideSomeChildern
     * condition.
     *
     * @method _toggleExpand
     */
    _toggleExpand: function(e) {
      e.halt();
      var invisible = this.get('contentBox').one('.yui3-token-hidden'),
          expander = e.currentTarget,
          more = expander.one('.more'),
          less = expander.one('.less');
      if (invisible) {
        this._showAll();
        more.addClass('hidden');
        less.removeClass('hidden');
      } else {
        this._hideSomeChildren();
        less.addClass('hidden');
        more.removeClass('hidden');
      }
    },

    /**
     * Sets up events and binds them to listeners.
     *
     * @method bindUI
     */
    bindUI: function() {
      if (this.get('extra') > 0) {
        var expander = this.get('contentBox').one('a.expandToggle');
        this.addEvent(expander.on('click', this._toggleExpand, this));
      }
    },

    /**
     * Initializer
     *
     * @method initializer
     */
    initializer: function(cfg) {
      this.addEvent(
          this.after('initializedChange', this._afterInit, this)
      );

      if (cfg.additionalChildConfig) {
        this.on('addChild', function(ev) {
          ev.child.setAttrs(cfg.additionalChildConfig);
        });
      }
    },

    /**
     * Sets up the DOM nodes and renders them to the DOM.
     *
     * @method renderUI
     */
    renderUI: function() {
      var data = {
        name: this.get('name'),
        hasExtra: this.get('extra') > 0,
        total: this.size()
      };
      var content = this.TEMPLATE(data);
      var cb = this.get('contentBox');
      cb.setHTML(content);
      this._childrenContainer = cb.one('.charms');
      this._hideSomeChildren();
    },

    /**
     * Sets the DOM to the widget's initial state.
     *
     * @method syncUI
     */
    syncUI: function() {
      this._selectLast();
    }
  }, {
    ATTRS: {
      /**
         Any config passed here will be merged with each child's config in
         order to support adjusting the config data.

         @attribute additionalChildConfig
         @default {}
         @type {Object}

       */
      additionalChildConfig: {
        value: {}
      },

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
       * @default Y.juju.widgets.browser.Token
       * @type {Function}
       */
      defaultChildType: {
        value: ns.Token
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
    'browser-token',
    'event-tracker',
    'handlebars',
    'juju-templates',
    'juju-view-utils',
    'widget',
    'widget-parent'
  ]
});
