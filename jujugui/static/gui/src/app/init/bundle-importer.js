/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const jsyaml = require('js-yaml');

class BundleImporter {
  constructor(cfg) {
    this.modelAPI = cfg.modelAPI;
    this._getBundleChanges = cfg.getBundleChanges;
    this.db = cfg.db;
    this.charmstore = cfg.charmstore;
    this.hideDragOverNotification = cfg.hideDragOverNotification;
    this._dryRunIndex = -1;
    this._collectedServices = [];
    this.makeEntityModel = cfg.makeEntityModel;
    this.recordSet = null;
  }

  /**
    Import a bundle YAML into the current model.
    @param {String} bundleYAML The bundle YAML to deploy.
  */
  importBundleYAML(bundleYAML) {
    this.db.notifications.add({
      title: 'Fetching bundle data',
      message: 'Fetching detailed bundle data, this may take some time',
      level: 'important'
    });
    this.fetchDryRun(bundleYAML, null);
  }

  /**
    Import bundle YAML or dry-run file.
    @param {Object} file The file to import.
  */
  importBundleFile(file) {
    const reader = this._generateFileReader();
    reader.onload = this._fileReaderOnload.bind(this, file);
    reader.readAsText(file);
    this.hideDragOverNotification();
    return reader; // Not intended for use. Returned for testing.
  }

  /**
    Loops through the dry-run structure.
  */
  importBundleDryRun(records) {
    // Sort dry-run records into the correct order.
    this.recordSet = this._sortDryRunRecords(records);
    this._executeDryRun(this.recordSet);
  }

  /**
    Ensure that the bundle YAML destined for parsing by juju bundlelib
    uses the basketless v4 format, rather than the basket format used by
    v3 bundles
    @param {String} bundleYAML the bundle file contents
    @return {String} the modified v3 bundle, or the v4 bundle as it was
    provided.
  */
  _ensureV4Format(bundleYAML) {
    try {
      const bundle = jsyaml.safeLoad(bundleYAML);
      if (bundle.services && !bundle.services.services ||
        bundle.applications) {
        return bundleYAML;
      } else {
        // Fetch the first bundle in the v3 bundle basket.
        const firstBundleName = Object.keys(bundle)[0];
        const firstBundle = bundle[firstBundleName];
        // Return JSON.  JSON is a valid subset of YAML, and the internal
        // JSON methods will be faster than relying on jsyaml.
        return JSON.stringify(firstBundle);
      }
    } catch (e) {
      // The bundle is malformed; errors will fall through in
      // _handleFetchDryRun.
      return bundleYAML;
    }
  }

  /**
    Fetch the dry-run output from the Guiserver.
    @param {String} bundleYAML The bundle file contents.
    @param {String} changesToken The token identifying a bundle change set.
  */
  fetchDryRun(bundleYAML, changesToken) {
    if (bundleYAML) {
      bundleYAML = this._ensureV4Format(bundleYAML);
    }
    this._getBundleChanges(
      bundleYAML, changesToken, this._handleFetchDryRun.bind(this));
  }

  /**
    Handles the dry run response.
    @param {Object} response The processed response data.
  */
  _handleFetchDryRun(errors, changes) {
    if (errors && errors.length) {
      this.db.notifications.add({
        title: 'Error generating changeSet',
        message: 'The following errors occurred while retrieving bundle ' +
            'changes: ' + errors.join(', '),
        level: 'error'
      });
      return;
    }
    this.importBundleDryRun(changes);
  }

  /**
    Returns a new instance of FileReader.
    @return {Object} An instance of FileReader
  */
  _generateFileReader() {
    return new FileReader();
  }

  /**
    On load handler for the FileReader method which handles the importation
    of the bundle files.
    @param {String} file The filename of the dropped file.
    @param {Object} e The load event from the file load.
  */
  _fileReaderOnload(file, e) {
    const extension = file.name.split('.').pop();
    if (extension === 'yaml') {
      this.db.notifications.add({
        title: 'Processing File',
        message: 'Changeset processing started.',
        level: 'important'
      });
      // result is YAML so we need to fetch the dry run changeset data from
      // the guiserver.
      this.fetchDryRun(e.target.result, null);
    }
  }

