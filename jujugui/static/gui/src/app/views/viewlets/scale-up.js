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
      '.add.button': { click: 'showScaleUp' },
      '.placement .cancel.button': { click: 'hideScaleUp' },
      'input[name="placement"]': { change: '_toggleConstraints' },
      'form': { submit: '_preventFormSubmit' },
      '.edit.link': { click: '_toggleEditConstraints' },
      '.inspector-buttons .cancel': { click: 'hideScaleUp' },
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

      @method showScaleUp
      @param {Object} e The click event facade.
    */
    showScaleUp: function(e) {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      this.updateStateClass('per-machine');
    },

    /**
      Calls to set the class on the container to hide the scale-up UI.

      @method hideScaleUp
      @param {Object} e The click event facade.
    */
    hideScaleUp: function(e) {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
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
      var container = this.get('container'),
          env = this.get('env'),
          db = this.get('db'),
          type;
      var service = db.services.getById(this.get('serviceId'));
      // This loop is required because the psudo selector :checked does not work
      // in phantomjs.
      container.all('input[name="placement"]').some(function(radio) {
        if (radio.get('checked')) {
          type = radio.get('id');
          return true;
        }
      });
      var numUnits = container.one('input[name="units-number"]').get('value');

      if (type === 'manually-place') {
        utils.addGhostAndEcsUnits(db, env, service, numUnits);
        this.fire('changeState', {
          sectionB: {
            component: 'machine'
          }
        });
      } else {
        this._createMachinesPlaceUnits(numUnits, service);
      }
      this.hideScaleUp();
    },

    /**
      Handles creating machines based on the users specified constraints,
      creating units for the supplied service and placing those units on
      the newly created machines.

      @method _createMachinesPlaceUnits
      @param {String} numUnits The number of units input from the user.
      @param {Object} service The service model to add units to.
    */
    _createMachinesPlaceUnits: function(numUnits, service) {
      var container = this.get('container'),
          env = this.get('env'),
          db = this.get('db'),
          machine;
      var constraints = {
        'cpu-power': container.one('input[name="cpu-power"]').get('value'),
        'cpu-cores': container.one('input[name="cpu-cores"]').get('value'),
        mem: container.one('input[name="mem"]').get('value'),
        'root-disk': container.one('input[name="root-disk"]').get('value')
      };
      // "Don't make functions in a loop"
      // jshint -W083
      for (var i = 0; i < parseInt(numUnits, 10); i += 1) {
        machine = db.machines.addGhost();
        env.addMachines([{
          constraints: constraints
        }], function(machine) {
          db.machines.remove(machine);
        }.bind(this, machine), { modelId: machine.id});
        env.placeUnit(
            utils.addGhostAndEcsUnits(db, env, service, 1)[0],
            machine.id);
      }
    }

  }, {
    ATTRS: {
      serviceId: {},
      db: {},
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
