/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

class BundleExporter {
  constructor(cfg) {
    this.db = cfg.db;
  }

  /**
    Generate a service list for the exported yaml file based on the list of
    services passed in.
    @param {Object} serviceList The service list.
    @return {Object} The services list for the export.
  */
  _generateServiceList(serviceList) {
    var services = {};
    serviceList.each(function(service) {
      var units = service.get('units');
      var charm = this.db.charms.getById(service.get('charm'));
      var serviceOptions = {};
      var charmOptions = charm.get('options');
      var serviceName = service.get('id');

      // Process the service_options removing any values
      // that are the default value for the charm.
      const config = service.get('config') || {};
      Object.keys(config).forEach(key => {
        let value = config[key];
        if (value !== undefined && value !== null) {
          var optionData = charmOptions && charmOptions[key];
          switch (optionData.type) {
            case 'boolean':
              // XXX frankban 2013-10-31: why boolean options are stored in
              // the db sometimes as booleans and other times as strings
              // (e.g. "true")? As a quick fix, always convert to boolean
              // type, but we need to find who writes in the services db and
              // normalize the values. Note that a more concise
              // `value = (value  + '' === 'true');`` is not minified
              // correctly and results in `value += 'true'` for some reason.
              if (value === 'true') {
                value = true;
              } else if (value === 'false') {
                value = false;
              }
              break;
            case 'float':
              value = parseFloat(value);
              break;
            case 'int':
              value = parseInt(value, 10);
              break;
          }
          var defaultVal = optionData && optionData['default'];
          var hasDefault = defaultVal !== undefined && defaultVal !== null;
          if (!hasDefault || value !== defaultVal) {
            serviceOptions[key] = value;
          }
        }
      });

      var serviceData = {charm: charm.get('id')};
      if (charm.get('is_subordinate')) {
        // Subordinate services can not have any units.
        delete serviceData.num_units;
      } else {
        // Test models or ghosts might not have a units LazyModelList.
        serviceData.num_units = units && units.size() || 0;
      }
      if (serviceOptions && Object.keys(serviceOptions).length >= 1) {
        serviceData.options = serviceOptions;
      }
      // Add constraints
      var constraints = service.get('constraintsStr');
      if (constraints) {
        // constraintStr will filter out empty values
        serviceData.constraints = constraints;
      }

      if (service.get('exposed')) {
        serviceData.expose = true;
      }

      const series = service.get('series');
      if (series) {
        serviceData.series = series;
      }

      // XXX: Only expose position. Currently these are position absolute
      // rather than relative.
      var anno = service.get('annotations');
      if (anno && anno['gui-x'] && anno['gui-y']) {
        serviceData.annotations = {'gui-x': anno['gui-x'],
          'gui-y': anno['gui-y']};
      }
      services[serviceName] = serviceData;
    }, this);
    return services;
  }

  /**
     Maps machine placement for services.
     @param {Object} machineList The list of machines.
   */
  _mapServicesToMachines(machineList) {
    const machinePlacement = {};
    const owners = {};
    const machineNames = {};
    const machines = machineList.filter(machine => {
      return this.db.units.filterByMachine(machine.id).length !== 0;
    });

    // "Sort" machines w/ parents (e.g. containers) to the back of the list.
    machines.sort(function(a, b) {
      let aLxc = 0,
          bLxc = 0;
      if (a.parentId) {
        aLxc = -1;
      }
      if (b.parentId) {
        bLxc = -1;
      }
      return bLxc - aLxc;
    });

    machines.forEach(function(machine) {
      const units = this.db.units.filterByMachine(machine.id);
      const containerType = machine.containerType;
      let machineName;
      let owner;
      if (containerType !== null && containerType !== undefined) {
        // If the machine is an LXC, we just base the name off of the
        // machine's parent, which we've already created a name for.
        const machineId = machine.parentId;
        if (machineNames[machineId]) {
          machineName = containerType + ':' + machineNames[machineId];
        } else {
          machineName = containerType + ':' + machine.parentId;
        }
      } else {
        // The "owner" is the service that deployer will use to allocate other
        // service units, e.g. "put this unit of mysql on the machine with
        // wordpress."
        //
        // We need to get both the "owner" of the machine and how many times
        // we have seen the owner to generate a deployer designation (e.g.
        // wordpress=2, the second machine owned by wordpress).
        owner = units[0].service;
        const ownerIndex = owners[owner] >= 0 ? owners[owner] + 1 : 0;
        owners[owner] = ownerIndex;
        machineName = owner + '/' + ownerIndex;
        machineNames[machine.id] = machineName;
      }

      units.forEach(function(unit) {
        const serviceName = unit.service;
        if (!machinePlacement[serviceName]) {
          machinePlacement[serviceName] = [];
        }
        if (serviceName === owner) {
          machineName = unit.machine;
        }
        machinePlacement[serviceName].push(machineName);
      });
    }, this);
    return machinePlacement;
  }

  /**
    Generate a relation list for the exported yaml file based on the list of
    relations passed in.
    @param {Object} relationList The relation list.
    @return {Object} The relations list for the export.
  */
  _generateRelationSpec(relationList) {
    const relations = [];
    relationList.each(relation => {
      const endpoints = relation.get('endpoints');
      // Skip peer relations: they should be added automatically.
      if (endpoints.length === 1) {
        return;
      }
      // Export this relation.
      relations.push(endpoints.map(endpoint =>
        endpoint[0] + (endpoint[1].name ? `:${endpoint[1].name}` : '')));
    });
    return relations;
  }