  /**
    Collects all requires for a given record and all of its parent records.
    @param {Array} records All changeset records.
    @param {Object} record The current record to collect requires.
    @param {Array} requires The aggregated list of requires.
  */
  _collectRequires(records, record, requires) {
    if (record.requires) {
      record.requires.forEach(function(requiredRecordId) {
        requires.push(requiredRecordId);
        this._collectRequires(
          records,
          records.filter(function(r) {
            return r.id === requiredRecordId;
          })[0],
          requires);
      }, this);
    }
    return requires;
  }

  /**
    Sorts the dry-run records into the correct order so that we can process
    it top to bottom. Charms, Machines, Services, Units, Relations. It's not
    very efficient but it's easy to grok for future you.
    @param {Array} records The dry-run data array.
    @return {Array} A sorted list of records.
  */
  _sortDryRunRecords(records) {
    const changeSet = [];
    let count = records.length;
    let record;
    for (let i = 0; i < count; i += 1) {
      record = records[i];
      if (record.requires.length === 0) {
        changeSet.push(record);
        continue;
      }
      const prereq = this._collectRequires(records, record, [])
        .every(recordId => {
          // Loop through the changeSet to see if the required record is
          // in the changeSet already.
          return changeSet.some(record => {
            return record.id === recordId ? true : false;
          });
        });
      // If all prerequisites have been added to the list.
      if (prereq) {
        // Make sure we don't have any duplicate records.
        const exists = changeSet.some(set => {
          return set.id === record.id;
        });
        if (!exists) {
          changeSet.push(record);
        }
      } else {
        // Push this record to the end of the list and increase the
        // loop count.
        records.push(record);
        count += 1;
        continue;
      }
    }
    return changeSet;
  }

  /**
    Loop through the record set and add the model to the records which have
    it as a dependency.
    @param {String} id The record Id.
    @param {Object} model The model generated from the record execution.
  */
  _saveModelToRequires(id, model) {
    this.recordSet.forEach(record => {
      record.requires.forEach(require => {
        if (require === id) {
          record[id] = model;
        }
      });
    });
  }

  /**
    Executes each record passing the resulting models to records which
    require the parent records data set.
    @param {Array} records The list of records in the recordSet.
  */
  _executeDryRun(records) {
    if (this._dryRunIndex === records.length - 1) {
      // Done executing the recordSet.
      this.db.notifications.add({
        title: 'Import Complete',
        message: 'ChangeSet import complete.',
        level: 'important'
      });
      this._dryRunIndex = -1;
      const collectedServices = this._collectedServices;
      this._collectedServices = [];
      document.dispatchEvent(new CustomEvent('topo.bundleImportComplete', {
        detail: {services: collectedServices}
      }));
      return;
    }
    this._dryRunIndex += 1;
    this._executeRecord(records[this._dryRunIndex], records);
  }

  /**
    Executes the supplied record
    @param {Object} record The record object to execute.
    @param {Array} records The list of records in the recordSet.
  */
  _executeRecord(record, records) {
    var method = this['_execute_' + record.method];
    if (typeof method === 'function') {
      this['_execute_' + record.method](
        record, this._executeDryRun.bind(this, records));
    } else {
      this.db.notifications.add({
        title: 'Unknown method type',
        message: record.method + 'is not supported. Stopping bundle import.',
        level: 'error'
      });
    }
  }

  /**
    Executes the expose method call.
    @param {Object} record The expose record to execute.
    @param {Function} next The method to call to trigger the executor to
      move on to the next record.
  */
  _execute_expose(record, next) {
    // Grab the actual record Id
    const serviceId = record[record.args[0].replace(/^\$/, '')].get('id');
    this.modelAPI.expose(serviceId, null, {});
    next();
  }

