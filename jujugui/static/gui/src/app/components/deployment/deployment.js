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
      exportEnvironmentFile: React.PropTypes.func.isRequired,
      ecsClear: React.PropTypes.func.isRequired
    },

    /**
      Get the current state of the component.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      var state = {
        hasCommits: false,
        autoPlace: !localStorage.getItem('disable-auto-place')
      };
      return this.generateState(this.props, state);
    },

    /**
      Generates the state for the Deployment view based on the state.

      @method generateState
      @param {Object} nextProps The props which were sent to the component.
      @param {Object} state The provided state properties.
      @return {Object} A generated state object which can be passed to setState.
    */
    generateState: function(nextProps, state) {
      if (!state) {
        state = {};
      }
      state.activeComponent = nextProps.activeComponent || 'deployment-bar';
      var hasCommits = this.state ? this.state.hasCommits : false;
      var currentChangeSet = nextProps.currentChangeSet ||
          this.props.currentChangeSet;
      // We want the value of state.autoPlace if it has been defined, even if
      // the value is false, so check that it is not undefined.
      var autoPlace = state.autoPlace !== undefined ?
          state.autoPlace : this.state.autoPlace;
      switch (state.activeComponent) {
        case 'deployment-bar':
          var generateChangeDescription = nextProps.generateChangeDescription ||
              this.props.generateChangeDescription;
          state.activeChild = {
            component: <juju.components.DeploymentBar
              hasCommits={hasCommits}
              deployButtonAction={this._barDeployAction}
              exportEnvironmentFile={this.props.exportEnvironmentFile}
              renderDragOverNotification={this.props.renderDragOverNotification}
              importBundleFile={this.props.importBundleFile}
              hideDragOverNotification={this.props.hideDragOverNotification}
              generateChangeDescription={generateChangeDescription}
              currentChangeSet={currentChangeSet} />
          };
          break;
        case 'deployment-summary':
          var changeDescriptions = nextProps.changeDescriptions ||
              this.props.changeDescriptions;
          state.activeChild = {
            component: <juju.components.DeploymentSummary
              summaryClearAction={this._summaryClearAction}
              deployButtonAction={this._summaryDeployAction}
              closeButtonAction={this._summaryCloseAction}
              changeDescriptions={changeDescriptions}
              handleViewMachinesClick={this.handleViewMachinesClick}
              handlePlacementChange={this.handlePlacementChange}
              autoPlace={autoPlace}
              getUnplacedUnitCount={this.props.getUnplacedUnitCount} />
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
      Handles calling to clear the ecs and then closing the deployment
      summary.

      @method _summaryClearAction
    */
    _summaryClearAction: function() {
      this.props.ecsClear();
      this._changeActiveComponent('deployment-bar');
    },

    /**
      Handle committing when the deploy button in the summary is clicked.

      @method _summaryDeployAction
    */
    _summaryDeployAction: function() {
      if (this.state.autoPlace) {
        this.props.autoPlaceUnits();
      }
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
      Handle navigating to the machine view.

      @method handleViewMachinesClick
    */
    handleViewMachinesClick: function() {
      this.props.changeState({
        sectionB: {
          component: 'machine',
          metadata: {}
        }
      });
      this._changeActiveComponent('deployment-bar');
    },

    /**
      Handle changes to the placement radio buttons.

      @method handlePlacementChange
      @param {Object} e The click event.
    */
    handlePlacementChange: function(e) {
      this.setState({
        autoPlace: e.currentTarget.getAttribute('data-placement') === 'placed'
      });
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
