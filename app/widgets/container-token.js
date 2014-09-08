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
 * Provide the container token view.
 *
 * @module views
 */

YUI.add('container-token', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      Templates = views.Templates;

  /**
   * The view associated with the container token.
   *
   * @class ContainerToken
   */
  var ContainerToken = Y.Base.create('ContainerToken', Y.View,
      [
        views.MVDropTargetViewExtension
      ], {
        template: Templates['container-token'],
        unitsTemplate: Templates['container-token-units'],

        events: {
        },

        /**
          Initialize events.

          @method initializer
        */
        initializer: function() {
          this._attachDragEvents(); // drop-target-view-extension
        },

        /**
          Show the more menu.

         @method showMoreMenu
         @param {Object} e Click event facade.
        */
        showMoreMenu: function(e) {
          if (this.get('machine').deleted) {
            this._moreMenu.setItemDisabled('Destroy', true);
          }
          if (!this._moreMenu.get('rendered')) {
            this._moreMenu.render(this.get('container').one('.more-menu'));
          }
          this._moreMenu.showMenu(e);
          return this._moreMenu;
        },

        /**
          Show the more menu for a unit.

         @method showUnitMoreMenu
         @param {Object} e Click event facade.
         @param {String} id The id of the unit.
        */
        showUnitMoreMenu: function(e, id) {
          var moreMenu = this._unitMoreMenus[id];
          if (this.get('machine').deleted) {
            moreMenu.setItemDisabled('Destroy', true);
          }
          if (!moreMenu.get('rendered')) {
            moreMenu.render(this.get('container').one(
                '.unit[data-id="' + id + '"] .more-menu'));
          }
          moreMenu.showMenu(e);
          return moreMenu;
        },

        /**
         * Fire the delete event.
         *
         * @method handleDelete
         * @param {Event} ev the click event created.
         */
        handleDelete: function(e) {
          e.preventDefault();
          this.fire('deleteToken');
        },

        /**
         * Fire the delete unit event.
         *
         * @method handleDeleteUnit
         * @param {Event} ev the click event created.
         */
        handleDeleteUnit: function(e) {
          e.preventDefault();
          this.fire('deleteContainerUnit');
        },

        /**
         * Mark the token as uncommitted.
         *
         * @method setUncommitted
         */
        setUncommitted: function() {
          this.set('committed', false);
          this.get('container').one('.token').addClass('uncommitted');
        },

        /**
         * Mark the token as committed.
         *
         * @method setCommitted
         */
        setCommitted: function() {
          this.set('committed', true);
          this.get('container').one('.token').removeClass('uncommitted');
        },

        /**
         * Change the token to the drop state.
         *
         * @method setDroppable
         */
        setDroppable: function() {
          this.get('container').addClass('droppable');
        },

        /**
         * Change the token back from drop state to the default state.
         *
         * @method setNotDroppable
         */
        setNotDroppable: function() {
          this.get('container').removeClass('droppable');
        },

        /**
          Set the token state to deleted.

          @method setDeleted
        */
        setDeleted: function() {
          this.get('container').one('.token').addClass('deleted');
        },

        /**
          Set a unit's state to deleted.

          @method setUnitDeleted
          @param {Object} unit the unit to change state.
        */
        setUnitDeleted: function(unit) {
          var unitNode = this.get('container').one(
              '.unit[data-id="' + unit.id + '"]');
          if (!unit.agent_state) {
            unitNode.remove(true);
          } else {
            unitNode.addClass('deleted');
          }
        },

        /**
         * Render the units.
         *
         * @method renderUnits
         */
        renderUnits: function() {
          var machine = this.get('machine');
          var units = machine.units;
          this.get('container').one('.service-icons').setHTML(
              this.unitsTemplate(machine));
          // Create the more menus for the units.
          if (units.length > 0) {
            Object.keys(units).forEach(function(index) {
              var id = units[index].id;
              if (!this._unitMoreMenus) {
                this._unitMoreMenus = [];
              }
              if (!this._unitMoreMenus[id]) {
                this._unitMoreMenus[id] = new widgets.MoreMenu({
                  items: [
                    {label: 'Destroy',
                      callback: this.handleDeleteUnit.bind(this)}
                  ]
                });
              }
            }, this);
          }
        },

        /**
         * Sets up the DOM nodes and renders them to the DOM.
         *
         * @method render
         */
        render: function() {
          var container = this.get('container'),
              machine = this.get('machine');
          container.setHTML(this.template(machine));
          if (machine.deleted) {
            this.setDeleted();
          }
          // when the token is rerendered the more menus will have been
          // removed from the dom so we need to (re)initialise them here.
          this._destroyMoreMenus();
          this._moreMenu = new widgets.MoreMenu({
            items: [
              {label: 'Destroy', callback: this.handleDelete.bind(this)}
            ]
          });
          this.renderUnits();
          container.addClass('container-token');
          container.one('.token').addClass(
              this.get('committed') ? 'committed' : 'uncommitted');
          // Tells the machine view panel drop handler where the unplaced unit
          // token was dropped.
          var token = container.one('.token');
          token.one('.drop').setData('drop-action', 'container');
          // This must be setAttribute, not setData, as setData does not
          // munipulate the dom, which we need for our namespaced code
          // to read.
          token.setAttribute('data-id', machine.id);
          this.get('containerParent').append(container);
          return this;
        },

        /**
          Removes the view container and all its contents.

          @method destructor
        */
        destructor: function() {
          this._destroyMoreMenus();
        },

        /**
          Destroy the more menu widget.

          @method _destroyMoreMenu
        */
        _destroyMoreMenus: function() {
          if (this._moreMenu) {
            this._moreMenu.destroy();
          }
          if (this._unitMoreMenus) {
            this._unitMoreMenus.forEach(function(moreMenu) {
              moreMenu.destroy();
            });
            // Set this to null so we know it needs to be recreated.
            this._unitMoreMenus = null;
          }
        }
      }, {
        ATTRS: {
          /**
           * @attribute machine
           * @default undefined
           * @type {Object}
          */
          machine: {},

          /**
           * @attribute containerParent
           * @default undefined
           * @type {Object}
          */
          containerParent: {},

          /**
           * @attribute committed
           * @default true
           * @type {Bool}
          */
          committed: {
            value: true
          }
        }
      });

  views.ContainerToken = ContainerToken;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'event-tracker',
    'node',
    'handlebars',
    'juju-templates',
    'more-menu',
    'mv-drop-target-view-extension'
  ]
});
