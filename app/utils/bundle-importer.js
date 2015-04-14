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

  // XXX Temp bundle dry run export
  var data = [{
    id: 'addUnit-976',
    method: 'addUnit',
    args: [ '$service-123', 1, '$addMachines-100', null ],
    requires: [
      'service-123', 'addMachines-100'
    ],
    annotations: {
      'gui-x': '-360',
      'gui-y': '66'
    }
  }, {
    id: 'addCharm-321',
    method: 'addCharm',
    args: ['cs:precise/wordpress-27'],
    requires: []
  }, {
    id: 'service-123',
    method: 'deploy',
    args: [
        "cs:precise/wordpress-27", "wordpress",
        {
          "debug": "no", "engine": "nginx",
          "tuning": "single", "wp-content": ""
        },
        null, 0, { }, null, null
      ],
    requires: [
      'addCharm-321'
    ]
  }, {
    id: 'addMachines-100',
    method: 'addMachines',
    args: [
      [{ "constraints": { } }],
      null
    ],
    requires: []
  }];

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
    // XXX Remove me - hack to use local data.
    this.recordSet = data;
  };

  BundleImporter.prototype = {

    /**
      Import a bundle YAML into the current environment.

      @method importBundleYAML
    */
    importBundleYAML: function() {},

    /**
      Import bundle YAML or dry-run files.

      @method importBundleFiles
    */
    importBundleFiles: function() {},

    /**
      Loops through the dry-run structure.

      @method importBundleDryRun
    */
    importBundleDryRun: function(records) {
      // XXX uncomment me when not using local data.
      // this.recordSet = records;
      // Sort dry-run records into the correct order.
      records = this._sortDryRunRecords(this.recordSet);
      this._executeDryRun(records);
    },

    /**
      Fetch the dry-run output from the Deployer.

      @method fetchDryRun
    */
    fetchDryRun: function() {},

    /**
      Sorts the dry-run records into the correct order so that we can process
      it top to bottom. Machines, Services, Units, Relations.

      @method _sortDryRunRecords
      @param {Array} records The dry-run data array.
      @return {Array} A sorted list of records.
    */
    _sortDryRunRecords: function(records) {
      var order = {
        addCharm: 1,
        addMachines: 2,
        deploy: 3,
        addUnit: 4,
        addRelation: 5
      };
      records.sort(function(a, b) {
        return order[a.method] - order[b.method];
      });
      return records;
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
    */
    _executeDryRun: function(records) {
      if (this._dryRunIndex === records.length - 1) {
        // Done executing the recordSet.
        return;
      }
      this._dryRunIndex += 1;
      this._executeRecord(records[this._dryRunIndex], records);
    },

    /**
      Executes the supplied record

      @method _executeRecord
    */
    _executeRecord: function(record, records) {
      var method = this['_execute_' + record.method];
      if (typeof method === 'function') {
        this['_execute_' + record.method](record, this._executeDryRun.bind(this, records));
      } else {
        console.error('Unknown method type: ', record.method);
      }
    },

    /**
      Executes the addMachines method call.

      @method _execute_addMachines
      @param {Object} record The addMachines record to execute.
    */
    _execute_addMachines: function(record, next) {
      // XXX This code is duplicated from scale-up.js:191. We need to create a
      // layer where we create ghosts and handle cleaning them up.
      var machine = this.db.machines.addGhost();
      this.env.addMachines([{
        constraints: {}
      }], function(machine) {
        db.machines.remove(machine);
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
    */
    _execute_deploy: function(record, next) {
      this.fakebackend._loadCharm(record.args[0], {
        success: function(charm) {
          var ghostService = this.db.services.ghostService(charm);

          if (record.annotations) {
            annotations['gui-x'] = record.annotations['gui-x'];
            annotations['gui-y'] = record.annotations['gui-y'];
          }

          var config = {};
          Y.Object.each(charm.get('options'), function(v, k) {
            config[k] = v['default'];
          });
          ghostService.set('config', config);

          this.env.deploy(
              record.args[0],
              record.args[1],
              config,
              undefined, // Config file content.
              0, // Number of units.
              {}, // Constraints.
              null, // toMachine.
              function() {},
              // Options used by ECS, ignored by environment.
              {modelId: ghostService.get('id')});
          this._saveModelToRequires(record.id, ghostService);
          next();
        }.bind(this),
        failure: function() {
          // Create a notification.
        }
      });
    },

    /**
      Executes the addCharm method call.

      XXX At the moment this simply calls the _loadCharm method on the
      fakebackend because the env doesn't have a addCharm functionality yet.

      @method _execute_addCharm
      @param {Object} record The addCharm record.
    */
    _execute_addCharm: function(record, next) {
      this.fakebackend._loadCharm(record.args[0], {
        success: function() {
          next();
        },
        failure: function() {
          // Create a notification.
        }
      });
    },

    _execute_addUnit: function(record, next) {
      // Loop through the args and update the fields which required a previous
      // record to complete.
      var serviceId, charmUrl, size;
      record.args.forEach(function(arg, index) {
        // If the record value is a recod key in the format $addMachines-123
        if (typeof arg === 'string' &&
            arg.indexOf('$') === 0 &&
            arg.split('-').length === 2) {
          var recordId = arg.replace(/^\$/, '');
          var requiredModel = record[recordId];
          switch (index) {
            case 0:
              record.args[0] = requiredModel.get('name');
              serviceId = requiredModel.get('id');
              charmUrl = requiredModel.get('charm');
              size = requiredModel.get('units').size();
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
        displayName: record.args[0] + '/' + size,
        charmUrl: charmUrl,
        //subordinate: charm.get('is_subordinate')
      });
      // Add the ghost model Id to the arguments list for the ECS.
      record.args.push({modelId: unitId});
      this.env.add_unit.apply(this.env, record.args);
      if (record.args[2] !== null) {
        // We only place unit if one is defined. This functionality is up for
        // debate. We may want to automatically place unplaced units in bundles.
        this.env.placeUnit(ghostUnit, record.args[2]);
      }
    }

  };

  ns.BundleImporter = BundleImporter;

}, '', {
  requires: [
    'juju-env-go',
    'environment-change-set'
  ]
});