  /**
    Executes the addMachines method call.
    @param {Object} record The addMachines record to execute.
    @param {Function} next The method to call to trigger the executor to
      move on to the next record.
  */
  _execute_addMachines(record, next) {
    let parentKey = record.args[0].parentId;
    parentKey = parentKey && parentKey.replace(/^\$/, '');
    let parentId = '';
    if (parentKey) {
      if (parentKey.indexOf('addMachine') > -1) {
        parentId = record[parentKey].id;
      } else if (parentKey.indexOf('addUnit') > -1) {
        // The parentKey can be a specific unit if the lxc was placed on named
        // machine so we need to get the units machine Id to set the parentId.
        // If _saveModelToRequires has already been run, this may refer to a
        // machine; otherwise it can refer to a unit with a 'machine'
        // attribute.
        if (record[parentKey].machine) {
          parentId = record[parentKey].machine;
        } else {
          parentId = record[parentKey].id;
        }
      }
      record.args[0].parentId = parentId;
    }
    if (record.args[0].containerType === 'lxc') {
      record.args[0].containerType = 'lxd';
    }
    // XXX This code is duplicated from scale-up.js:191. We need to create a
    // layer where we create ghosts and handle cleaning them up.
    const params = record.args[0];
    const machine = this.db.machines.addGhost(
      params.parentId,
      params.containerType,
      {series: params.series, constraints: params.constraints}
    );
    this.modelAPI.addMachines(record.args, function(machine) {
      this.db.machines.remove(machine);
    }.bind(this, machine), { modelId: machine.id});
    // Loop through recordSet and add the machine model to every record which
    // requires it.
    this._saveModelToRequires(record.id, machine);
    next(machine);
  }

  /**
    Executes the deploy method call.
    @param {Object} record The deploy record to execute.
    @param {Function} next The method to call to trigger the executor to
      move on to the next record.
  */
  _execute_deploy(record, next) {
    // loop through the args and update the fields which required a previous
    // record to complete.
    record.args.forEach((arg, index) => {
      if (typeof arg === 'string' &&
          arg.indexOf('$') === 0 &&
          arg.split('-').length === 2) {
        const recordId = arg.replace(/^\$/, '');
        const requiredModel = record[recordId];
        switch (index) {
          case 0:
            record.args[0] = requiredModel.get('id');
            break;
        }
      }
    });
    this.charmstore.getEntity(record.args[0],
      (error, charm) => {
        if (error) {
          console.warn('error loading charm: ', error);
          this.db.notifications.add({
            title: 'Unable to load charm',
            message: `Charm ${record.args[0]} was not able to be loaded.`,
            level: 'error'
          });
          return;
        }
        this._deploy_addCharm_success(
          this.makeEntityModel(charm[0]), record, next);
      });
  }

  /**
    Deploy success handler for the bundle import deploy command.
    @param {Object} charm A charm entity instance.
    @param {Object} record The bundle recordset record.
    @param {Function} next The method to call once this command is finished.
  */
  _deploy_addCharm_success(charm, record, next) {
    const charmSeries = charm.get('series');
    // We have to set the name for the service because some bundles
    // specify multiples of the same charms as different names.
    const displayName = record.args[2];
    const ghostService = this.db.services.ghostService(charm, displayName);
    // The service name may have been updated to prevent collisions, so
    // update the record with the new name.
    record.args[2] = ghostService.get('name');
    // If the series is not provided in the recordset returned from the
    // bundle parsing then grab the preferred one from the charm.
    let series = record.args[1];
    if (!series) {
      series = Array.isArray(charmSeries) ? charmSeries[0] : charmSeries;
    }
    ghostService.set('series', series);
    if (record.annotations) {
      ghostService.annotations['gui-x'] = record.annotations['gui-x'];
      ghostService.annotations['gui-y'] = record.annotations['gui-y'];
    }

    // Build a config object for use in creating the ghost service.
    // If config options are provided in the args, use those, fall
    // back to the default if needed.
    const config = {};
    const charmOptions = charm.get('options');
    if (charmOptions) {
      Object.keys(charmOptions).forEach(key => {
        // #2149: Need to be careful; checking for truthy/falsey isn't
        // good enough here, as we want things like empty strings to be
        // applied to the config.
        if (record.args[3][key] !== undefined) {
          config[key] = record.args[3][key];
        } else {
          config[key] = charmOptions[key]['default'];
        }
      });
    }
    ghostService.set('config', config);

    const constraints = record.args[4] || {};
    const deployCallback = function(ghostService, err, applicationName) {
      if (err) {
        this.db.notifications.add({
          title: 'Error deploying ' + applicationName,
          message: 'Could not deploy the requested application. Server ' +
              'responded with: ' + err,
          level: 'error'
        });
        return;
      }
      const name = ghostService.get('name');
      ghostService.setAttrs({
        id: name,
        displayName: undefined,
        pending: false,
        loading: false,
        config: ghostService.get('config'),
        constraints: constraints
      });
      this.modelAPI.update_annotations(
        name, 'application', ghostService.get('annotations'));
    }.bind(this, ghostService);

    const charmURL = charm.get('id');

    // Add the resources to the Juju controller if we have any.
    const charmResources = charm.get('resources');
    if (charmResources) {
      this.modelAPI.addPendingResources({
        applicationName: record.args[2],
        charmURL: charmURL,
        channel: 'stable',
        resources: charmResources
      }, (error, ids) => {
        if (error !== null) {
          this.db.notifications.add({
            title: 'Error adding resources',
            message: `Could not add requested resources for ${charmURL}. `
              + 'Server responded with: ' + error,
            level: 'error'
          });
          return;
        }
        // Store the id map in the application model for use by the ecs
        // during deploy.
        ghostService.set('resourceIds', ids);
      });
    }

    this.modelAPI.deploy({
      charmURL: charmURL,
      applicationName: record.args[2],
      series: series,
      config: record.args[3],
      constraints: constraints
    }, deployCallback, {modelId: ghostService.get('id')});
    this._saveModelToRequires(record.id, ghostService);
    this._collectedServices.push(ghostService);
    next();
  }

