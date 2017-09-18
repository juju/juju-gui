/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const removeBrackets = /^\(?(.{0,}?)\)?$/;

const changesUtils = {

  /**
    Filter a changeset by a parent change.
    @param {Object} changeSet The change set to apply the filter to.
    @param {String} parentId The id of the parent change to filter by.
    @returns {Object} The filtered changes.
  */
  filterByParent: (changeSet, parentId) => {
    let changes = {};
    Object.keys(changeSet).forEach((key) => {
      const change = changeSet[key];
      const parents = change.parents || [];
      if (parents.indexOf(parentId) >= 0) {
        changes[key] = change;
      }
    }, this);
    return changes;
  },

  /**
    Return the counts for each type of ecs change.
    @param {Object} services The list of services from the db.
    @returns {Object} The ecs change counts.
  */
  getChangeCounts: changeSet => {
    let counts = {};
    let total = 0;
    Object.keys(changeSet).forEach(key => {
      const change = changeSet[key];
      const method = change.command && change.command.method;
      if (method) {
        if (counts[method]) {
          counts[method] = counts[method] += 1;
        } else {
          counts[method] = 1;
        }
        total += 1;
      }
    }, this);
    counts.total = total;
    return counts;
  },

  /**
    Group the ecs changes by method type.
    @param {Object} changeSet The current environment change set.
    @returns {Object} The grouped ecs changes.
  */
  getGroupedChanges: changeSet => {
    let changes = {};
    Object.keys(changeSet).forEach((key) => {
      const change = changeSet[key];
      const method = change.command && change.command.method;
      if (method) {
        if (!changes[method]) {
          changes[method] = {};
        }
        changes[method][key] = change;
      }
    }, this);
    return changes;
  },

  /**
    Sorts the supplied descriptions by their applications.
    @param {Function} getServiceById The model function to get services
      by their ids.
    @param {Object} changeset The ECS changeset.
    @param {Ojbect} descriptions The generated descriptions from the
      generateAllChangeDescriptions method.
    @return {Object} The supplied descriptions in an object where the key is
      the application associated with the description and each value is an
      array of descriptions.
  */
  sortDescriptionsByApplication: (getServiceById, changeset, descriptions) => {
    // ECS methods to blacklist for description sorting.
    const methodBlacklist = [
      'addCharm', 'addMachines', 'addSSHKeys', 'importSSHKeys', 'destroyMachines'];
    const grouped = {};
    // If the application name is a temporary ID (contains $)
    // then fetch its real name and return that or return the original name.
    const getRealAppName = name =>
      name.includes('$') ? getServiceById(name).get('name') : name;
    // Fetch the names of a relation.
    const relationAppNames = args => {
      const appNames = [args[0][0]];
      // Relations will typically have another remote endpoint but sometimes
      // they won't, like with peer relations between the same app.
      if (args[1]) {
        appNames.push(args[1][0]);
      }
      return appNames;
    };
    // Not all api calls have the same call signature so this normalizes the
    // application that the command is for.
    const nameFetchers = {
      _addPendingResources: args => args[0].applicationName,
      _deploy: args => args[0].applicationName,
      _add_relation: relationAppNames,
      // These unit calls will be grouped by application already.
      _remove_units: args => args[0][0].split('/')[0],
      _remove_relation: relationAppNames,
      default: args => args[0]
    };
    // Adds the supplied item to the supplied name.
    const addToGrouped = (name, item) => {
      const realName = getRealAppName(name);
      if (!grouped[realName]) {
        grouped[realName] = [];
      }
      grouped[realName].push(item);
    };

    // Loop through each one of the descriptions and then add them to the
    // grouped object under each application.
    descriptions.forEach(item => {
      if (methodBlacklist.includes(item.id.split('-')[0])) {
        // We do not want to show some actions in the deployment flow changelog.
        return;
      }
      const command = changeset[item.id].command;
      const method = command.method;
      const args = command.args;
      let appNames;
      // Fetch the name from the method.
      if (typeof nameFetchers[method] === 'function') {
        appNames = nameFetchers[method](args);
      } else {
        appNames = nameFetchers.default(args);
      }
      // Some of the fetchers return an array (like for relations).
      if (Array.isArray(appNames)) {
        appNames.forEach(name => addToGrouped(name, item));
      } else {
        addToGrouped(appNames, item);
      }
    });
    return grouped;
  },

  /**
    Return a list of all change descriptions.
    @param {Object} services The list of services from the db.
    @param {Object} units The list of units from the db.
    @param {Object} changeSet The current environment change set.
  */
  generateAllChangeDescriptions: (services, units, changeSet) => {
    let changes = [],
        change;
    Object.keys(changeSet).forEach(key => {
      change = changesUtils.generateChangeDescription(
        services, units, changeSet[key]);
      if (change) {
        changes.push(change);
      }
    }, this);
    return changes;
  },

  /**
    Return a description of an ecs change for the summary.
    @param {Object} services The list of services from the db.
    @param {Object} units The list of units from the db.
    @param {Object} change The environment change.
    @param {Bool} skipTime optional, used for testing, don't generate time.
  */
  generateChangeDescription: (services, units, change, skipTime) => {
    let changeItem = {};

    if (change && change.command) {
      let ghostService;
      let machineType;
      changeItem.id = change.id;
      // XXX: The add_unit is just the same as the service because adding
      // the service also adds the unit. We need to look at the UX for
      // units as follow up.
      switch (change.command.method) {
        case '_addCharm':
          const command = change.command;
          changeItem.description = ' ' + command.args[0] +
            ' will be added to the controller.';
          // TODO frankban: retrieve the icon from the charm itself. We cannot
          // always pass applicationId as an option, and maybe we should never
          // do that, and just get what we need from the charm.
          changeItem.icon = 'charm-added';
          const appId = command.options && command.options.applicationId;
          if (appId) {
            changeItem.icon = services.getById(appId).get('icon');
          }
          break;
        case '_addPendingResources':
          const applicationName = change.command.args[0].applicationName;
          const application = services.getServiceByName(applicationName);
          changeItem.icon = application.get('icon');
          changeItem.description = ` ${applicationName} resources will` +
            ' be added.';
          break;
        case '_deploy':
          if (!change.command.options || !change.command.options.modelId) {
            // When using the deploy-target query parameter we want to auto
            // deploy so we can skip generating the line item in the deployer
            // bar.
            return;
          }
          ghostService = services.getById(
            change.command.options.modelId);
          changeItem.icon = ghostService.get('icon');
          changeItem.description = ' ' + ghostService.get('name') +
              ' will be added to the model.';
          break;
        case '_destroyApplication':
          changeItem.icon = 'changes-service-destroyed';
          changeItem.description = ' ' + change.command.args[0] +
              ' will be destroyed.';
          break;
        case '_add_unit':
          const service = changesUtils.getServiceByUnitId(
            change.command.options.modelId, services, units);
          changeItem.icon = 'changes-units-added';
          const unitCount = change.command.args[1];
          changeItem.description = ` ${unitCount} ${service.get('name')} ` +
            `unit${unitCount === 1 ? '' : 's'} will be added.`;
          break;
        case '_remove_units':
          changeItem.icon = 'changes-units-removed';
          /*jslint -W004*/
          const unitList = change.command.args[0];
          changeItem.description = unitList.length + ' unit' +
              (unitList.length === 1 ? '' : 's') +
              ' will be removed from ' + unitList[0].split('/')[0];
          break;
        case '_expose':
          let name = change.command.args[0];
          if (name.indexOf('$') > -1) {
            ghostService = services.getById(name);
            name = ghostService.get('name');
          }
          changeItem.icon = 'exposed_16';
          changeItem.description = name + ' will be exposed';
          break;
        case '_unexpose':
          changeItem.icon = 'exposed_16';
          changeItem.description = change.command.args[0] +
            ' will be unexposed';
          break;
        case '_add_relation':
          const serviceList = changesUtils.getRealRelationEndpointNames(
            change.command.args, services);
          changeItem.icon = 'changes-relation-added';
          changeItem.description = change.command.args[0][1].name +
              ' relation will be added between ' +
              serviceList[0] + ' and ' + serviceList[1] + '.';
          break;
        case '_remove_relation':
          changeItem.icon = 'changes-relation-removed';
          changeItem.description = change.command.args[0][1].name +
              ' relation will be removed between ' +
              change.command.args[0][0] +
              ' and ' +
              change.command.args[1][0] + '.';
          break;
        case '_addMachines':
          machineType = change.command.args[0][0].parentId ?
            'container' : 'machine';
          changeItem.icon = 'changes-' + machineType + '-created';
          changeItem.description = change.command.args[0].length +
              ' ' + machineType +
              (change.command.args[0].length !== 1 ? 's' : '') +
              ' will be added.';
          break;
        case '_destroyMachines':
          machineType = change.command.args[0][0].indexOf('/') !== -1 ?
            'container' : 'machine';
          changeItem.icon = 'changes-' + machineType + '-destroyed';
          changeItem.description = change.command.args[0].length +
              ' ' + machineType +
              (change.command.args[0].length !== 1 ? 's' : '') +
              ' will be destroyed.';
          break;
        case '_set_config':
          const cfgServ = services.getById(change.command.args[0]);
          changeItem.icon = 'changes-config-changed';
          changeItem.description = 'Configuration values will be changed for ' +
              cfgServ.get('displayName').match(removeBrackets)[1] + '.';
          break;
        case '_addKeys':
          changeItem.icon = 'changes-unknown';
          changeItem.description = 'SSH keys will be added to the model.';
          break;
        default:
          changeItem.icon = 'changes-unknown';
          changeItem.description = 'An unknown change has been made ' +
              'to this model via the CLI.';
          break;
      }
    }
    if (skipTime || !change) {
      changeItem.time = '-';
    } else {
      changeItem.time = changesUtils._formatAMPM(new Date(change.timestamp));
    }
    return changeItem;
  },

  /**
    Return formatted time for display.
    @param {Date} date The current date.
  */
  _formatAMPM: date => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
  },

  /**
    Loops through the services in the db to find ones which have id's which
    match the temporary id's assigned to the add relation call.
    @param {Array} args The arguments array from the ecs add relations call.
    @return {Array} An array of the service names involved in the relation.
  */
  getRealRelationEndpointNames: (args, services) => {
    let serviceList = [],
        serviceId;
    services.each(service => {
      serviceId = service.get('id');
      args.forEach(arg => {
        if (serviceId === arg[0]) {
          const matches = service.get('displayName').match(removeBrackets);
          serviceList.push(matches[matches.length - 1]);
        }
      });
    });
    return serviceList;
  },

  /**
    Return the service for a unit with the supplied id.
    Raise an error if the unit is not found.
    @param {String} unitId The unit identifier in the database.
    @param {Object} services The list of services from the db.
    @param {Object} units The list of units from the db.
    @return {Model} The service model instance.
  */
  getServiceByUnitId: (unitId, services, units) => {
    const unit = units.getById(unitId);
    if (!unit) {
      // This should never happen in the deployer panel context.
      throw 'unit ' + unitId + ' not found';
    }
    return services.getById(unit.service);
  }
};

module.exports = changesUtils;
