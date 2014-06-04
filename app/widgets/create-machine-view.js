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
          this.fire('createMachine', {
            unit: this.get('unit'),
            constraints: this._getConstraints()
          });
          this.destroy();
        },

        /**
          Get the constraints from the form values.

          @method _getConstraints
        */
        _getConstraints: function() {
          var constraintsForm = this.get('container').one('.constraints');
          return {
            'cpu-power': constraintsForm.one('input[name="cpu"]').get('value'),
            mem: constraintsForm.one('input[name="ram"]').get('value'),
            'root-disk': constraintsForm.one('input[name="disk"]').get('value')
          };
        },

        /**
          Sets up the DOM nodes and renders them to the DOM.

          @method render
        */
        render: function() {
          var container = this.get('container');
          container.setHTML(this.template());
          container.addClass('create-machine-view');
          return this;
        },

        /**
          Removes the view container and all its contents.

          @method destructor
        */
        destructor: function() {
          var container = this.get('container');
          container.setHTML('');
          container.removeClass('create-machine-view');
        },

        ATTRS: {
          /**
            @attribute unit
            @default undefined
            @type {Object}
          */
          unit: {}
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
