/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

YUI.add('deployment-summary', function() {

  juju.components.DeploymentSummary = React.createClass({

    propTypes: {
      jem: React.PropTypes.object.isRequired,
      env: React.PropTypes.object.isRequired,
      appSet: React.PropTypes.func.isRequired,
      changeCounts: React.PropTypes.object.isRequired,
      createSocketURL: React.PropTypes.func.isRequired,
      deploymentStorage: React.PropTypes.object.isRequired,
      users: React.PropTypes.object.isRequired,
      autoPlaceUnits: React.PropTypes.func.isRequired,
      changeDescriptions: React.PropTypes.array.isRequired,
      changeState: React.PropTypes.func.isRequired,
      controller: React.PropTypes.string.isRequired,
      ecsClear: React.PropTypes.func.isRequired,
      ecsCommit: React.PropTypes.func.isRequired,
      getUnplacedUnitCount: React.PropTypes.func.isRequired,
      pluralize: React.PropTypes.func.isRequired,
      modelCommitted: React.PropTypes.bool.isRequired,
      modelName: React.PropTypes.string.isRequired,
      numberOfChanges: React.PropTypes.number.isRequired
    },

    /**
      Holds the onLogin event handler which is attached when
      creating a new model.

      @property _onLoginHandler
      @default {Object} null
    */
    _onLoginHandler: null,

    /**
      If there is a handler listening for the login event to be emitted from
      the env then detach it.

      @method _detachOnLoginhandler
    */
    _detachOnLoginhandler: function() {
      if (this._onLoginHandler) {
        this._onLoginHandler.detach();
        this._onLoginHandler = null;
      }
    },

    /**
      Close the summary.

      @method _close
    */
    _close: function() {
      this.props.changeState({
        sectionC: {
          component: null,
          metadata: {}
        }
      });
    },

    /**
      Handles calling to clear the ecs and then closing the deployment
      summary.

      @method _handleClear
    */
    _handleClear: function() {
      this.props.ecsClear();
      this._close();
    },

    /**
      Navigate to the choose cloud step.

      @method _handleChangeCloud
    */
    _handleChangeCloud: function() {
      this.props.changeState({
        sectionC: {
          component: 'deploy',
          metadata: {
            activeComponent: 'choose-cloud'
          }
        }
      });
    },

    /**
      Handle committing when the deploy button in the summary is clicked.

      @method _handleDeploy
    */
    _handleDeploy: function() {
      // For now every commit will autoplace all units.
      this.props.autoPlaceUnits();
      // If we're in a model which exists then just commit the ecs and return.
      if (this.props.modelCommitted) {
        // The env is already bound to ecsCommit in app.js.
        this.props.ecsCommit();
        this._close();
        return;
      }
      this.props.jem.newModel(
        this.props.users.jem.user,
        this.refs.modelName.value,
        this.props.deploymentStorage.templateName,
        null, // TODO frankban: use a location here.
        this.props.controller, // TODO frankban: remove the controller here.
        (error, data) => {
          if (error) throw error;
          var pathParts = data.hostPorts[0].split(':');
          // Set the credentials in the env so that the GUI
          // is able to connect to the new model.
          this.props.env.setCredentials({
            user: 'user-' + data.user,
            password: data.password
          });
          var socketURL = this.props.createSocketURL(
            pathParts[0], // server
            pathParts[1], // port
            data.uuid
          );
          this.props.appSet('jujuEnvUUID', data.uuid);
          // Set the socket url in both the app and the env so we don't end
          // up with any confusion later on about which is which.
          this.props.appSet('socket_url', socketURL);
          this.props.env.set('socket_url', socketURL);
          this.props.env.connect();
          // If we already have a login handler attached then detach it.
          this._detachOnLoginhandler();
          // After the model connects it will emit a login event, listen
          // for that event so that we know when to commit the changeset.
          this._onLoginHandler = this.props.env.on('login', (data) => {
            this._detachOnLoginhandler();
            // The env is already bound to ecsCommit in app.js.
            this.props.ecsCommit();
            this._close();
          });
        });
    },

    /**
      Handle navigating to the machine view.

      @method _handleViewMachinesClick
    */
    _handleViewMachinesClick: function() {
      this.props.changeState({
        sectionB: {
          component: 'machine',
          metadata: {}
        },
        sectionC: {
          component: null,
          metadata: {}
        }
      });
    },

    /**
      Generate the list of change items.

      @method _generateChangeItems
      @returns {Array} The collection of changes.
    */
    _generateChangeItems: function() {
      var changeList = this.props.changeDescriptions;
      var changes = [];
      changeList.forEach(function(change, i) {
        changes.push(
          <juju.components.DeploymentSummaryChangeItem
            key={i}
            change={change} />
          );
      }, this);
      return changes;
    },

    /**
      Generate a title if there are new services or machines.

      @method _generateTitle
      @returns {Object} The placement markup.
    */
    _generateTitle: function() {
      var changeCounts = this.props.changeCounts;
      var serviceCount = changeCounts['_deploy'] || 0;
      var machineCount = changeCounts['_addMachines'] || 0;
      var pluralize = this.props.pluralize;
      if (serviceCount + machineCount === 0) {
        return;
      }
      return (
        <h3 className="deployment-panel__section-title twelve-col">
          Deploying {serviceCount} {pluralize('service', serviceCount)} on&nbsp;
          {machineCount} {pluralize('machine', machineCount)}
        </h3>);
    },

    /**
      Generate a message if there are unplaced units.

      @method _generatePlacement
      @returns {Object} The placement markup.
    */
    _generatePlacement: function() {
      var unplacedCount = this.props.getUnplacedUnitCount();
      if (unplacedCount === 0) {
        return;
      }
      return (
        <div className="deployment-summary__placement twelve-col">
          <span>
            You have {unplacedCount.toString()} unplaced&nbsp;
            {this.props.pluralize('unit', unplacedCount)},&nbsp;
            {this.props.pluralize('this', unplacedCount, 'these')} will be&nbsp;
            placed onto {this.props.pluralize('a', unplacedCount, '')} new&nbsp;
            {this.props.pluralize('machine', unplacedCount)}. To remove or&nbsp;
            manually place these units use the&nbsp;
          </span>
          <span className="link" tabIndex="0" role="button"
            onClick={this._handleViewMachinesClick}>
            machine view
          </span>.
        </div>);
    },

    /**
      Generate a clear changes control when showing the commit flow.

      @method _generateClearChanges
      @returns {Object} The clear changes control.
    */
    _generateClearChanges: function() {
      var modelCommitted = this.props.modelCommitted;
      // Don't show the clear changes control if we're deploying the model for
      // the first time.
      if (!modelCommitted) {
        return;
      }
      return (
        <span className="link deployment-panel__section-title-link"
          onClick={this._handleClear}
          role="button"
          tabIndex="0">
          Clear all changes&nbsp;&rsaquo;
        </span>);
    },

    componentWillUnmount: function() {
      // We need to be sure we detach the onlogin handler else it will be
      // called every time the event changes trying to close a component
      // which doesn't exist.
      this._detachOnLoginhandler();
    },

    render: function() {
      var listHeaderClassName = 'deployment-summary-change-item ' +
          'deployment-summary__list-header';
      var buttons = [];
      var modelCommitted = this.props.modelCommitted;
      if (!modelCommitted) {
        buttons.push({
          action: this._handleChangeCloud,
          title: 'Change cloud',
          type: 'inline-neutral'
        });
      }
      buttons.push({
        title: modelCommitted ? 'Commit' : 'Deploy',
        action: this._handleDeploy,
        disabled: this.props.numberOfChanges === 0,
        type: 'inline-positive'
      });
      var parts = this.props.deploymentStorage.templateName.split('/');
      var owner = parts[0];
      var name = parts[1];
      var classes = {
        'deployment-summary__changelog': true
      };
      var numberOfChanges = this.props.numberOfChanges;
      return (
        <div className="deployment-panel__child">
          <juju.components.DeploymentPanelContent
            title="Review deployment">
            <form className="six-col last-col">
              <label className="deployment-panel__label"
                htmlFor="model-name">
                Model name
              </label>
              <input className="deployment-panel__input"
                defaultValue={this.props.modelName}
                id="model-name"
                placeholder="test_model_01"
                ref="modelName"
                required="required"
                type="text"
                disabled={!!modelCommitted} />
            </form>
            <div className={'deployment-choose-cloud__cloud-option ' +
              'deployment-summary__cloud-option six-col last-col'}>
              <span className={
                'deployment-choose-cloud__cloud-option-title'}>
                <span className="deployment-choose-cloud__cloud-option-name">
                  {name}
                </span>
                <span className="deployment-choose-cloud__cloud-option-owner">
                  {owner}
                </span>
              </span>
              <form className="deployment-summary__cloud-option-region">
                <label className="deployment-panel__label"
                  htmlFor="region">
                  Region
                </label>
                <input className="deployment-panel__input"
                  id="region"
                  placeholder="us-central1"
                  required="required"
                  type="text" />
              </form>
            </div>
            {this._generateTitle()}
            {this._generatePlacement()}
            <juju.components.ExpandingRow
              classes={classes}>
              <div className="deployment-summary__changelog-title">
                <div className="deployment-summary__changelog-title-chevron">
                  <juju.components.SvgIcon
                    name="chevron_down_16"
                    size="16" />
                </div>
                <span>
                  View complete change log ({numberOfChanges}&nbsp;
                  {this.props.pluralize('change', numberOfChanges)})
                </span>
                {this._generateClearChanges()}
              </div>
              <ul className="deployment-summary__list">
                <li className={listHeaderClassName}>
                  <span className="deployment-summary-change-item__change">
                    Change
                  </span>
                  <span className="deployment-summary-change-item__time">
                    Time
                  </span>
                </li>
                {this._generateChangeItems()}
              </ul>
            </juju.components.ExpandingRow>
          </juju.components.DeploymentPanelContent>
          <juju.components.DeploymentPanelFooter
            buttons={buttons} />
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'deployment-panel-content',
  'deployment-panel-footer',
  'deployment-summary-change-item',
  'expanding-row',
  'svg-icon'
]});
