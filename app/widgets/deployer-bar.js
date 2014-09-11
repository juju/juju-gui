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
 * Provide the deployer bar view.
 *
 * @module views
 */

YUI.add('deployer-bar', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      Templates = views.Templates,
      bundleHelpers = Y.namespace('juju.BundleHelpers');

  /**
   * The view associated with the deployer bar.
   *
   * @class DeployerBarView
   */
  var DeployerBarView = Y.Base.create('DeployerBarView', Y.View, [
    Y.Event.EventTracker,
    widgets.AutodeployExtension
  ], {
    template: Templates['deployer-bar'],
    summaryTemplate: Templates['deployer-bar-summary'],
    changesTemplate: Templates['deployer-bar-changes'],

    events: {
      '.deploy-button': {
        click: 'showDeployConfirmation'
      },
      '.summary .close': {
        click: 'hideSummary'
      },
      '.changes .close': {
        click: 'clickHideChanges'
      },
      '.cancel-button': {
        click: 'hideSummary'
      },
      '.confirm-button': {
        click: 'deploy'
      },
      '.clear-button': {
        click: 'confirmClear'
      },
      '.clear-no': {
        click: 'cancelClear'
      },
      '.clear-yes': {
        click: 'clear'
      },
      '.action-list .show': {
        click: 'showRecentChanges'
      },
      '.panel.changes .action-list .hide': {
        click: 'clickHideChanges'
      },
      '.panel.summary .changes .toggle': {
        click: '_toggleSummaryChanges'
      },
      '.export': {
        click: '_exportFile'
      },
      '.import': {
        click: '_importFile'
      },
      '.import-file': {
        change: '_deployFile'
      },
      '.action-list .change-mode': {
        click: '_setMode'
      },
      '.view-machines': {
        click: '_viewMachines'
      }
    },

    descriptionTimer: null,

    /**
      Initialize events.

      @method initializer
    */
    initializer: function() {
      this.addEvent(
          this.on('hideChangeDescription', this._hideChangeDescription)
      );
      this._deployed = false;
    },

    /**
     * Destroy any timer left around.
     *
     * @method destructor
     *
     */
    destructor: function() {
      if (this.descriptionTimer) {
        window.clearTimeout(this.descriptionTimer);
      }
    },

    /**
     * Sets up the DOM nodes and renders them to the DOM.
     *
     * @method render
     */
    render: function() {
      var container = this.get('container'),
          ecs = this.get('ecs');
      var changes = this._getChangeCount(ecs);
      container.setHTML(this.template({
        changeCount: changes,
        deployed: this._deployed
      }));
      container.addClass('deployer-bar');
      this._toggleDeployButtonStatus(changes > 0);
      ecs.on('changeSetModified', Y.bind(this.update, this));
      return this;
    },

    /**
      Deploy the current set of environment changes.

      @method deploy
      @param {Object} evt The event object.
    */
    deploy: function(evt) {
      evt.halt();
      var container = this.get('container'),
          ecs = this.get('ecs'),
          autodeploy = container.one('input[value="autodeploy"]');
      if (autodeploy && autodeploy.get('checked')) {
        this._autoPlaceUnits();
      }
      container.removeClass('summary-open');
      ecs.commit(this.get('env'));
      //this.update();
      if (this._deployed === false) {
        this._setDeployed();
      }
    },

    /**
      Set the button state to deployed.

      @method _setDeployed
    */
    _setDeployed: function() {
      this._deployed = true;
      this.get('container').one('.deploy-button').set('text', 'Commit');
    },

    /**
      Confirm clearing staged changes.

      @method confirmClear
      @param {Object} evt The event facade
    */
    confirmClear: function(evt) {
      evt.halt();
      this.get('container').one('.deployed-message').addClass('hidden');
      var container = evt.currentTarget.ancestor();
      container.one('.clear-button').addClass('hidden');
      container.one('.clear-confirm').removeClass('hidden');
    },

    /**
      Cancel clearing staged changes.

      @method cancelClear
      @param {Object} evt The event facade.
    */
    cancelClear: function(evt) {
      evt.halt();
      this.get('container').one('.deployed-message').removeClass('hidden');
      var container = evt.currentTarget.ancestor().ancestor();
      container.one('.clear-button').removeClass('hidden');
      container.one('.clear-confirm').addClass('hidden');
    },

    /**
      Clear the list of changes.

      @method clear
      @param {Object} evt The event facade.
    */
    clear: function(evt) {
      evt.halt();
      var container = this.get('container'),
          ecs = this.get('ecs');
      container.removeClass('summary-open');
      container.one('.deployed-message').removeClass('hidden');
      this.fire('changeState', {
        sectionA: {
          component: null,
          metadata: {id: null}}});
      ecs.clear();
    },

    /**
      Display the recent changes in the summary panel.

      @method showRecentChanges
      @param {Object} evt The event object.
    */
    showRecentChanges: function(evt) {
      evt.halt();
      this._showChanges();
    },

    /**
      Set the display mode.

      @method _setMode
      @param {Object} e The event object.
    */
    _setMode: function(e) {
      var container = this.get('container');
      var existing = container.get('className').split(' ');
      var mode = e.currentTarget.getData('mode');
      // Remove old mode classes.
      existing.forEach(function(className) {
        if (className.indexOf('mode-') === 0) {
          container.removeClass(className);
        }
      });
      container.addClass('mode-' + mode);
    },

    /**
      Display a list of the recent changes.

      @method _showChanges
    */
    _showChanges: function() {
      var container = this.get('container');
      var changesPanel = container.one('.panel.changes section');
      var ecs = this.get('ecs');
      changesPanel.setHTML(this.changesTemplate({
        changeList: this._generateAllChangeDescriptions(ecs)
      }));
      container.addClass('changes-open');
    },

    /**
      Display a summary of the recent changes to confirm deployment

      @method showDeployConfirmation
      @param {Object} evt The event object.
    */
    showDeployConfirmation: function(evt) {
      evt.halt();
      if (this._getChangeCount(this.get('ecs')) > 0) {
        this._showSummary();
      }
    },

    /**
      Display summary information about the current changes.

      @method _showSummary
    */
    _showSummary: function() {
      // Hide the changes panel if it is visible.
      this.hideChanges();
      var container = this.get('container'),
          ecs = this.get('ecs'),
          db = this.get('db'),
          delta = this._getChanges(ecs),
          changes = delta.changes,
          totalUnits = delta.totalUnits,
          unplacedCount = db.units.filterByMachine(null).length;
      if (container && container.get('parentNode')) {
        container.one('.panel.summary section').setHTML(this.summaryTemplate({
          changeCount: this._getChangeCount(ecs),
          latestChangeDescription: '',
          deployServices: changes.deployedServices,
          destroyedServices: changes.destroyedServices,
          addedRelations: changes.addRelations,
          removedRelations: changes.removeRelations,
          addedUnits: changes.addUnits,
          totalUnits: totalUnits,
          removedUnits: changes.removeUnits,
          addedMachines: changes.addMachines,
          destroyedMachines: changes.destroyMachines,
          configsChanged: changes.setConfigs,
          majorChange: this._hasMajorChanges(changes),
          unplacedCount: unplacedCount
        }));
      }
      container.addClass('summary-open');
      container.one('.panel.summary .changes .list').setHTML(
          this.changesTemplate({
            changeList: this._generateAllChangeDescriptions(ecs)
          }));
    },


    /**
       Determines if there are "major" changes in the change set.

       @method _hasMajorChanges
       @param {Object} changes The change set for the summary.
     */
    _hasMajorChanges: function(changes) {
      var hasChange = false;
      Object.keys(changes).forEach(function(change) {
        if (changes[change].length !== 0) {
          hasChange = true;
        }
      });
      return hasChange;
    },

    /**
      Toggle the visibility of the list of changes on the summary panel.

      @method _toggleSummaryChanges
      @param {Object} e The event object.
    */
    _toggleSummaryChanges: function(e) {
      this.get('container').one('.panel.summary .changes').toggleClass('open');
    },

    /**
      Update UI with environment changes.

      @method update
    */
    update: function() {
      var container = this.get('container'),
          ecs = this.get('ecs');
      var changes = this._getChangeCount(ecs);
      // XXX  Tests start to fail on this update without the parent of the
      // container to address. This should be setup in the factory for env
      // and app to be better mocked out to not pick up changes when not
      // wanted.
      if (container && container.get('parentNode')) {
        container.setHTML(this.template({
          // There is no need to update the container with the latest change
          // descriptions: this is done each time the user opens the panel.
          // For now we just need to update the changes count and the button.
          changeCount: changes,
          deployed: this._deployed
        }));
        this._toggleDeployButtonStatus(changes > 0);
        // XXX frankban 2014-05-12: the code below makes the changeset
        // description disappear the first time the panel is visited. Why
        // do we want this? This breaks the user experience, and after removing
        // the line below everything seems to work just fine.
        this.descriptionTimer = window.setTimeout(
            Y.bind(function() { this.fire('hideChangeDescription'); }, this),
            4000);
      }
    },

    /**
      Hide the summary panel.

      @method hideSummary
      @param {Object} evt The event object.
    */
    hideSummary: function(evt) {
      evt.halt();
      var container = this.get('container');
      container.removeClass('summary-open');

      this._toggleDeployButtonStatus(this._getChangeCount(this.get('ecs')) > 0);
    },

    /**
      Click handler for hiding the changes panel.

      @method clickHideChanges
      @param {Object} e The event object.
    */
    clickHideChanges: function(e) {
      e.halt();
      this.hideChanges();
    },

    /**
      Hide the changes panel.

      @method hideChanges
    */
    hideChanges: function() {
      this.get('container').removeClass('changes-open');
    },

    /**
      Hide the changeset description.

      @method _hideChangeDescription
    */
    _hideChangeDescription: function() {
      this.get('container').one('.action-list .change').set('text', '');
      window.clearTimeout(this.descriptionTimer);
    },

    /**
      Return the number of changes in ecs.

      @method getChangeCount
      @param {Object} ecs The environment change set.
    */
    _getChangeCount: function(ecs) {
      return Object.keys(ecs.changeSet).length;
    },

    /**
      Toggle the status of the deploy button.

      @method _toggleDeployButtonStatus
    */
    _toggleDeployButtonStatus: function(enabled) {
      if (enabled) {
        this.get('container').one('.deploy-button').removeClass('disabled');
      } else {
        this.get('container').one('.deploy-button').addClass('disabled');
      }
    },

    /**
      Return the latest change description.

      @method _getLatestChangeDescription
      @param {Object} ecs The environment change set.
    */
    _getLatestChangeDescription: function(ecs) {
      var latest = ecs.changeSet[this._getLatestChange()];
      return this._generateChangeDescription(latest);
    },

    /**
      Return a list of all change descriptions.

      @method _generateAllChangeDescriptions
      @param {Object} ecs The environment change set.
    */
    _generateAllChangeDescriptions: function(ecs) {
      var changes = [],
          change;
      Object.keys(ecs.changeSet).forEach(function(key) {
        change = this._generateChangeDescription(ecs.changeSet[key]);
        if (change) {
          changes.push(change);
        }
      }, this);
      return changes;
    },

    /**
      Return a description of an ecs change for the summary.

      @method _generateChangeDescription
      @param {Object} change The environment change.
      @param {Bool} skipTime optional, used for testing, don't generate time.
    */
    _generateChangeDescription: function(change, skipTime) {
      var changeItem = {};
      var db = this.get('db');

      if (change && change.command) {
        // XXX: The add_unit is just the same as the service because adding
        // the service also adds the unit. We need to look at the UX for
        // units as follow up.
        switch (change.command.method) {
          case '_deploy':
            var ghostService = db.services.getById(
                change.command.options.modelId);
            changeItem.icon = 'changes-service-added';
            changeItem.description = ' ' + ghostService.get('name') +
                ' has been added.';
            break;
          case '_destroyService':
            changeItem.icon = 'changes-service-destroyed';
            changeItem.description = ' ' + change.command.args[0] +
                ' has been destroyed.';
            break;
          case '_add_unit':
            var service = this._getServiceByUnitId(
                change.command.options.modelId);
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
          case '_add_relation':
            var services = this._getRealRelationEndpointNames(
                change.command.args);
            changeItem.icon = 'changes-relation-added';
            changeItem.description = change.command.args[0][1].name +
                ' relation added between ' +
                services[0] + ' and ' + services[1] + '.';
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
            changeItem.icon = 'changes-config-changed';
            changeItem.description = 'Configuration values changed for ' +
                change.command.args[0] + '.';
            break;
          default:
            changeItem.icon = 'changes-service-exposed';
            changeItem.description = 'An unknown change has been made ' +
                'to this enviroment via the CLI.';
            break;
        }
      }
      if (skipTime || !change) {
        changeItem.time = '00:00';
      } else {
        changeItem.time = this._formatAMPM(new Date(change.timestamp));
      }
      return changeItem;
    },

    /**
      Loops through the services in the db to find ones which have id's which
      match the temporary id's assigned to the add realation call.

      @method _getRealRelationEndpointNames
      @param {Array} args The arguments array from the ecs add relations call.
      @return {Array} An array of the service names involved in the relation.
    */
    _getRealRelationEndpointNames: function(args) {
      var services = [],
          serviceId;
      this.get('db').services.each(function(service) {
        serviceId = service.get('id');
        args.forEach(function(arg) {
          if (serviceId === arg[0]) {
            services.push(
                service.get('displayName').replace(/^\(|\)$/g, ''));
          }
        });
      });
      return services;
    },

    /**
      Return the service unitId belongs to.
      Raise an error if the unit is not found.

      @method _getServiceByUnitId
      @param {String} unitId The unit identifier in the database.
      @return {Model} The service model instance.
    */
    _getServiceByUnitId: function(unitId) {
      var db = this.get('db');
      var unit = db.units.getById(unitId);
      if (!unit) {
        // This should never happen in the deployer panel context.
        throw 'unit ' + unitId + ' not found';
      }
      return db.services.getById(unit.service);
    },

    /**
      Return formatted time for display.

      @method _formatAMPM
      @param {Date} date The current date.
    */
    _formatAMPM: function(date) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      var strTime = hours + ':' + minutes + ' ' + ampm;
      return strTime;
    },

    /**
     * Pull out the last change from the changeset to display to the user.
     *
     * @method _getLatestChange
     *
     */
    _getLatestChange: function() {
      var ecs = this.get('ecs');
      var len = Object.keys(ecs.changeSet).length - 1;
      return Object.keys(ecs.changeSet)[len];
    },

    /**
     * Fetch and format the changeSet command records for the deployment
     * summary.
     *
     * @method _getChanges
     * @param {Object} ecs The environment change set.
     */
    _getChanges: function(ecs) {
      var changes = {
        deployedServices: [],
        destroyedServices: [],
        addRelations: [],
        removeRelations: [],
        addUnits: [],
        removeUnits: [],
        addMachines: [],
        destroyMachines: [],
        setConfigs: []
      };
      var db = this.get('db'),
          unitCount = {},
          totalUnits = 0;
      Object.keys(ecs.changeSet).forEach(function(key) {
        var command = ecs.changeSet[key].command,
            args = command.args,
            name, service;
        switch (command.method) {
          case '_deploy':
            service = db.services.getById(command.options.modelId);
            changes.deployedServices.push({
              icon: service.get('icon'),
              name: service.get('name')
            });
            break;
          case '_destroyService':
            service = db.services.getById(args[0]);
            changes.destroyedServices.push({
              icon: service.get('icon'),
              name: service.get('name')
            });
            break;
          case '_add_relation':
            var services = this._getRealRelationEndpointNames(args);
            changes.addRelations.push({
              type: args[0][1].name,
              from: services[0],
              to: services[0]
            });
            break;
          case '_remove_relation':
            changes.removeRelations.push({
              type: args[0][1].name,
              from: args[0][0],
              to: args[1][0]
            });
            break;
          case '_add_unit':
            // This can be either a ghost or a real deployed service.
            service = this._getServiceByUnitId(command.options.modelId);
            // XXX kadams54 2014-08-08: this is a temporary hack right now
            // because the ECS doesn't batch operations. Add 10 units and
            // you'll get 10 log entries with numUnits set to 1. Once
            // numUnits reflects the actual number being added, we can
            // remove this hack.
            name = service.get('name');
            unitCount[name] = unitCount[name] ? unitCount[name] + 1 : 1;
            if (unitCount[name] === 1) {
              changes.addUnits.push({
                icon: service.get('icon'),
                serviceName: name,
                numUnits: args[1]
              });
            }
            break;
          case '_remove_units':
            name = args[0][0].split('/')[0];
            service = db.services.getById(name);
            changes.removeUnits.push({
              icon: service.get('icon'),
              numUnits: args[0].length,
              serviceName: name
            });
            break;
          case '_addMachines':
            /* jshint -W083 */
            args[0].forEach(function(machine) {
              if (!machine.parentId) {
                var constraints = machine.constraints;
                if (constraints) {
                  if (constraints.mem || constraints['cpu-power'] ||
                      constraints['cpu-cores'] || constraints.arch ||
                      constraints.tags || constraints['root-disk']) {
                    machine.someConstraints = true;
                  }
                }
                machine.name = command.options.modelId;
                changes.addMachines.push(machine);
              }
            });
            break;
          case '_destroyMachines':
            args[0].forEach(function(machine) {
              changes.destroyMachines.push({
                name: machine,
                type: machine.indexOf('/') !== -1 ? 'container' : 'machine'
              });
            });
            break;
          case '_set_config':
            name = args[0];
            service = db.services.getById(name);
            // The ecs changes the set config service name to the real name
            // before the services model id has changed to its deploy name.
            // So if no service is found then it's because the name hasn't
            // yet been changed and we need to search through the services
            // for the one which matches.
            if (service === null) {
              db.services.some(function(dbService) {
                if (dbService.get('displayName')
                           .replace(/^\(/, '').replace(/\)$/, '') === name) {
                  service = dbService;
                  return true;
                }
              });
            }
            changes.setConfigs.push({
              icon: service.get('icon'),
              serviceName: name
            });
            break;
        }
      }, this);
      // The total number of units isn't just changes.addUnits.length but
      // but rather a sum of each entry's numUnits field.
      changes.addUnits.forEach(function(u) {
        // XXX kadams54 2014-08-08: this is a temporary hack right now
        // because the ECS doesn't batch operations. Add 10 units and
        // you'll get 10 log entries with numUnits set to 1. Once
        // numUnits reflects the actual number being added, we can
        // remove this hack.
        var name = u.serviceName;
        if (unitCount[name]) {
          u.numUnits = unitCount[name];
        }
        // </hack>

        totalUnits += u.numUnits;
      }, this);
      return {
        changes: changes,
        totalUnits: totalUnits
      };
    },

    /**
      Export the YAML for this environment.

      @method _exportFile
      @param {Object} e The event object.
    */
    _exportFile: function(e) {
      bundleHelpers.exportYAML(this.get('db'));
    },

    /**
      Import a bundle file.

      @method _importFile
      @param {Object} e The event object.
    */
    _importFile: function(e) {
      this.get('container').one('.import-file').getDOMNode().click();
    },

    /**
      Deploy a bundle file.

      @method _deployFile
      @param {Object} e The event object.
    */
    _deployFile: function(e) {
      bundleHelpers.deployBundleFiles(
          e.currentTarget.get('files')._nodes,
          this.get('env'),
          this.get('db')
      );
    },

    /**
      Navigate to the machine view.

      @method _viewMachine
      @param {Object} e The event object.
    */
    _viewMachines: function(e) {
      e.halt();
      this.hideSummary(e);
      this.fire('changeState', {
        sectionB: {
          component: 'machine'
        }
      });
    }

  });

  views.DeployerBarView = DeployerBarView;

}, '0.1.0', {
  requires: [
    'autodeploy-extension',
    'bundle-import-helpers',
    'event-tracker',
    'handlebars',
    'juju-templates',
    'juju-view-utils',
    'node',
    'view'
  ]
});
