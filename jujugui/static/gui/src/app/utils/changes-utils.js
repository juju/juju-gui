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

YUI.add('changes-utils', function(Y) {

  var ChangesUtils = {};

  var removeBrackets = /^\(?(.{0,}?)\)?$/;

  /**
    Return a list of all change descriptions.

    @method generateAllChangeDescriptions
    @param {Object} services The list of services from the db.
    @param {Object} units The list of units from the db.
    @param {Object} changeSet The current environment change set.
  */
  ChangesUtils.generateAllChangeDescriptions = function(changeSet, services,
                                                        units) {
    var changes = [],
        change;
    Object.keys(changeSet).forEach(function(key) {
      change = this.generateChangeDescription(
          services, units, changeSet[key]);
      if (change) {
        changes.push(change);
      }
    }, this);
    return changes;
  };

  /**
    Return a description of an ecs change for the summary.

    @method generateChangeDescription
    @param {Object} services The list of services from the db.
    @param {Object} units The list of units from the db.
    @param {Object} change The environment change.
    @param {Bool} skipTime optional, used for testing, don't generate time.
  */
  ChangesUtils.generateChangeDescription = function(services, units, change,
                                                    skipTime) {
    var changeItem = {};

    if (change && change.command) {
      changeItem.id = change.id;
      // XXX: The add_unit is just the same as the service because adding
      // the service also adds the unit. We need to look at the UX for
      // units as follow up.
      switch (change.command.method) {
        case '_deploy':
          if (!change.command.options || !change.command.options.modelId) {
            // When using the deploy-target query parameter we want to auto
            // deploy so we can skip generating the line item in the deployer
            // bar.
            return;
          }
          var ghostService = services.getById(
              change.command.options.modelId);
          changeItem.icon = ghostService.get('icon');
          changeItem.description = ' ' + ghostService.get('name') +
              ' has been added.';
          break;
        case '_destroyService':
          changeItem.icon = 'changes-service-destroyed';
          changeItem.description = ' ' + change.command.args[0] +
              ' has been destroyed.';
          break;
        case '_add_unit':
          var service = this.getServiceByUnitId(
              change.command.options.modelId, services, units);
          changeItem.icon = 'changes-units-added';
          var units = change.command.args[1],
              msg;
          if (units !== 1) {
            msg = 'units have been added.';
          } else {
            msg = 'unit has been added.';
          }
          changeItem.description = ' ' + units + ' ' +
              service.get('name') + ' ' + msg;
          break;
        case '_remove_units':
          changeItem.icon = 'changes-units-removed';
          /*jslint -W004*/
          var units = change.command.args[0];
          changeItem.description = units.length + ' unit' +
              (units.length === 1 ? ' has' : 's have') +
              ' been removed from ' + units[0].split('/')[0];
          break;
        case '_expose':
          var name = change.command.args[0];
          if (name.indexOf('$') > -1) {
            var ghostService = services.getById(name);
            name = ghostService.get('name');
          }
          changeItem.icon = 'changes-service-exposed';
          changeItem.description = name + ' exposed';
          break;
        case '_unexpose':
          changeItem.icon = 'changes-service-unexposed';
          changeItem.description = change.command.args[0] + ' unexposed';
          break;
        case '_add_relation':
          var serviceList = this.getRealRelationEndpointNames(
              change.command.args, services);
          changeItem.icon = 'changes-relation-added';
          changeItem.description = change.command.args[0][1].name +
              ' relation added between ' +
              serviceList[0] + ' and ' + serviceList[1] + '.';
          break;
        case '_remove_relation':
          changeItem.icon = 'changes-relation-removed';
          changeItem.description = change.command.args[0][1].name +
              ' relation removed between ' +
              change.command.args[0][0] +
              ' and ' +
              change.command.args[1][0] + '.';
          break;
        case '_addMachines':
          var machineType = change.command.args[0][0].parentId ?
              'container' : 'machine';
          changeItem.icon = 'changes-' + machineType + '-created';
          changeItem.description = change.command.args[0].length +
              ' ' + machineType +
              (change.command.args[0].length !== 1 ? 's have' : ' has') +
              ' been added.';
          break;
        case '_destroyMachines':
          /*jshint -W004*/
          var machineType = change.command.args[0][0].indexOf('/') !== -1 ?
              'container' : 'machine';
          changeItem.icon = 'changes-' + machineType + '-destroyed';
          changeItem.description = change.command.args[0].length +
              ' ' + machineType +
              (change.command.args[0].length !== 1 ? 's have' : ' has') +
              ' been destroyed.';
          break;
        case '_set_config':
          var cfgServ = services.getById(change.command.args[0]);
          changeItem.icon = 'changes-config-changed';
          changeItem.description = 'Configuration values changed for ' +
              cfgServ.get('displayName').match(removeBrackets)[1] + '.';
          break;
        default:
          changeItem.icon = 'changes-service-exposed';
          changeItem.description = 'An unknown change has been made ' +
              'to this enviroment via the CLI.';
          break;
      }
    }
    if (skipTime || !change) {
      changeItem.time = '-';
    } else {
      changeItem.time = this._formatAMPM(new Date(change.timestamp));
    }
    return changeItem;
  };

  /**
    Return formatted time for display.

    @method _formatAMPM
    @param {Date} date The current date.
  */
  ChangesUtils._formatAMPM = function(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  };

  /**
    Loops through the services in the db to find ones which have id's which
    match the temporary id's assigned to the add realation call.

    @method getRealRelationEndpointNames
    @param {Array} args The arguments array from the ecs add relations call.
    @return {Array} An array of the service names involved in the relation.
  */
  ChangesUtils.getRealRelationEndpointNames = function(args, services) {
    var serviceList = [],
        serviceId;
    services.each(function(service) {
      serviceId = service.get('id');
      args.forEach(function(arg) {
        if (serviceId === arg[0]) {
          var matches = service.get('displayName').match(removeBrackets);
          serviceList.push(matches[matches.length - 1]);
        }
      });
    });
    return serviceList;
  };

  /**
    Return the service for a unit with the supplied id.
    Raise an error if the unit is not found.

    @method getServiceByUnitId
    @param {String} unitId The unit identifier in the database.
    @param {Object} services The list of services from the db.
    @param {Object} units The list of units from the db.
    @return {Model} The service model instance.
  */
  ChangesUtils.getServiceByUnitId = function(unitId, services, units) {
    var unit = units.getById(unitId);
    if (!unit) {
      // This should never happen in the deployer panel context.
      throw 'unit ' + unitId + ' not found';
    }
    return services.getById(unit.service);
  };

  window.juju.utils.ChangesUtils = ChangesUtils;

}, '0.0.1', {requires: []});
