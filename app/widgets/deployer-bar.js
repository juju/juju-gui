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
    Y.Event.EventTracker
  ], {
    template: Templates['deployer-bar'],
    changesTemplate: Templates['deployer-bar-changes'],

    events: {
      '.deploy-button': {
        click: 'showDeployConfirmation'
      },
      '.summary .close': {
        click: 'hideSummary'
      },
      '.cancel-button': {
        click: 'hideSummary'
      },
      '.confirm-button': {
        click: 'deploy'
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
        changeCount: changes
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
          ecs = this.get('ecs');
      container.removeClass('summary-open');
      ecs.commit(this.get('env'));
      //this.update();
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
          ecs = this.get('ecs');
      if (container && container.get('parentNode')) {
        container.setHTML(this.template({
          changeCount: this._getChangeCount(ecs),
          latestChangeDescription: '',
          deployServices: this._getDeployedServices(ecs),
          addedRelations: this._getAddRelations(ecs),
          addedUnits: this._getAddUnits(ecs),
          addedMachines: this._getAddMachines(ecs),
          configsChanged: this._getConfigsChanged(ecs)
        }));
      }
      container.addClass('summary-open');
      container.one('.panel.summary .changes .list').setHTML(
          this.changesTemplate({
            changeList: this._generateAllChangeDescriptions(ecs)
          }));
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
      var latest = this._getLatestChangeDescription(ecs);
      // XXX  Tests start to fail on this update without the parent of the
      // container to address. This should be setup in the factory for env
      // and app to be better mocked out to not pick up changes when not
      // wanted.
      if (container && container.get('parentNode')) {
        container.setHTML(this.template({
          changeCount: changes,
          latestChangeDescription: latest
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

      if (change && change.command) {
        // XXX: The add_unit is just the same as the service because adding
        // the service also adds the unit. We need to look at the UX for
        // units as follow up.
        switch (change.command.method) {
          case '_deploy':
            changeItem.icon = 'changes-service-added';
            changeItem.description = ' ' + change.command.args[1] +
                ' has been added.';
            break;
          case '_add_unit':
            changeItem.icon = 'changes-service-added';
            var units = change.command.args[1],
                msg;
            if (units !== 1) {
              msg = 'units have been added.';
            } else {
              msg = 'unit has been added.';
            }
            changeItem.description = ' ' + units + ' ' +
                change.command.args[0] + ' ' + msg;
            break;
          case '_add_relation':
            changeItem.icon = 'changes-relation-added';
            changeItem.description = change.command.args[0][1].name +
                ' relation added between ' +
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
      if (skipTime) {
        changeItem.time = '00:00';
      } else {
        changeItem.time = this._formatAMPM(new Date());
      }
      return changeItem;
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
      Return the URL to the service icon.
      XXX frankban 2014-05-12: use the view helper for icon locating.

      @method _getServiceIconUrl
      @param {String} serviceName The service name.
    */
    _getServiceIconUrl: function(serviceName) {
      var url = 'https://manage.jujucharms.com' +
                '/api/3/charm/precise/{name}/file/icon.svg';
      return Y.Lang.sub(url, {name: serviceName});
    },

    /**
     * Pull out all deployed changes from the changeset to display to the user.
     *
     * @method _getDeployedServices
     * @param {Object} ecs The environment change set.
     */
    _getDeployedServices: function(ecs) {
      var returnSet = [];
      for (var key in ecs.changeSet) {
        if (ecs.changeSet[key]) {
          var command = ecs.changeSet[key].command,
              name = command.args[1];
          if (command.method === '_deploy') {
            var icon = this._getServiceIconUrl(name);
            returnSet.push({icon: icon, name: name});
          }
        }
      }
      return returnSet;
    },

    /**
    * Pull out all relation changes from the changeset to display to the user.
    *
    * @method _getAddRelations
    * @param {Object} ecs The environment change set.
    */
    _getAddRelations: function(ecs) {
      var returnSet = [];
      for (var key in ecs.changeSet) {
        if (ecs.changeSet[key]) {
          var obj = ecs.changeSet[key];
          if (obj.command.method === '_add_relation') {
            var single = {type: ecs.changeSet[key].command.args[0][1].name,
                           from: ecs.changeSet[key].command.args[0][0],
                           to: ecs.changeSet[key].command.args[1][0]};
            returnSet.push(single);
          }
        }
      }
      return returnSet;
    },

    /**
    * Pull out all addUnits changes from the changeset to display to the user.
    *
    * @method _getAddUnits
    * @param {Object} ecs The environment change set.
    */
    _getAddUnits: function(ecs) {
      var returnSet = [];
      for (var key in ecs.changeSet) {
        if (ecs.changeSet[key]) {
          var command = ecs.changeSet[key].command;
          if (command.method === '_add_unit') {
            var serviceName = command.args[0];
            returnSet.push({
              icon: this._getServiceIconUrl(serviceName),
              serviceName: serviceName,
              numUnits: command.args[1]
            });
          }
        }
      }
      return returnSet;
    },

    /**
    * Pull out all addMachines changes from the changeset to display to the
    * user.
    *
    * @method _getAddMachines
    * @param {Object} ecs The environment change set.
    */
    _getAddMachines: function(ecs) {
      var returnSet = [];
      for (var key in ecs.changeSet) {
        if (ecs.changeSet[key]) {
          var command = ecs.changeSet[key].command;
          if (command.method === '_addMachines') {
            /* jshint -W083 */
            command.args[0].forEach(function(machine) {
              returnSet.push(machine);
            });
          }
        }
      }
      return returnSet;
    },

    /**
      Fetches the set_config changes from the ecs changeset to display to the
      user.

      @method _getConfigsChanged
      @param {Object} ecs The environment change set.
      @return {Array} A collection of config changes.
    */
    _getConfigsChanged: function(ecs) {
      var configSet = [],
          command, serviceName;
      Object.keys(ecs.changeSet).forEach(function(key) {
        command = ecs.changeSet[key].command;
        if (command.method === '_set_config') {
          serviceName = command.args[0];
          configSet.push({
            icon: this._getServiceIconUrl(serviceName),
            serviceName: serviceName
          });
        }
      }, this);
      return configSet;
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
    }

  });

  views.DeployerBarView = DeployerBarView;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'bundle-import-helpers',
    'event-tracker',
    'node',
    'observe',
    'handlebars',
    'juju-templates'
  ]
});
