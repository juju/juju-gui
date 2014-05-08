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
 * Provide the machine view panel view.
 *
 * @module views
 */

YUI.add('machine-view-panel', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      Templates = views.Templates;

  /**
   * The view associated with the machine view panel.
   *
   * @class MachineViewPanelView
   */
  var MachineViewPanelView = Y.Base.create('MachineViewPanelView', Y.View,
      [
        Y.Event.EventTracker
      ], {
        template: Templates['machine-view-panel'],

        events: {
          '.machine-token .token': {
            click: 'handleTokenSelect'
          }
        },

        /**
         * Handle initial view setup.
         *
         * @method initializer
         */
        initializer: function() {
          this._bindModelEvents();
        },

        /**
         * Bind the events to the models.
         *
         * @method _bindModelEvents
         */
        _bindModelEvents: function() {
          this.get('db').machines.after(['add', 'remove', '*:change'],
              this._updateMachines, this);
        },

        /**
         * Display containers for the selected machine.
         *
         * @method handleTokenSelect
         * @param {Event} ev the click event created.
         */
        handleTokenSelect: function(e) {
          var container = this.get('container'),
              machineTokens = container.all('.machines .content .items .token'),
              selected = e.currentTarget,
              id = selected.ancestor().getData('id'),
              containers = this.get('db').machines.filterByParent(id);
          e.preventDefault();
          // Select the active token.
          machineTokens.removeClass('active');
          selected.addClass('active');
          // Set the header text.
          this._renderContainerTokens(containers);
        },

        /**
         * Render the header widgets.
         *
         * @method _renderHeaders
         */
        _renderHeaders: function() {
          var columns = this.get('container').all('.column');

          columns.each(function(column) {
            var attrs = {container: column.one('.head')};

            if (column.hasClass('unplaced')) {
              attrs.title = 'Unplaced units';
            }
            else if (column.hasClass('machines')) {
              attrs.title = 'Environment';
              attrs.action = 'New machine';
            }
            else if (column.hasClass('containers')) {
              attrs.action = 'New container';
            }
            new views.MachineViewPanelHeaderView(attrs).render();
          });
        },

        /**
         * Display a list of given containers.
         *
         * @method _renderContainerTokens
         */
        _renderContainerTokens: function(containers) {
          var container = this.get('container');
          var containerParent = container.one('.containers .content .items');
          var plural = containers.length !== 1 ? 's' : '';

          this._clearContainerColumn();
          container.one('.containers .head .label').set('text',
              containers.length + ' container' + plural + ', xx units');

          if (containers.length > 0) {
            Y.Object.each(containers, function(container) {
              new views.ContainerToken({
                containerTemplate: '<li/>',
                containerParent: containerParent,
                machine: container
              }).render();
            });
          }
        },

        /**
         * Clear the container column.
         *
         * @method _clearContainerColumn
         */
        _clearContainerColumn: function(containers) {
          var container = this.get('container');
          var containerParent = container.one('.containers .content .items');
          containerParent.get('childNodes').remove();
          container.one('.containers .head .label').set('text', '');
        },

        /**
         * Render the machine token widgets.
         *
         * @method _updateMachines
         */
        _updateMachines: function() {
          var exists, newElement;
          var machines = this.get('db').machines.filterByParent(null);
          var container = this.get('container');
          var machineList = container.one('.machines .content .items');
          if (!machines || !machineList) {
            return;
          }
          var machineElements = machineList.all('li');
          var plural = machines.length !== 1 ? 's' : '';

          container.one('.machines .head .label').set('text',
              machines.length + ' machine' + plural);

          machines.forEach(function(machine) {
            exists = machineElements.some(function(element) {
              if (String(machine.id) === element.getData('id')) {
                element.setData('exists', true);
                return true;
              }
            });
            if (!exists) {
              newElement = this._renderMachineToken(machine, machineList);
              newElement.setData('exists', true);
            }
          }, this);

          machineElements.each(function(element) {
            if (!element.getData('exists')) {
              if (element.one('.token').hasClass('active')) {
                this._clearContainerColumn();
              }
              element.remove();
            } else if (machines.length === 0) {
              element.remove();
              this._clearContainerColumn();
            } else {
              element.setData('exists', undefined);
            }
          }, this);
        },

        /**
         * Render a machine token.
         *
         * @method _renderMachineToken
         * @param {Object} machine the machine object.
         * @param {Node} list the list node to append the machine to.
         */
        _renderMachineToken: function(machine, list) {
          var node = Y.Node.create('<li></li>');
          new views.MachineToken({
            container: node,
            machine: machine
          }).render();
          list.append(node);
          return node;
        },

        /**
         * Render the undeployed service unit tokens.
         *
         * @method _renderServiceUnitTokens
         */
        _renderServiceUnitTokens: function() {
          var container = this.get('container'),
              listContainer = container.one('.unplaced .content'),
              parentNode = listContainer.one('.items'),
              units = this.get('db').serviceUnits;

          if (units && units.length && units.length > 0) {
            Y.Object.each(units, function(unit) {
              var node = Y.Node.create('<li></li>');
              new views.ServiceUnitToken({
                container: node,
                title: unit.displayName,
                id: unit.id,
                machines: this.get('db').machines.filterByParent(null),
                containers: [] // XXX Need to find query for getting containers
              }).render();
              parentNode.append(node);
            });
            // only append to the DOM once
            listContainer.append(parentNode);
          }
        },

        /**
         * Render the scale up UI.
         *
         * @method _renderScaleUp
         */
        _renderScaleUp: function() {
          var scaleUpContainer = this.get('container')
                              .one('.column.unplaced .scale-up');
          this._scaleUpView = new views.ServiceScaleUpView({
            container: scaleUpContainer,
            services: this.get('db').services
          }).render();
          this.addEvent(
              this._scaleUpView.on('addUnit', this._scaleUpService, this));
        },

        /**
          Handler for addUnit events emitted by the ServiceScaleUpView.

          @method _scaleUpService
          @param {Object} e The addUnit event facade.
        */
        _scaleUpService: function(e) {
          this.get('env').add_unit(e.serviceName, e.unitCount, null, null);
        },

        /**
         * Sets up the DOM nodes and renders them to the DOM.
         *
         * @method render
         */
        render: function() {
          var container = this.get('container');
          container.setHTML(this.template());
          container.addClass('machine-view-panel');
          this._renderHeaders();
          this._updateMachines();
          this._renderServiceUnitTokens();
          this._renderScaleUp();
          return this;
        },

        /**
          Empties the views container and removes attached classes

          @method destructor
        */
        destructor: function() {
          var container = this.get('container');
          container.setHTML('');
          container.removeClass('machine-view-panel');
          if (this._scaleUpView) {
            this._scaleUpView.destroy();
          }
        },

        ATTRS: {
          /**
           * The container element for the view.
           *
           * @attribute container
           * @type {Object}
           */
          container: {},

          /**
            Reference to the application db

            @attribute db
            @type {Object}
          */
          db: {}
        }
      });

  views.MachineViewPanelView = MachineViewPanelView;

}, '0.1.0', {
  requires: [
    'event-tracker',
    'handlebars',
    'juju-serviceunit-token',
    'juju-templates',
    'juju-view-utils',
    'container-token',
    'machine-token',
    'juju-serviceunit-token',
    'machine-view-panel-header',
    'node',
    'service-scale-up-view',
    'view'
  ]
});
