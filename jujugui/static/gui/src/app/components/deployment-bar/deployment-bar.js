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

YUI.add('deployment-bar', function() {

  juju.components.DeploymentBar = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      changeState: React.PropTypes.func.isRequired,
      currentChangeSet: React.PropTypes.object.isRequired,
      generateChangeDescription: React.PropTypes.func.isRequired,
      hasEntities: React.PropTypes.bool.isRequired,
      modelCommitted: React.PropTypes.bool.isRequired,
      sendAnalytics: React.PropTypes.func.isRequired,
      showInstall: React.PropTypes.bool.isRequired
    },

    previousNotifications: [],

    /**
      Get the current state of the deployment bar.

      @method getInitialState
      @returns {Object} The current state.
    */
    getInitialState: function() {
      return {
        latestChangeDescription: null
      };
    },

    componentWillReceiveProps: function(nextProps) {
      this._updateLatestChange(nextProps.currentChangeSet);
    },

    /**
      Update the state with the latest change if it has changed.

      @method _updateLatestChange
      @param {Object} changeSet The collection of ecs changes.
    */
    _updateLatestChange: function(changeSet) {
      var keys = Object.keys(changeSet);
      var latestChange = keys[keys.length - 1];
      var previousIndex = this.previousNotifications.indexOf(latestChange);
      if (latestChange && previousIndex === -1) {
        var change = changeSet[latestChange];
        this.previousNotifications.push(latestChange);
        this.setState({
          latestChangeDescription: this.props.generateChangeDescription(change)
        });
      }
    },

    /**
      Get the label for the deploy button.

      @method _getDeployButtonLabel
      @returns {String} the label for the deploy button
    */
    _getDeployButtonLabel: function() {
      var label = this.props.modelCommitted ? 'Commit changes'
        : 'Deploy changes';
      return label + ' (' +
        Object.keys(this.props.currentChangeSet).length + ')';
    },

    /**
      Generate the install button if it should be displayed.

      @method _generateInstallButton
      @returns {Object} The install button.
    */
    _generateInstallButton: function() {
      if (!this.props.showInstall) {
        return;
      }
      return (
        <a className="button--inline-neutral"
          href="https://jujucharms.com/get-started"
          target="_blank">
          Install Juju
        </a>);
    },

    /**
      Display the deployment summary when the deploy button is clicked.

      @method _deployAction
    */
    _deployAction: function() {
      this.props.sendAnalytics(
        'Deployment Flow',
        'Button click',
        'deploy'
      );
      this.props.changeState({
        gui: {
          deploy: ''
        }
      });
    },

    render: function() {
      var changeCount = Object.keys(this.props.currentChangeSet).length;
      var deployButton = this._getDeployButtonLabel();
      return (
        <juju.components.Panel
          instanceName="deployment-bar-panel"
          visible={true}>
          <div className="deployment-bar">
            {this._generateInstallButton()}
            <juju.components.DeploymentBarNotification
              change={this.state.latestChangeDescription} />
            <div className="deployment-bar__deploy">
              <juju.components.GenericButton
                action={this._deployAction}
                type="inline-deployment"
                disabled={this.props.acl.isReadOnly() || changeCount === 0}
                title={deployButton} />
            </div>
          </div>
        </juju.components.Panel>
      );
    }
  });

}, '0.1.0', { requires: [
  'deployment-bar-notification',
  'generic-button',
  'panel-component'
]});
