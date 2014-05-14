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
      Templates = views.Templates;

  /**
   * The view associated with the deployer bar.
   *
   * @class DeployerBarView
   */
  var DeployerBarView = Y.Base.create('DeployerBarView', Y.View, [], {
    template: Templates['deployer-bar'],

    events: {
      '.deploy-button': {
        click: 'showSummary'
      },
      '.summary .close': {
        click: 'hideSummary'
      },
      '.cancel-button': {
        click: 'hideSummary'
      },
      '.confirm-button': {
        click: 'deploy'
      }
    },

    descriptionTimer: null,

    /**
     * Destroy any time left around.
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
      Display a summary of the changeset

      @method showSummary
      @param {Object} evt The event object.
    */
    showSummary: function(evt) {
      evt.halt();
      var container = this.get('container'),
          ecs = this.get('ecs');
      if (container && container.get('parentNode')) {
        container.setHTML(this.template({
          changeCount: this._getChangeCount(ecs),
          latestChangeDescription: '',
          deployServices: this._getDeployedServices(ecs),
          addedRelations: this._getAddRelations(ecs),
          addedUnits: this._getAddUnits(ecs),
          addedMachines: this._getAddMachines(ecs)
        }));
      }

      container.addClass('summary-open');
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
        // XXX frankban 2014-05-12: the code below makes the changeset
        // description disappear the first time the panel is visited. Why
        // do we want this? This breaks the user experience, and after removing
        // the line below everything seems to work just fine.
        this.descriptionTimer = window.setTimeout(
            Y.bind(this._hideChangeDescription, this),
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
      Return the latest change description.

      @method _getChangeDescription
      @param {Object} ecs The environment change set.
    */
    _getLatestChangeDescription: function(ecs) {
      var latest = ecs.changeSet[this._getLatestChange()];
      return this._getChangeDescription(latest, false);
    },

    _getChangeDescription: function(change, forChangeList) {
      var icon,
          description,
          time = null;

      if (change && change.command) {
        // XXX: The add_unit is just the same as the service because adding
        // the service also adds the unit. We need to look at the UX for
        // units as follow up.
        switch (change.command.method) {
          case '_deploy':
            icon = '<i class="sprite service-added"></i>';
            description = change.command.args[1] + ' has been added.';
            break;
          case '_add_unit':
            icon = '<i class="sprite service-added"></i>';
            description = change.command.args[0] + ' has been added.';
            break;
          case '_add_relation':
            icon = '<i class="sprite relation-added"></i>';
            description = change.command.args[0][1].name +
                ' relation added between ' +
                change.command.args[0][0] +
                ' and ' +
                change.command.args[1][0];
            break;
          case '_addMachines':
            var machineType = change.command.args[0][0].parentId ?
                'container' : 'machine';
            icon = '<i class="sprite ' + machineType + '-created01"></i>';
            description = change.command.args[0].length +
                ' ' + machineType +
                (change.command.args[0].length !== 1 ? 's have' : ' has') +
                ' been added.';
            break;
          default:
            icon = '<i class="sprite service-exposed"></i>';
            description = 'An unknown change has been made ' +
                          'to this enviroment via the CLI.';
            break;
        }
      }
      if (icon) {
        time = '<time>' + this._formatAMPM(new Date()) + '</time>';
        return icon + description + time;
      }
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
    }

  });

  views.DeployerBarView = DeployerBarView;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'event-tracker',
    'node',
    'observe',
    'handlebars',
    'juju-templates'
  ]
});
