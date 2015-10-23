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

    /**
      Get the current state of the inspector.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      var state = this.generateState(this.props);
      state.hasCommits = false;
      return state;
    },

    /**
      Generates the state for the Deployment view based on the state.

      @method generateState
      @param {Object} nextProps The props which were sent to the component.
      @return {Object} A generated state object which can be passed to setState.
    */
    generateState: function(nextProps) {
      var state = {
        activeComponent: nextProps.activeComponent || 'deployment-bar'
      };
      var hasCommits = this.state ? this.state.hasCommits : false;
      var currentChangeSet = nextProps.currentChangeSet ||
          this.props.currentChangeSet;
      switch (state.activeComponent) {
        case 'deployment-bar':
          var generateChangeDescription = nextProps.generateChangeDescription ||
              this.props.generateChangeDescription;
          state.activeChild = {
            component: <juju.components.DeploymentBar
              hasCommits={hasCommits}
              deployButtonAction={this._barDeployAction}
              generateChangeDescription={generateChangeDescription}
              currentChangeSet={currentChangeSet} />
          };
        break;
        case 'deployment-summary':
          var changeDescriptions = nextProps.changeDescriptions ||
              this.props.changeDescriptions;
          state.activeChild = {
            component: <juju.components.DeploymentSummary
              deployButtonAction={this._summaryDeployAction}
              closeButtonAction={this._summaryCloseAction}
              changeDescriptions={changeDescriptions}
              currentChangeSet={currentChangeSet} />
          };
        break;
      }
      return state;
    },

    componentDidMount: function() {
      this._updateHasCommits();
    },

    componentWillReceiveProps: function(nextProps) {
      this._updateHasCommits();
      this.setState(this.generateState(nextProps));
    },

    /**
      Check if we have an commits.

      @method _updateHasCommits
    */
    _updateHasCommits: function() {
      if (!this.state.hasCommits) {
        var services = this.props.services;
        services.forEach(function(service) {
          if (!service.get('pending')) {
            this.setState({hasCommits: true});
            return false;
          }
        }, this);
      }
    },

    /**
      Handle committing when the deploy button in the bar is clicked.

      @method _barDeployAction
    */
    _barDeployAction: function() {
      this._changeActiveComponent('deployment-summary');
    },

    /**
      Handle committing when the deploy button in the summary is clicked.

      @method _summaryDeployAction
    */
    _summaryDeployAction: function() {
      // The env is already bound to ecsCommit in app.js.
      this.props.ecsCommit();
      this.setState({hasCommits: true});
      this._changeActiveComponent('deployment-bar');
    },

    /**
      Handle closing the summary when the close button is clicked.

      @method _summaryCloseAction
    */
    _summaryCloseAction: function() {
      this._changeActiveComponent('deployment-bar');
    },

    /**
      Change the state to reflect the chosen component.

      @method _changeActiveComponent
      @param {String} newComponent The component to switch to.
    */
    _changeActiveComponent: function(newComponent) {
      var nextProps = this.state;
      nextProps.activeComponent = newComponent;
      this.setState(this.generateState(nextProps));
    },

    render: function() {
      return (
        <div className="deployment-view">
          {this.state.activeChild.component}
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-bar',
    'deployment-summary'
    ]
});
