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
 * Automatically deploy new units to new machines.
 *
 * @module widgets
 */

YUI.add('autodeploy-extension', function(Y) {

  var widgets = Y.namespace('juju.widgets');

  /**
    Enables widgets to automatically place new units on new machines.

    @method AutodeployExtension
  */
  function AutodeployExtension() {}

  AutodeployExtension.prototype = {
    /**
      Place all the units on individual machines.

      @method _autoPlaceUnits
      @param {Object} e The click event facade.
    */
    _autoPlaceUnits: function(e) {
      var db = this.get('db'),
          unplacedUnits = db.units.filterByMachine(null);
      unplacedUnits.forEach(function(unit) {
        var machine = this._createMachine();
        this.get('env').placeUnit(unit, machine.id);
      }, this);
    },

    /**
      Create a new machine/container.

      @method _createMachine
      @param {String} containerType The container type to create.
      @param {String} parentId The parent for the container.
      @param {Object} constraints The machine/container constraints.
      @return {Object} The newly created ghost machine model instance.
    */
    _createMachine: function(containerType, parentId, constraints) {
      var db = this.get('db');
      var machine = db.machines.addGhost(parentId, containerType);
      // XXX A callback param MUST be provided even if it's just an
      // empty function, the ECS relies on wrapping this function so if
      // it's null it'll just stop executing. This should probably be
      // handled properly on the ECS side. Jeff May 12 2014
      var callback = Y.bind(this._onMachineCreated, this, machine);
      this.get('env').addMachines([{
        containerType: containerType,
        parentId: parentId,
        constraints: constraints || {}
      }], callback, {modelId: machine.id});
      return machine;
    },

    /**
      Callback called when a new machine is created.

      @method _onMachineCreated
      @param {Object} machine The corresponding ghost machine.
      @param {Object} response The juju-core response. The response is an
        object like the following:
        {
          err: 'only defined if a global error occurred'
          machines: [
            {name: '1', err: 'a machine error occurred'},
          ]
        }
    */
    _onMachineCreated: function(machine, response) {
      var db = this.get('db');
      var errorTitle;
      var errorMessage;
      var shouldDestroy = false;
      var createdMachine = response.machines[0];
      // Ensure the addMachines call executed successfully.
      if (response.err) {
        errorTitle = 'Error creating the new machine';
        errorMessage = response.err;
      } else {
        if (createdMachine.err) {
          errorTitle = 'Error creating machine ' + createdMachine.name;
          errorMessage = createdMachine.err;
        }
      }
      // Add an error notification if adding a machine failed.
      if (errorTitle) {
        db.notifications.add({
          title: errorTitle,
          message: 'Could not add the requested machine. Server ' +
              'responded with: ' + errorMessage,
          level: 'error'
        });
        shouldDestroy = true;
      }
      var createdMachineName = createdMachine.name;
      if (createdMachineName) {
        machine.id = createdMachineName;
      } else {
        shouldDestroy = true;
      }
      // If there was an error creating the machine OR if the newly
      // created machine doesn't have an ID yet then we need to remove
      // the model and have the deltas take over.
      if (shouldDestroy === true) {
        db.machines.remove(machine);
      }
    }
  };

  widgets.AutodeployExtension = AutodeployExtension;

});
