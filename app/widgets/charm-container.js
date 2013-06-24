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

var app; // TODO Figure out how to wire this up correctly.


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
   * @class CharmContainer
   * @extends {Y.Widget}
   */
  ns.CharmContainer = Y.Base.create('CharmContainer', Y.Widget, [
    Y.Event.EventTracker,
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
      contentBox.all('.yui3-charmtoken.last').removeClass('last');
      contentBox.all('.yui3-charmtoken:not(.yui3-charmtoken-hidden)').slice(
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
      var invisible = this.get('contentBox').one('.yui3-charmtoken-hidden'),
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
     * Make an element draggable.
     *
     * @method _makeDraggable
     * @param {Node} element The node which is to be made draggable.
     * @param {Node} dragImage The node which will be displayed during
     *   dragging.
     * @param {String} charmId The ID of the charm being dragged.
     * @return {undefined} Nothing.
     */
    _makeDraggable: function(element, dragImage, charmId) {
      element.setAttribute('draggable', 'true');
      element.on('dragstart',
          this._makeDragStartHandler(dragImage, charmId));
    },

    /**
     * Generate a function that records drag and drop data when a drag starts.
     *
     * @method _makeDragStartHandler
     * @param {Node} dragImage The node to show during the drag.
     * @param {String} charmId The ID of the charm being dragged.
     * @return {undefined} Nothing.
     */
    _makeDragStartHandler: function(dragImage, charmId) {
      return function(evt) {
        evt = evt._event; // We want the real event.
        evt.dataTransfer.effectAllowed = 'copy';
        evt.dataTransfer.setData('charmId', charmId);
        evt.dataTransfer.setDragImage(dragImage._node, 0, 0);
      };
    },

    /**
     * Find the element on which charms will be dropped to deploy them.
     *
     * @method _getDropZone
     * @return {Node} The node which will receive drop events.
     */
    _getDropZone: function() {
      return Y.one('.zoom-plane');
    },

    /**
     * Enable deploying a service by dragging charm tokens into the environment
     * view.
     *
     * @method addCharmTokenDragAndDrop
     * @param {Node} container he node which contains the charm list.
     * @return {undefined}  Nothing; side-effects only.
    */
    addCharmTokenDragAndDrop: function(container) {
      var dropZone = this._getDropZone();
      if (!container || !dropZone) {
        // XXX We must be in a test.  It would be nice not to have to do this.
        return;
      }
      container.all('.yui3-charmtoken').each(function(charmToken) {
        var charmId = charmToken.one('a').getData('charmid');
        this._makeDraggable(charmToken, charmToken, charmId);
        // The token's child elements need to be in on the draggability too.
        charmToken.all('*').each(function(child) {
          this._makeDraggable(child, charmToken, charmId);
        }, this);
      }, this);
      // In addition to the charm tokens being draggable, we need to react to
      // dropping them.
      dropZone.on('drop', function(evt) {
        var charmId = evt._event.dataTransfer.getData('charmId');
        app.modelController.getCharm(charmId).then(function(charm) {
          app.charmPanel.deploy(charm);
        });
      });
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
    'event-tracker',
    'handlebars',
    'juju-templates',
    'juju-view-utils',
    'widget',
    'widget-parent'
  ]
});
