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
  var DeployerBarView = Y.Base.create('DeployerBarView', Y.View, [
    Y.Event.EventTracker
  ], {
    template: Templates['deployer-bar'],

    events: {
      '.deploy-button': {
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
        change_count: changes
      }));
      container.addClass('deployer-bar');
      Object.observe(ecs.changeSet, Y.bind(this.update, this));
      return this;
    },

    /**
      Deploy the current set of environment changes.

      @method deploy
      @param {Object} evt The event object.
    */
    deploy: function(evt) {
      evt.halt();
      var ecs = this.get('ecs');
      ecs.commit(this.get('env'));
      this.update();
    },
    /**
      Update UI with environment changes.

      @method update
    */
    update: function() {
      var container = this.get('container'),
          ecs = this.get('ecs');
      var changes = this._getChangeCount(ecs);
      var latest = this._getChangeDescription(ecs);
      // XXX  Tests start to fail on this update without the parent of the
      // container to address. This should be setup in the factory for env
      // and app to be better mocked out to not pick up changes when not
      // wanted.
      if (container && container.get('parentNode')) {
        container.setHTML(this.template({
          change_count: changes,
          latest_change_description: latest
        }));
        this.descriptionTimer = window.setTimeout(
            Y.bind(this._hideChangeDesctiption, this),
            2000);
      }
    },
    /**
      return the number of changes in ecs.

      @method getChangeCount
      @param {Object} ect The environment change set.
    */
    _hideChangeDesctiption: function() {
      var container = this.get('container'),
          ecs = this.get('ecs');
      var changes = this._getChangeCount(ecs);
      container.setHTML(this.template({
        change_count: changes,
        latest_change_description: ''
      }));
      window.clearTimeout(this.descriptionTimer);
    },
    /**
      return the number of changes in ecs.

      @method getChangeCount
      @param {Object} ect The environment change set.
    */
    _getChangeCount: function(ecs) {
      return Object.keys(ecs.changeSet).length;
    },
    /**
      return the number of changes in ecs.

      @method getChangeCount
      @param {Object} ect The environment change set.
    */
    _getChangeDescription: function(ecs) {
      var latest = ecs.changeSet[this._getLatestChange()];
      var icon,
          description,
          time = null;

      if (latest && latest.command) {
        switch (latest.command.method) {
          case '_deploy':
            icon = '<i class="sprite service-added"></i>';
            description = latest.command.args[1] + ' has been added.';
            break;
          case '_add_relation':
            icon = '<i class="sprite relation-added"></i>';
            description = latest.command.args[0][1].name +
                ' relation added between ' +
                latest.command.args[0][0] +
                ' and ' +
                latest.command.args[1][0];
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
      return formatted time for display.

      @method _formatAMPM
      @param {Date} the current date.
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