  /**
    Executes the addCharm method call.
    @param {Object} record The addCharm record.
    @param {Function} next The method to call to trigger the executor to
      move on to the next record.
  */
  _execute_addCharm(record, next) {
    const db = this.db;
    const charmstore = this.charmstore;
    const notify = msg => {
      db.notifications.add({
        title: 'Unable to load charm',
        message: msg,
        level: 'error'
      });
    };

    charmstore.getCanonicalId(record.args[0], (err, charmId) => {
      if (err) {
        notify(`Invalid charm id: ${record.args[0]}`);
        return;
      }
      charmstore.getEntity(charmId, (error, charmObj) => {
        if (error) {
          notify(`Charm ${charmId} was not able to be loaded.`);
          return;
        }
        const charm = this.makeEntityModel(charmObj[0]);
        if (db.charms.getById(charm.get('id')) === null) {
          // Mark the charm as loaded so that its endpoints get added
          // to the map of available endpoints.
          charm.loaded = true;
          db.charms.add(charm);
        }
        this.modelAPI.addCharm(charmId, charmstore, () => {});
        this._saveModelToRequires(record.id, charm);
        next();
      });
    });
  }

  /**
    Executes the addUnit method call.
    @param {Object} record the addUnit record.
    @param {Function} next The method to call to trigger the executor to
      move on to the next record.
  */
  _execute_addUnit(record, next) {
    let serviceId, charmUrl, size, name;
    // The bundlelib no longer returns the same format as required by the
    // GUI's add_unit modelAPI method so this re-maps the arguments so that
    // they match.
    // If the length is longer than 2 then it's still using the old format
    // which includes the matching args.
    // XXX This can be removed once the bundlelib has been updated across
    // all platforms.
    if (record.args.length === 2) {
      // Move the machine placement to the third argument spot.
      record.args[2] = record.args[1];
      // Set the number of units to one.
      record.args[1] = 1;
    }
    // Loop through the args and update the fields which required a previous
    // record to complete.
    record.args.forEach(function(arg, index) {
      // If the record value is a record key in the format $addMachines-123
      if (typeof arg === 'string' &&
          arg.indexOf('$') === 0 &&
          arg.split('-').length === 2) {
        const recordId = arg.replace(/^\$/, '');
        const requiredModel = record[recordId];
        switch (index) {
          case 0:
            serviceId = requiredModel.get('id');
            record.args[0] = serviceId;
            charmUrl = requiredModel.get('charm');
            size = requiredModel.get('units').size();
            name = requiredModel.get('name') + '/' + size;
            break;
          case 2:
            record.args[2] = requiredModel.id;
            break;
        }
      }
    }, this);
    const unitId = serviceId + '/' + size;
    const ghostUnit = this.db.addUnits({
      id: unitId,
      displayName: name,
      charmUrl: charmUrl,
      subordinate: this.db.charms.getById(charmUrl).get('is_subordinate')
    });
    this._saveModelToRequires(record.id, ghostUnit);
    /**
      Removes the ghost Unit after commit.
      @param {Object} ghostUnit The ghost unit model.
      @param {Object} db The application db.
      @param {Object} e The commit object.
    */
    function removeGhostCallback(ghostUnit, db, e) {
      ghostUnit.service = e.applicationName;
      db.removeUnits(ghostUnit);
    }
    record.args[3] = removeGhostCallback.bind(this, ghostUnit, this.db);
    // If the callback is missing from the recordSet exports we need to add
    // it back in so that we can push the options into the correct argument.
    if (record.args.length === 3) {
      record.args.push(null);
    }
    // Add the ghost model Id to the arguments list for the ECS.
    record.args.push({modelId: unitId});
    this.modelAPI.add_unit.apply(this.modelAPI, record.args);
    // If the unit does not specify a machine, create a new machine.
    if (record.args[2] === null) {
      this._execute_addMachines({
        args: [{}],
        id: record.id
      }, function(machine) {
        record.args[2] = machine.id;
      }.bind(this));
    }
    // Place all units.
    this.modelAPI.placeUnit(ghostUnit, record.args[2]);
    next();
  }

