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
   Provides the more menu widget, a dropdown actions menu.

   @namespace juju
   @module widgets
 */
YUI.add('more-menu', function(Y) {
  var views = Y.namespace('juju.views'),
      ns = Y.namespace('juju.widgets');
  /**
     More menu widget

     @class MoreMenu
     @extends {Y.Widget}
   */
  ns.MoreMenu = Y.Base.create('MoreMenu', Y.Widget, [Y.Event.EventTracker], {
    template: views.Templates['more-menu'],

    /**
      Show the menu.

      @method showMenu
      @param {Object} e Click event facade.
     */
    showMenu: function(e) {
      // Need to halt the event here before it triggers the
      // clickoutside event on the widget, otherwise the menu will
      // open and instantly close, due to the button that opens the
      // menu being outside the menu.
      if (e) {
        e.halt();
      }
      var boundingBox = this.get('boundingBox');
      boundingBox.addClass('open');
      // The following clickoutside event will instantly close the menu
      // due to the button that opens the menu being outside the menu.
      // There needs to be an e.halt() on whatever triggers the opening
      // of this menu. See _unplacedUnitMoreMenuClick in
      // app/widgets/machine-view-panel.js
      this._clickOutsideEvent = boundingBox.on(
          'clickoutside', this.hideMenu, this);
      this._clickItemEvent = boundingBox.all('li').on(
          'click', this._clickItem, this);
    },

    /**
      Hide the menu.

      @method hideMenu
     */
    hideMenu: function() {
      this.get('boundingBox').removeClass('open');
      this._clickOutsideEvent.detach();
      this._clickItemEvent.detach();
    },

    /**
      Handle a click on a menu item.

      @method _clickItem
      @param {Object} e Click event facade.
     */
    _clickItem: function(e) {
      this.hideMenu();
      e.currentTarget.get('className').split(' ').forEach(function(className) {
        if (className.indexOf('moreMenuItem-') === 0) {
          var item = this.get('items')[className.split('-')[1]];
          if (!item.disabled) {
            item.callback(e);
          }
        }
      }, this);
    },

    /**
      Widget render method.

      @method renderUI
     */
    renderUI: function() {
      var attrs = this.getAttrs();
      attrs.items.forEach(function(item) {
        item.id = 'moreMenuItem-' + attrs.items.indexOf(item);
      });
      this.get('contentBox').setHTML(this.template(attrs));
    },

    /**
       Disable an item in the menu.

       @method disableItems
       @param {String} label The label of the item to disable.
     */
    disableItem: function(label) {
      var items = this.get('items'),
          rendered = this.get('rendered'),
          box = this.get('boundingBox');
      items.forEach(function(item) {
        if (item.label === label) {
          item.disabled = true;
        }
        if (rendered) {
          box.one('li.' + item.id).addClass('disabled');
        }
      });
    }
  }, {
    ATTRS: {
      /**
        Items in the menu.

        @attribute items
        @default undefined
        @type {Array}
       */
      items: {}
    }
  });

}, '0.1.0', {
  requires: [
    'base-build',
    'event-outside',
    'event-tracker',
    'juju-templates',
    'juju-view-utils',
    'widget'
  ]
});
