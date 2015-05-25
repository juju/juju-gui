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

YUI.add('bundle-importer', function(Y) {

  var ns = Y.namespace('juju');

  /**
    Bundle importer class handles importing bundles in YAML and dry-run
    formats from files or over the wire.

    @method BundleImporter
    @constructor
  */
  function BundleImporter(cfg) {
    this.env = cfg.env;
    this.db = cfg.db;
    this.fakebackend = cfg.fakebackend;
    this._dryRunIndex = -1;
  }

  BundleImporter.prototype = {

    /**
      Import a bundle YAML into the current environment.

      @method importBundleYAML
      @param {String} bundleYAML The bundle YAML to deploy.
    */
    importBundleYAML: function(bundleYAML) {
      this.fetchDryRun(bundleYAML, null);
    },

    /**
      Import a the collection of changes identified by the given token into the
      current environment.

      @method importChangesToken
      @param {String} changesToken The token identifying a bundle change set.
    */
    importChangesToken: function(changesToken) {
      this.fetchDryRun(null, changesToken);
    },

    /**
      Import bundle YAML or dry-run file.

      @method importBundleFile
    */
    importBundleFile: function(file) {
      var reader = this._generateFileReader();
      reader.onload = this._fileReaderOnload.bind(this, file);
      reader.readAsText(file);
      return reader; // Not intended for use. Returned for testing.
    },

    /**
      Loops through the dry-run structure.

      @method importBundleDryRun
    */
    importBundleDryRun: function(records) {
      // Sort dry-run records into the correct order.
      this.recordSet = this._sortDryRunRecords(records);
      this._executeDryRun(this.recordSet);
    },

    /**
      Fetch the dry-run output from the Guiserver.

      @method fetchDryRun
      @param {String} bundleYAML The bundle file contents.
      @param {String} changesToken The token identifying a bundle change set.
    */
    fetchDryRun: function(bundleYAML, changesToken) {
      this.env.getChangeSet(
          bundleYAML, changesToken, this._handleFetchDryRun.bind(this));
    },

    /**
      Handles the dry run response.

      @method _handleFetchDryRun
      @param {Object} response The processed response data.
    */
    _handleFetchDryRun: function(response) {
      if (response.err) {
        this.db.notifications.add({
          title: 'Error generating changeSet',
          message: 'There was an error generating the changeSet. See browser' +
              ' console for additional information',
          level: 'error'
        });
        console.error('Response', response);
        return;
      }
      this.importBundleDryRun(response.changeSet);
    },

    /**
      Returns a new instance of FileReader.

      @method _generateFileReader
      @return {Object} An instance of FileReader
    */
    _generateFileReader: function() {
      return new FileReader();
    },

    /**
      On load handler for the FileReader method which handles the importation
      of the bundle files.

      @method _fileReaderOnload
      @param {String} file The filename of the dropped file.
      @param {Object} e The load event from the file load.
    */
    _fileReaderOnload: function(file, e) {
      var data;
      var notifications = this.db.notifications;
      // We support dropping a bundle YAML file and a changeSet JSON file onto
      // the canvas. The JSON file support should only ever be used
      // for when there is no guiserver is available like in sandbox mode.
      var extension = file.name.split('.').pop();
      var result = e.target.result;
      if (extension === 'json') {
        try {
          data = JSON.parse(result);
        } catch (e) {
          notifications.add({
            title: 'Invalid changeset format',
            message: 'The supplied file could not be parsed as JSON.',
            level: 'error'
          });
          return;
        }
        notifications.add({
          title: 'Processing File',
          message: 'Changeset processing started.',
          level: 'important'
        });
        this.importBundleDryRun(data);
      } else if (extension === 'yaml') {
        notifications.add({
          title: 'Processing File',
          message: 'Changeset processing started.',
          level: 'important'
        });
        // result is YAML so we need to fetch the dry run changeset data from
        // the guiserver.
        this.fetchDryRun(result, null);
      }
    },

    /**
      Sorts the dry-run records into the correct order so that we can process
      it top to bottom. Charms, Machines, Services, Units, Relations.

      @method _sortDryRunRecords
      @param {Array} records The dry-run data array.
      @return {Array} A sorted list of records.
    */
    _sortDryRunRecords: function(records) {
      var changeSet = [];
      var count = records.length;
      var record;
      for (var i = 0; i < count; i += 1) {
        record = records[i];
        if (record.requires.length === 0) {
          changeSet.push(record);
          continue;
        }
        /*jshint -W083*/
        record.requires.some(function(recordId) {
          var matched = changeSet.some(function(record) {
            return record.id === recordId ? true : false;
          });
          if (!matched) {
            records.push(record);
            count += 1;
            return false;
          } else {
            // Make sure that we don't have any duplicate records
            var exists = changeSet.some(function(set) {
              if (set.id === record.id) {
                return true;
              }
            });
            if (!exists) {
              changeSet.push(record);
            }
          }
        });
      }
      return changeSet;
    },

    /**
      Loop through the record set and add the model to the records which have
      it as a dependency.

      @method _saveModelToRequires
      @param {String} id The record Id.
      @param {Object} model The model generated from the record execution.
    */
    _saveModelToRequires: function(id, model) {
      this.recordSet.forEach(function(record) {
        record.requires.forEach(function(require) {
          if (require === id) {
            record[id] = model;
          }
        });
      });
    },

    /**
      Executes each record passing the resulting models to records which
      require the parent records data set.

      @method _executeDryRun
      @param {Array} records The list of records in the recordSet.
    */
    _executeDryRun: function(records) {
      if (this._dryRunIndex === records.length - 1) {
        // Done executing the recordSet.
        this.db.notifications.add({
          title: 'Import Complete',
          message: 'ChangeSet import complete.',
          level: 'important'
        });
        this._dryRunIndex = -1;
        return;
      }
      this._dryRunIndex += 1;
      this._executeRecord(records[this._dryRunIndex], records);
    },

    /**
      Executes the supplied record

      @method _executeRecord
      @param {Object} record The record object to execute.
      @param {Array} records The list of records in the recordSet.
    */
    _executeRecord: function(record, records) {
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
    },

    /**
      Executes the addMachines method call.

      @method _execute_addMachines
      @param {Object} record The addMachines record to execute.
      @param {Function} next The method to call to trigger the executor to
        move on to the next record.
    */
    _execute_addMachines: function(record, next) {
      var parentKey = record.args[0].parentId;
      parentKey = parentKey && parentKey.replace(/^\$/, '');
      var parentId = '';
      if (parentKey) {
        if (parentKey.indexOf('addMachine') > -1) {
          parentId = record[parentKey].id;
        } else if (parentKey.indexOf('addUnit') > -1) {
          // The parentKey can be a specific unit if the lxc was placed on named
          // machine so we need to get the units machine Id to set the parentId.
          parentId = record[parentKey].machine;
        }
        record.args[0].parentId = parentId;
      }
      // XXX This code is duplicated from scale-up.js:191. We need to create a
      // layer where we create ghosts and handle cleaning them up.
      var machine = this.db.machines.addGhost(
          record.args[0].parentId, record.args[0].containerType);
      this.env.addMachines(record.args, function(machine) {
        this.db.machines.remove(machine);
      }.bind(this, machine), { modelId: machine.id});
      // Loop through recordSet and add the machine model to every record which
      // requires it.
      this._saveModelToRequires(record.id, machine);
      next();
    },

    /**
      Executes the deploy method call.

      @method _execute_deploy
      @param {Object} record The deploy record to execute.
      @param {Function} next The method to call to trigger the executor to
        move on to the next record.
    */
    _execute_deploy: function(record, next) {
      this.fakebackend._loadCharm(record.args[0], {
        'success': function(charm) {
          var ghostService = this.db.services.ghostService(charm);

          if (record.annotations) {
            ghostService.annotations['gui-x'] = record.annotations['gui-x'];
            ghostService.annotations['gui-y'] = record.annotations['gui-y'];
          }

          var config = {};
          var charmOptions = charm.get('options');
          if (charmOptions) {
            Object.keys(charmOptions).forEach(function(key) {
              var value = charmOptions[key];
              config[key] = value['default'];
            });
          }
          ghostService.set('config', config);

          this.env.deploy(
              record.args[0],
              record.args[1],
              record.args[2],
              undefined, // Config file content.
              0, // Number of units.
              {}, // Constraints.
              null, // toMachine.
              function(ghostService) {
                var name = ghostService.get('name');
                ghostService.setAttrs({
                  id: name,
                  displayName: undefined,
                  pending: false,
                  loading: false,
                  config: ghostService.get('config'),
                  constraints: {}
                });
                this.env.update_annotations(
                    name, 'service', ghostService.get('annotations'));
              }.bind(this, ghostService),
              // Options used by ECS, ignored by environment.
              {modelId: ghostService.get('id')});
          this._saveModelToRequires(record.id, ghostService);
          next();
        }.bind(this),
        'failure': function() {
          this.db.notifications.add({
            title: 'Unable to load charm',
            message: 'Charm ' + record.args[0] + ' was not able to be loaded.',
            level: 'error'
          });
        }
      });
    },

    /**
      Executes the addCharm method call.

      XXX At the moment this simply calls the _loadCharm method on the
      fakebackend because the env doesn't have a addCharm functionality yet.

      @method _execute_addCharm
      @param {Object} record The addCharm record.
      @param {Function} next The method to call to trigger the executor to
        move on to the next record.
    */
    _execute_addCharm: function(record, next) {
      var db = this.db;
      var charmId = record.args[0];
      this.fakebackend._loadCharm(charmId, {
        'success': function(charm) {
          if (db.charms.getById(charm.get('id')) === null) {
            db.charms.add(charm);
          }
          this._saveModelToRequires(record.id, charm);
          next();
        }.bind(this),
        'failure': function() {
          db.notifications.add({
            title: 'Unable to load charm',
            message: 'Charm ' + charmId + ' was not able to be loaded.',
            level: 'error'
          });
        }
      });
    },

    /**
      Executes the addUnit method call.

      @method _execute_addUnit
      @param {Object} record the addUnit record.
      @param {Function} next The method to call to trigger the executor to
        move on to the next record.
    */
    _execute_addUnit: function(record, next) {
      // Loop through the args and update the fields which required a previous
      // record to complete.
      var serviceId, charmUrl, size, name;
      record.args.forEach(function(arg, index) {
        // If the record value is a recod key in the format $addMachines-123
        if (typeof arg === 'string' &&
            arg.indexOf('$') === 0 &&
            arg.split('-').length === 2) {
          var recordId = arg.replace(/^\$/, '');
          var requiredModel = record[recordId];
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
      var unitId = serviceId + '/' + size;
      var ghostUnit = this.db.addUnits({
        id: unitId,
        displayName: name,
        charmUrl: charmUrl,
        subordinate: this.db.charms.getById(charmUrl).get('is_subordinate')
      });
      this._saveModelToRequires(record.id, ghostUnit);
      /**
        Removes the ghost Unit after commit.

        @method removeGhostCallback
        @param {Object} ghostUnit The ghost unit model.
        @param {Object} db The application db.
        @param {Object} e The commit object.
      */
      function removeGhostCallback(ghostUnit, db, e) {
        ghostUnit.service = e.service_name;
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
      this.env.add_unit.apply(this.env, record.args);
      if (record.args[2] !== null) {
        // We only place unit if one is defined. This functionality is up for
        // debate. We may want to automatically place unplaced units in bundles.
        this.env.placeUnit(ghostUnit, record.args[2]);
      }
      next();
    },

    /**
      Executes the addRelation method call.

      @method _execute_addRelation
      @param {Object} record the addRelation record.
      @param {Function} next The method to call to trigger the executor to
        move on to the next record.
    */
    _execute_addRelation: function(record, next) {
      var ep1 = record.args[0].split(':');
      var ep2 = record.args[1].split(':');
      var endpoints = [
        [ep1[0], { name: ep1[1] }],
        [ep2[0], { name: ep2[1] }]
      ];
      // Resolve the record indexes to the service names.
      endpoints.forEach(function(ep, index) {
        endpoints[index][0] = record[ep[0].replace(/^\$/, '')].get('id');
      }, this);

      var relationId = 'pending-' + record.args[0] + record.args[1];
      var relation = this.db.relations.add({
        relation_id: relationId,
        'interface': endpoints[0][1].name,
        endpoints: endpoints,
        pending: true,
        scope: 'global', // XXX check the charms to see if this is a subordinate
        display_name: 'pending'
      });
      this.env.add_relation(
          endpoints[0], endpoints[1],
          function(e) {
            this.db.relations.create({
              relation_id: e.result.id,
              type: e.result['interface'],
              endpoints: endpoints,
              pending: false,
              scope: e.result.scope
            });
          }.bind(this),
          {modelId: relation.get('id')});
      next();
    },

    /**
      Executes the setAnnotations method call

      @method _execute_setAnnotations
      @param {Object} record The setAnnotations record.
      @param {Function} next The method to trigger the executor to move
        on to the next record.
    */
    _execute_setAnnotations: function(record, next) {
      if (record.args[1] === 'service') {
        // We currently only support the setting of service annotations.
        var entityName = record[record.args[0].replace(/^\$/, '')].get('id');
        var service = this.db.services.getById(entityName);
        service.set('annotations', record.args[2]);
      }
      next();
    }

  };

  ns.BundleImporter = BundleImporter;

}, '', {
  requires: [
    'juju-env-go',
    'environment-change-set'
  ]
});