  /**
    Executes the addRelation method call.
    @param {Object} record the addRelation record.
    @param {Function} next The method to call to trigger the executor to
      move on to the next record.
  */
  _execute_addRelation(record, next) {
    const ep1 = record.args[0].split(':');
    const ep2 = record.args[1].split(':');
    const endpoints = [
      [ep1[0], { name: ep1[1] }],
      [ep2[0], { name: ep2[1] }]
    ];
    // Resolve the record indexes to the service names.
    endpoints.forEach(function(ep, index) {
      endpoints[index][0] = record[ep[0].replace(/^\$/, '')].get('id');
    }, this);

    // Create the pending relation id with a combination of the interfaces
    // and unique app names to avoid conflicts. The app names will have
    // already been updated where there are multiple services with the same
    // name (e.g. mysql will become mysql-a).
    const relationId = 'pending-' + record.args[0] + endpoints[0][0] +
      record.args[1] + endpoints[1][0];
    const pendingRelation = this.db.relations.add({
      relation_id: relationId,
      'interface': endpoints[0][1].name,
      endpoints: endpoints,
      pending: true,
      scope: 'global', // XXX check the charms to see if this is a subordinate
      display_name: 'pending'
    });
    this.modelAPI.add_relation(
      endpoints[0], endpoints[1],
      function(evt) {
        this.db.relations.create({
          relation_id: evt.result.id,
          type: evt.result['interface'],
          endpoints: endpoints,
          pending: false,
          scope: evt.result.scope
        });
        this.db.relations.remove(pendingRelation);
      }.bind(this),
      {modelId: pendingRelation.get('id')});
    next();
  }

  /**
    Executes the setAnnotations method call.
    @param {Object} record The setAnnotations record.
    @param {Function} next The method to trigger the executor to move
      on to the next record.
  */
  _execute_setAnnotations(record, next) {
    if (record.args[1] === 'application' || record.args[1] === 'service') {
      // We currently only support the setting of app annotations.
      const entityName = record[record.args[0].replace(/^\$/, '')].get('id');
      const application = this.db.services.getById(entityName);
      const annotations = record.args[2];
      // If this bundle has been deployed before the new apps will appear
      // exactly on top of the exist ones, so shift them. This won't prevent
      // all overlaps, but will prevent apps being hidden behind others.
      let match = true;
      while (match) {
        match = this.db.services.some(app => {
          const appAnnotations = app.get('annotations');
          if (annotations['gui-x'] === appAnnotations['gui-x'] &&
          annotations['gui-y'] === appAnnotations['gui-y']) {
            return true;
          }
        });
        if (match) {
          const space = 150;
          annotations['gui-x'] = parseInt(annotations['gui-x']) + space;
          annotations['gui-y'] = parseInt(annotations['gui-y']) + space;
        }
      }
      application.set('annotations', annotations);
    }
    next();
  }

}

module.exports = BundleImporter;
