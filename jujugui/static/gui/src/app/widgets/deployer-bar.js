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
      changesUtils = new Y.juju.ChangesUtils(),
      bundleHelpers = Y.namespace('juju.BundleHelpers');

  var removeBrackets = /^\(?(.{0,}?)\)?$/;

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
      '.deploy-button:not(.disabled)': {
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
        click: 'exportFile'
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
      },
      '.resolve-conflict': {
        click: '_showInspectorConfig'
      },
      '.commit-onboarding .close': {
        click: '_hideCommitOnboarding'
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
      // Used to track if the user has deployed at least once.
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
      ecs.on('currentCommitFinished', Y.bind(this.notifyCommitFinished, this));
      return this;
    },

    /**
      Deploy the current set of environment changes.

      @method deploy
      @param {Object} evt The event object.
    */
    deploy: function(evt) {
      this.fire('changeState', {
        sectionA: {
          component: null,
          metadata: {id: null}}});
      if (evt && typeof evt.halt === 'function') {
        evt.halt();
      }
      var container = this.get('container'),
          ecs = this.get('ecs'),
          autodeploy = container.one('input[value="autodeploy"]');
      if (autodeploy && autodeploy.get('checked')) {
        this._autoPlaceUnits();
      }
      container.removeClass('summary-open');
      ecs.commit(this.get('env'));
      this._toggleDeployButtonStatus(false);
      if (this._deployed === false) {
        this._deployed = true;
      }
    },

    /**
      Confirm clearing staged changes.

      @method confirmClear
      @param {Object} evt The event facade
    */
    confirmClear: function(evt) {
      evt.halt();
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
      var db = this.get('db');
      changesPanel.setHTML(this.changesTemplate({
        changeList: changesUtils.generateAllChangeDescriptions(
            ecs.getCurrentChangeSet(), db.services, db.units)
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
      this._hideCommitOnboarding();
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
          delta = this._getChanges(
              ecs.getCurrentChangeSet(), db.services, db.units),
          changes = delta.changes,
          totalUnits = delta.totalUnits,
          unplacedUnits = db.units.filterByMachine(null);
      // We need to filter the unplaced units down so that we can exclude ones
      // which are subordinates.
      var unplacedCount = unplacedUnits.filter(function(unit) {
        return !db.services.getById(unit.service).get('subordinate');
      }).length;

      var conflictedServices = [];
      db.services.each(function(service) {
        if (service.get('_conflictedFields').length > 0) {
          conflictedServices.push(service.getAttrs());
        }
      });

      if (container && container.get('parentNode')) {
        container.one('.panel.summary section').setHTML(this.summaryTemplate({
          // Set the auto place option based on the user's in-browser settings.
          autoPlaceDefault: localStorage.getItem('auto-place-default'),
          changeCount: this._getChangeCount(ecs),
          changeNotification: '',
          deployServices: changes.deployedServices,
          destroyedServices: changes.destroyedServices,
          addedRelations: changes.addRelations,
          removedRelations: changes.removeRelations,
          addedUnits: changes.addUnits,
          totalUnits: totalUnits,
          removedUnits: changes.removeUnits,
          exposed: changes.exposed,
          unexposed: changes.unexposed,
          addedMachines: changes.addMachines,
          destroyedMachines: changes.destroyMachines,
          configsChanged: changes.setConfigs,
          majorChange: this._hasMajorChanges(changes),
          unplacedCount: unplacedCount,
          conflictedServiceCount: conflictedServices.length,
          conflictedServices: conflictedServices
        }));
      }
      container.addClass('summary-open');
      container.one('.panel.summary .changes .list').setHTML(
          this.changesTemplate({
            changeList: changesUtils.generateAllChangeDescriptions(
                ecs.getCurrentChangeSet(), db.services, db.units)
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
      var changeNotification = this._getChangeNotification(ecs);
      // XXX  Tests start to fail on this update without the parent of the
      // container to address. This should be setup in the factory for env
      // and app to be better mocked out to not pick up changes when not
      // wanted.
      if (container && container.get('parentNode')) {
        container.setHTML(this.template({
          changeCount: changes,
          changeNotification: changeNotification,
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
      Notify the user that a change-set commit has completed.

      @method notifyCommitFinished
    */
    notifyCommitFinished: function(evt) {
      var db = this.get('db');
      db.notifications.add({
        title: 'Changes completed commit: #' + evt.index,
        message: 'All requested changes for commit #' + evt.index +
            ' have been sent to Juju and committed.',
        level: 'important'
      });
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
      Close the panel.

      @method close
    */
    close: function() {
      var container = this.get('container');
      container.removeClass('changes-open');
      container.removeClass('summary-open');
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
      return Object.keys(ecs.getCurrentChangeSet()).length;
    },

    /**
      Toggle the status of the deploy button.

      @method _toggleDeployButtonStatus
      @param {Boolean} enabled Whether the commit button should be active.
    */
    _toggleDeployButtonStatus: function(enabled) {
      if (enabled) {
        this._showCommitOnboarding();
        this.get('container').one('.deploy-button').removeClass('disabled');
      } else {
        this.get('container').one('.deploy-button').addClass('disabled');
      }
    },

    /**
      Return the latest change description.

      @method _getChangeNotification
      @param {Object} ecs The environment change set.
    */
    _getChangeNotification: function(ecs) {
      var latest = ecs.getCurrentChangeSet()[this._getLatestChange()];
      var db = this.get('db');
      return changesUtils.generateChangeDescription(
          latest, db.services, db.units);
    },

    /**
     * Pull out the last change from the changeset to display to the user.
     *
     * @method _getLatestChange
     *
     */
    _getLatestChange: function() {
      var ecs = this.get('ecs'),
          changeSet = ecs.getCurrentChangeSet();
      var len = Object.keys(changeSet).length - 1;
      return Object.keys(changeSet)[len];
    },


    /**
     * Fetch and format the changeSet command records for the deployment
     * summary.
     *
     * @method _getChanges
     * @param {Object} services The list of services from the db.
     * @param {Object} units The list of units from the db.
     * @param {Object} changeSet The current environment change set.
     */
    _getChanges: function(changeSet, services, units) {
      var changes = {
        deployedServices: [],
        destroyedServices: [],
        addRelations: [],
        removeRelations: [],
        addUnits: [],
        removeUnits: [],
        exposed: [],
        unexposed: [],
        addMachines: [],
        destroyMachines: [],
        setConfigs: []
      };
      var unitCount = {},
          totalUnits = 0;
      Object.keys(changeSet).forEach(function(key) {
        var command = changeSet[key].command,
            args = command.args,
            name, service;
        switch (command.method) {
          case '_deploy':
            service = services.getById(command.options.modelId);
            changes.deployedServices.push({
              icon: service.get('icon'),
              name: service.get('name')
            });
            break;
          case '_destroyService':
            service = services.getById(args[0]);
            changes.destroyedServices.push({
              icon: service.get('icon'),
              name: service.get('name')
            });
            break;
          case '_add_relation':
            var serviceList = changesUtils.getRealRelationEndpointNames(
                args, services);
            changes.addRelations.push({
              type: args[0][1].name,
              from: serviceList[0],
              to: serviceList[1]
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
            service = changesUtils.getServiceByUnitId(
                command.options.modelId, services, units);
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
            service = services.getById(name);
            changes.removeUnits.push({
              icon: service.get('icon'),
              numUnits: args[0].length,
              serviceName: name
            });
            break;
          case '_expose':
            changes.exposed.push({
              icon: services.getById(args[0]).get('icon'),
              serviceName: args[0]
            });
            break;
          case '_unexpose':
            changes.unexposed.push({
              icon: services.getById(args[0]).get('icon'),
              serviceName: args[0]
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
            service = services.getById(name);
            // The ecs changes the set config service name to the real name
            // before the services model id has changed to its deploy name.
            // So if no service is found then it's because the name hasn't
            // yet been changed and we need to search through the services
            // for the one which matches.
            if (service === null) {
              services.some(function(dbService) {
                if (dbService.get('displayName')
                           .replace(/^\(/, '').replace(/\)$/, '') === name) {
                  service = dbService;
                  return true;
                }
              });
            }
            // If the service is pending then the name will be the temp id.
            if (service.get('pending')) {
              name = service.get('displayName').match(removeBrackets)[1];
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

      @method exportFile
    */
    exportFile: function() {
      this._exportFile();
    },

    /**
      Export the YAML for this environment.

      @method _exportFile
    */
    _exportFile: function() {
      var result = this.get('db').exportDeployer();
      var exportData = jsyaml.dump(result);
      // In order to support Safari 7 the type of this blob needs
      // to be text/plain instead of it's actual type of application/yaml.
      var exportBlob = new Blob([exportData],
          {type: 'text/plain;charset=utf-8'});
      saveAs(exportBlob, 'bundle.yaml');
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
      this.get('bundleImporter').importBundleFile(
          e.currentTarget.get('files')._nodes[0]);
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
    },

    /**
      Closes the summary and opens the inspector that the user clicked on to
      resolve config conflicts.

      @method _showInspectorconfig
      @param {Object} e The click event facade.
    */
    _showInspectorConfig: function(e) {
      e.halt();
      this.hideSummary(e);
      this.fire('changeState', {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: e.currentTarget.getAttribute('service')
          }
        }
      });
    },

    /**
      Optionally show the onboarding message for the commit button.

      @method _showCommitOnboarding
    */
    _showCommitOnboarding: function() {
      if (localStorage.getItem('commit-onboarding') !== 'dismissed') {
        this.get('container').one('.commit-onboarding').removeClass('hidden');
      }
    },

    /**
      Hide the onboarding message for the commit button.

      @method _hideCommitOnboarding
      @param {Object} e The event object.
    */
    _hideCommitOnboarding: function(e) {
      if (e) {
        e.halt();
      }
      localStorage.setItem('commit-onboarding', 'dismissed');
      this.get('container').one('.commit-onboarding').addClass('hidden');
    }

  });

  views.DeployerBarView = DeployerBarView;

}, '0.1.0', {
  requires: [
    'autodeploy-extension',
    'changes-utils',
    'event-tracker',
    'handlebars',
    'juju-templates',
    'juju-view-utils',
    'node',
    'view'
  ]
});
