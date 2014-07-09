/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';


YUI.add('scale-up-view', function(Y) {

  var ns = Y.namespace('juju.viewlets'),
      utils = Y.namespace('juju.views.utils'),
      templates = Y.namespace('juju.views').Templates;

  ns.ScaleUp = Y.Base.create(name, Y.View, [], {
    template: templates['scale-up'],
    events: {
      '.add.button': { click: '_showScaleUp' },
      '.placement .cancel.button': { click: '_hideScaleUp' },
      'input[name="placement"]': { change: '_toggleConstraints' },
      'form': { submit: '_preventFormSubmit' },
      '.edit.link': { click: '_toggleEditConstraints' },
      '.inspector-buttons .cancel': { click: '_hideScaleUp' },
      '.inspector-buttons .confirm': { click: '_submitScaleUp' }
    },

    /**
      Renders the views template into the container

      @method render
      @return {Object} The views container.
    */
    render: function() {
      var container = this.get('container');
      container.append(this.template());
      return container;
    },

    /**
      This prevents the placement forms from submitting without the user
      clicking the Confirm button manually.

      @method _preventFormSubmit
      @param {Object} e Submit event facade.
    */
    _preventFormSubmit: function(e) {
      e.preventDefault();
    },

    /**
      Updates the state class on the viewlet templates container. See
      scale-up.less for available classes.

      @method updateStateClass
      @param {object} className The class name to set on the container via the
        utils setStateClass method.
    */
    updateStateClass: function(className) {
      utils.setStateClass(
          this.get('container').one('.view-container'),
          className);
    },

    /**
      Calls to set the class on the container to show the scale-up UI.

      @method _showScaleUp
      @param {Object} e The click event facade.
    */
    _showScaleUp: function(e) {
      e.preventDefault();
      this.updateStateClass('per-machine');
    },

    /**
      Calls to set the class on the container to hide the scale-up UI.

      @method _hideScaleUp
      @param {Object} e The click event facade.
    */
    _hideScaleUp: function(e) {
      e.preventDefault();
      this.updateStateClass('default');
    },

    /**
      Calls to set the class on the container to show the constraints
      information based on which radio button is selected in the UI.

      @method _toggleConstraints
      @param {Object} e The click event facade.
    */
    _toggleConstraints: function(e) {
      var state;
      if (e.currentTarget.get('id') === 'manually-place') {
        state = 'manual';
      } else {
        state = 'per-machine';
      }
      this.updateStateClass(state);
    },

    /**
      Calls to set the class on the container to show the edit-constraints
      inputs.

      @method _toggleEditConstraints
      @param {Object} e The click event facade.
    */
    _toggleEditConstraints: function(e) {
      e.preventDefault();
      this.updateStateClass('constraints');
    },

    /**
      handles submitting the new scale up information to Juju.

      @method _submitScaleUp
      @param {Object} e The click event facade.
    */
    _submitScaleUp: function(e) {
      e.preventDefault();
      var container = this.get('container');
      var env = this.get('env');
      var type = container.one('input[name="placement"]:checked').get('id');
      var numUnits = container.one('input[name="units-number"]').get('value');
      if (type === 'manually-place') {
        env.add_unit(
            this.get('serviceId'), numUnits);
      } else {

      }
    }

  }, {
    ATTRS: {
      serviceId: {},
      env: {}
    }
  });

}, '0.0.1', {
  requires: [
    'node',
    'juju-view-utils',
    'juju-templates',
    'viewlet-view-base'
  ]
});