  /**
    Generate a machine list for the exported yaml file based on the list of
    machines passed in.
    @param {Object} machinePlacement The machines list.
    @param {Object} machineList The machines list.
    @param {Object} serviceList The services list.
    @return {Object} The machine list for the export.
  */
  _generateMachineSpec(machinePlacement, machineList, serviceList) {
    var machines = {};
    var counter = 0;
    // We want to exlcude any machines which do not have units placed on
    // them as well as the machine which contains the GUI if it is the
    // only unit on that machine.
    var machineIdList = [];
    var machineIdMap = {};
    Object.keys(machinePlacement).forEach(function(serviceName) {
      machinePlacement[serviceName].forEach(function(machineId) {
        // Checking for dupes before adding to the list
        var idExists = machineIdList.some(function(id) {
          if (id === machineId) {
            return true;
          }
        });
        if (!idExists) {
          machineIdList.push(machineId);
          // Store a mapping of the machines so we can start them at a
          // 0 index to make the bundle output more pleasing to read.
          var parts = machineId.split(':');
          var parentId;
          if (parts.length === 2) {
            // It's a container
            // Does it provide us a machine id to create this container on
            // by converting it to an integer and comparing it to it's
            // coerced value. It could be a machine number, 'new', or
            // a unit name.
            var partInt = parseInt(parts[1], 10);
            if (!isNaN(partInt)) {
              parentId = partInt;
            }
          } else {
            parentId = machineId;
          }
          // parentId will be undefined if it's a unit name at which point
          // we do not want to create a machine record for it because it will
          // be handled in that units parent machine creation.
          if (parentId && machineIdMap[parentId] === undefined) {
            // Create a mapping of the parentId to a 0 indexed counter which
            // we will use to construct the ids later.
            machineIdMap[parentId] = counter;
            counter += 1;
          }
        }
      }, this);
      // Add the machine placement information to the services 'to' directive.
      serviceList[serviceName].to = machinePlacement[serviceName].map(
        function(machineId) {
          let parts = machineId.split(':');
          if (parts.length === 2) {
            // It's a container
            let partInt = parseInt(parts[1], 10);
            if (!isNaN(partInt)) {
              parts[1] = machineIdMap[partInt];
            }
            return parts.join(':');
          } else {
            return machineIdMap[machineId] + '';
          }
        }
      );
    }, this);

    const defaultSeries = this.db.environment.get('defaultSeries');
    machineList.each(function(machine) {
      var parentId = machine.parentId;
      if (parentId !== null) {
        // We don't add containers to the machine spec.
        return;
      }
      // We only want to save machines which have units assigned to them.
      var machineId = machine.id;
      machineIdList.some(function(listMachineId) {
        var parts = listMachineId.split(':');
        if (parts.length === 2) {
          var partInt = parseInt(parts[1], 10);
          if (!isNaN(partInt) && machineId === partInt + '') {
            // If the container has a machine number then assign it to be
            // the machine name so that the machineidList will match.
            machineId = listMachineId;
            return true;
          }
        }
      });
      if (machineIdList.indexOf(machineId) > -1) {
        var parts = machineId.split(':');
        if (parts.length === 2) {
          machineId = parts[1];
        }
        machines[machineIdMap[machineId]] = {};
        const series = machine.series || defaultSeries;
        if (series) {
          machines[machineIdMap[machineId]].series = series;
        }
        // The machine object can include a constraints field in the case
        // the machine is not yet committed.
        let constraints = machine.constraints;
        if (machine.hardware) {
          constraints = this._collapseMachineConstraints(machine.hardware);
        }
        if (constraints && constraints.length > 0) {
          machines[machineIdMap[machineId]].constraints = constraints;
        }
      }
    }, this);
    return machines;
  }

  /**
    Collapses the machine hardware object details into the constraints string
    expected by Juju.
    @param {Object} constraints The hardware constraints object from the
      machine model.
    @return {String} The constraints in a string format.
  */
  _collapseMachineConstraints(constraints) {
    let constraint = '';
    const constraintMap = {
      availabilityZone: 'availability-zone',
      cpuCores: 'cpu-cores',
      cpuPower: 'cpu-power',
      disk: 'root-disk'
    };
    Object.keys(constraints || {}).forEach(key => {
      if (key === 'availabilityZone') {
        // We do not want to export the availability-zone in the bundle
        // export because it makes the bundles less sharable.
        return;
      }
      const value = constraints[key];
      if (value) {
        const property = constraintMap[key] || key;
        constraint += property + '=' + value + ' ';
      }
    });
    return constraint.trim();
  }

  /**
    Export the current model as a bundle, including uncommitted changes.
    @return {Object} The JSON decoded bundle.
  */
  exportBundle() {
    const defaultSeries = this.db.environment.get('defaultSeries');
    const result = {};
    if (defaultSeries) {
      result.series = defaultSeries;
    }
    const applications = this._generateServiceList(this.db.services);
    result.applications = applications;
    const machinePlacement = this._mapServicesToMachines(this.db.machines);
    result.relations = this._generateRelationSpec(this.db.relations);
    result.machines = this._generateMachineSpec(
      machinePlacement, this.db.machines, applications);
    return result;
  }
}

module.exports = BundleExporter;
