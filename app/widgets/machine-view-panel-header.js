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
 * Provide the machine view panel header view.
 *
 * @module views
 */

YUI.add('machine-view-panel-header', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      Templates = views.Templates;

  /**
   * The view associated with the machine view panel header.
   *
   * @class MachineViewPanelHeaderView
   */
  var MachineViewPanelHeaderView = Y.Base.create(
      'MachineViewPanelHeaderView',
      Y.View,
      [
        Y.Event.EventTracker,
        views.MVDropTargetViewExtension
      ], {
        template: Templates['machine-view-panel-header'],

        labelTemplate: Templates['machine-view-panel-header-label'],

        /**
         * Handle initial view setup.
         *
         * @method initializer
         */
        initializer: function() {
          this.addEvent(this.after(
              'labelsChange', this._afterLabelsChange, this));
          this._moreMenu = new widgets.MoreMenu({
            items: this.get('menuItems')
          });
        },

        /**
          Show the more menu.

         @method showMoreMenu
         @param {Object} e Click event facade.
        */
        showMoreMenu: function(e) {
          if (!this._moreMenu.get('rendered')) {
            this._moreMenu.render(this.get('container').one('.more-menu'));
          }
          this._moreMenu.showMenu(e);
          return this._moreMenu;
        },

        /**
         * Handle label change events
         *
         * @method _afterLabelsChange
         * @param {Event} e the custom event created.
         */
        _afterLabelsChange: function(e) {
          var template;
          var customTemplate = this.get('customTemplate');
          if (customTemplate) {
            template = Templates[customTemplate];
          } else {
            template = this.labelTemplate;
          }
          this.get('container').one('.labels').setHTML(
              template({labels: this.get('labels')}));
        },

        /**
         * Update a particular label's count.
         *
         * @method _updateLabelCount
         * @param {String} label the label to update
         * @param {Integer} delta the amount to change the label count
         */
        updateLabelCount: function(label, delta) {
          var labels = this.get('labels');
          labels.forEach(function(labelItem) {
            if (labelItem.label === label) {
              labelItem.count = labelItem.count + delta;
            }
          });
          // Updating the list of labels will fire the
          // _afterLabelsChange event which will in turn update the DOM.
          this.set('labels', labels);
        },

        /**
         * Change the header to the drop state.
         *
         * @method setDroppable
         */
        setDroppable: function() {
          this.get('container').addClass('droppable');
        },

        /**
         * Change the header back from drop state to the default state.
         *
         * @method setNotDroppable
         */
        setNotDroppable: function() {
          this.get('container').removeClass('droppable');
        },

        /**
         * Sets up the DOM nodes and renders them to the DOM.
         *
         * @method render
         */
        render: function() {
          var container = this.get('container'),
              attrs = this.getAttrs();
          container.setHTML(this.template(attrs));
          container.one('.drop').setData('drop-action', this.get('action'));
          container.addClass('machine-view-panel-header');
          this._attachDragEvents();
          return this;
        },

        /**
          Removes the view container and all its contents.

          @method destructor
        */
        destructor: function() {
          if (this._moreMenu) {
            this._moreMenu.destroy();
          }
        }
      });

  MachineViewPanelHeaderView.ATTRS = {
    /**
    @attribute title
    @default undefined
    @type {String}
    */
    title: {},

    /**
    @attribute label
    @default undefined
    @type {String}
    */
    label: {},

    /**
    @attribute action
    @default undefined
    @type {String}
    */
    action: {},

    /**
    @attribute menuItems
    @default undefined
    @type {String}
    */
    menuItems: {},

    /**
    @attribute dropLabel
    @default undefined
    @type {String}
    */
    dropLabel: {},

    /**
    @attribute customTemplate
    @default undefined
    @type {String}
    */
    customTemplate: {}
  };

  views.MachineViewPanelHeaderView = MachineViewPanelHeaderView;

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
