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

YUI.add('deployment-component', function() {

  juju.components.Deployment = React.createClass({
    propTypes: {
      activeComponent: React.PropTypes.string.isRequired,
      autoPlaceUnits: React.PropTypes.func.isRequired,
      changeCounts: React.PropTypes.object.isRequired,
      changeDescriptions: React.PropTypes.array.isRequired,
      changeState: React.PropTypes.func.isRequired,
      ecsClear: React.PropTypes.func.isRequired,
      ecsCommit: React.PropTypes.func.isRequired,
      getUnplacedUnitCount: React.PropTypes.func.isRequired,
      jem: React.PropTypes.object.isRequired,
      env: React.PropTypes.object.isRequired,
      appSet: React.PropTypes.func.isRequired,
      createSocketURL: React.PropTypes.func.isRequired,
      modelCommitted: React.PropTypes.bool.isRequired,
      modelName: React.PropTypes.string.isRequired,
      numberOfChanges: React.PropTypes.number.isRequired,
      pluralize: React.PropTypes.func.isRequired,
      services: React.PropTypes.array.isRequired,
      user: React.PropTypes.object.isRequired,
      users: React.PropTypes.object.isRequired
    },

    clouds: {
      gcp: {
        id: 'gcp',
        signupUrl: 'https://console.cloud.google.com/billing/freetrial',
        svgHeight: 33,
        svgWidth: 256,
        title: 'Google Compute Engine'
      },
      azure: {
        id: 'azure',
        signupUrl: 'https://azure.microsoft.com/en-us/free/',
        svgHeight: 24,
        svgWidth: 204,
        title: 'Microsoft Azure'
      },
      aws: {
        id: 'aws',
        signupUrl: 'https://portal.aws.amazon.com/gp/aws/developer/' +
        'registration/index.html',
        svgHeight: 48,
        svgWidth: 120,
        title: 'Amazon Web Services'
      }
    },

    _deploymentStorage: {},
    // XXX Hardcoding the controller for now but it will be provided on load
    _controller: 'yellow/aws-us-east',

    /**
      Store information from portions of the deployment for use later down the
      line.

      @method setDeploymentInfo
      @param key The key to store.
      @param value The data to store.
    */
    setDeploymentInfo: function(key, value) {
      this._deploymentStorage[key] = value;
    },

    /**
      Generate the content for the active panel.

      @method _generateActivePanel
      @return {Object} The markup for the panel content.
    */
    _generateActivePanel: function() {
      var activeComponent = this.props.activeComponent;
      switch (activeComponent) {
        case 'summary':
          return (
            <juju.components.DeploymentSummary
              jem={this.props.jem}
              env={this.props.env}
              appSet={this.props.appSet}
              createSocketURL={this.props.createSocketURL}
              deploymentStorage={this._deploymentStorage}
              users={this.props.users}
              autoPlaceUnits={this.props.autoPlaceUnits}
              changeCounts={this.props.changeCounts}
              changeDescriptions={this.props.changeDescriptions}
              changeState={this.props.changeState}
              controller={this._controller}
              ecsClear={this.props.ecsClear}
              ecsCommit={this.props.ecsCommit}
              getUnplacedUnitCount={this.props.getUnplacedUnitCount}
              pluralize={this.props.pluralize}
              modelCommitted={this.props.modelCommitted}
              modelName={this.props.modelName}
              numberOfChanges={this.props.numberOfChanges} />);
        case 'choose-cloud':
          return (
            <juju.components.DeploymentChooseCloud
              jem={this.props.jem}
              changeState={this.props.changeState}
              clouds={this.clouds}
              setDeploymentInfo={this.setDeploymentInfo} />);
        case 'add-credentials-azure':
        case 'add-credentials-aws':
        case 'add-credentials-gcp':
          return (
            <juju.components.DeploymentAddCredentials
              changeState={this.props.changeState}
              controller={this._controller}
              cloud={this.clouds[activeComponent.split('-')[2]]}
              setDeploymentInfo={this.setDeploymentInfo}
              jem={this.props.jem}
              users={this.props.users} />);
      }
    },

    render: function() {
      var activeComponent = this.props.activeComponent;
      var activeChild = this._generateActivePanel();
      var steps = [{
        title: 'Choose cloud',
        component: 'choose-cloud'
      }, {
        title: 'Add credentials',
        component: 'add-credentials-aws'
      }, {
        title: 'Deploy',
        component: 'summary'
      }];
      if (this.props.modelCommitted) {
        // If the model is committed we want to show the commit flow which
        // doesn't have any steps in the header.
        steps = [];
      }
      return (
        <juju.components.DeploymentPanel
          activeComponent={activeComponent}
          changeState={this.props.changeState}
          modelName={this.props.modelName}
          steps={steps}>
          {activeChild}
        </juju.components.DeploymentPanel>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-add-credentials',
    'deployment-choose-cloud',
    'deployment-finalise-account',
    'deployment-panel',
    'deployment-summary'
  ]
});
