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
  Provide the create machine view.

  @module views
*/

YUI.add('create-machine-view', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      utils = views.utils,
      Templates = views.Templates;

  /**
    The view associated with creating a machine.

    @class CreateMachineView
  */
  var CreateMachineView = Y.Base.create('CreateMachineView', Y.View,
      [
        Y.Event.EventTracker
      ], {
        template: Templates['create-machine-view'],

        events: {
          '.cancel': {
            click: '_handleCancel'
          },
          '.create': {
            click: '_handleCreate'
          },
          '.containers select': {
            change: '_handleContainerTypeChange'
          }
        },

        /**
          Handle cancelling creating a machine.

          @method _handleCancel
          @param {Event} ev the click event created.
        */
        _handleCancel: function(e) {
          e.preventDefault();
          this.fire('cancelCreateMachine', {
            unit: this.get('unit')
          });
          this.destroy();
        },

        /**
          Handle firing the event to create a machine.

          @method _handleCreate
          @param {Event} ev the click event created.
        */
        _handleCreate: function(e) {
          e.preventDefault();
          var parentId = this.get('parentId');
          var containerType = this.get('containerType');
          // Do nothing if we're trying to create a container and the
          // container type has not been selected.
          if (parentId && !containerType) {
            return;
          }
          this.fire('createMachine', {
            unit: this.get('unit'),
            containerType: containerType,
            parentId: parentId,
            constraints: this._getConstraints()
          });
          this.destroy();
        },

        /**
          Handle display/hiding constraints depending
          on containerType

          @method _handleContainerTypeChange
          @param {Event} ev the click event created.
        */
        _handleContainerTypeChange: function(e) {
          e.preventDefault();
          var container = this.get('container');
          var select = e.currentTarget,
              selectedIndex = select.get('selectedIndex'),
              newVal = select.get('options').item(selectedIndex).get('value');
          this.set('containerType', newVal);
          if (newVal === 'kvm') {
            utils.setStateClass(container, 'container-constraints');
          } else {
            utils.setStateClass(container, 'containers');
          }
        },

        /**
          Get the constraints from the form values.

          @method _getConstraints
        */
        _getConstraints: function() {
          var form = this.get('container').one('.constraints-form');
          return {
            'cpu-power': form.one('input[name="cpu-power"]').get('value'),
            'cpu-cores': form.one('input[name="cpu-cores"]').get('value'),
            mem: form.one('input[name="mem"]').get('value'),
            'root-disk': form.one('input[name="root-disk"]').get('value')
          };
        },

        /**
          Sets up the DOM nodes and renders them to the DOM.

          @method render
        */
        render: function() {
          var container = this.get('container');
          container.setHTML(this.template({
            containerTypes: this.get('supportedContainerTypes')
          }));
          container.addClass('create-machine-view');
          // If this is a container (i.e., has a parent machine), show the
          // container type select and hide the constraints.
          if (this.get('parentId')) {
            utils.setStateClass(container, 'containers');
          } else {
            utils.setStateClass(container, 'constraints');
          }
          return this;
        },

        /**
          Removes the view container and all its contents.

          @method destructor
        */
        destructor: function() {
          var container = this.get('container');
          container.empty();
          container.removeClass('create-machine-view');
        },

        ATTRS: {
          /**
            The optional unit to assign to the newly created machine.

            @attribute unit
            @default undefined
            @type {Object}
          */
          unit: {},

          /**
            The optional parent machine into which create a new container.

            @attribute parentId
            @default undefined
            @type {String}
          */
          parentId: {},

          /**
            The optional container type.

            @attribute containerType
            @default undefined
            @type {String}
          */
          containerType: {},

          /**
            The environment's provider supported container types.
            Each container type is an object with a label and a value, e.g.
              [{label: 'LXC', value: 'lxc'}, {label: 'KVM', value: 'kvm'}].

            @attribute supportedContainerTypes
            @default undefined
            @type {Array}
          */
          supportedContainerTypes: {}
        }
      });

  views.CreateMachineView = CreateMachineView;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'event-tracker',
    'node',
    'handlebars',
    'juju-templates'
  ]
});
