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
      ecsClear: React.PropTypes.func.isRequired,
      hasEntities: React.PropTypes.bool.isRequired,
      showInstall: React.PropTypes.bool.isRequired
    },

    /**
      Get the current state of the component.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      return {
        hasCommits: false,
        autoPlace: !localStorage.getItem('disable-auto-place')
      };
    },

    /**
      Generate the content for the active panel.

      @method _generateActivePanel
      @return {Object} The markup for the panel content.
    */
    _generateActivePanel: function() {
      switch (this.state.activeComponent) {
        case 'deployment-summary':
          return {
            component: <juju.components.DeploymentSummary
              changeDescriptions={this.props.changeDescriptions}
              handleViewMachinesClick={this.handleViewMachinesClick}
              handlePlacementChange={this.handlePlacementChange}
              autoPlace={this.state.autoPlace}
              getUnplacedUnitCount={this.props.getUnplacedUnitCount} />,
            buttons: [{
              title: 'Clear changes',
              action: this._summaryClearAction
            }, {
              title: 'Deploy',
              action: this._summaryDeployAction,
              type: 'confirm'
            }]
          };
      }
    },

    componentDidMount: function() {
      this._updateHasCommits();
    },

    componentWillReceiveProps: function(nextProps) {
      this._updateHasCommits();
    },

    /**
      Check if we have any commits.

      @param {Function} callback A function to call once the state has updated.
      @method _updateHasCommits
    */
    _updateHasCommits: function(callback) {
      var hasCommits = false;
      if (!this.state.hasCommits) {
        var services = this.props.services;
        services.forEach(function(service) {
          if (!service.get('pending')) {
            hasCommits = true;
            return false;
          }
        }, this);
      }
      if (hasCommits) {
        // If the callback exists then we always want to call it, but if we're
        // setting the state we want to call it after the state has updated.
        this.setState({hasCommits: true}, callback);
      } else {
        if (callback) {
          callback();
        }
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
      this._changeActiveComponent(null);
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
      this.setState({hasCommits: true}, () => {
        this._changeActiveComponent(null);
      });
    },

    /**
      Handle closing the summary when the close button is clicked.

      @method _summaryCloseAction
    */
    _summaryCloseAction: function() {
      this._changeActiveComponent(null);
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
      this._changeActiveComponent(null);
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
      this.setState({activeComponent: newComponent});
    },

    render: function() {
      var activeComponent = this.state.activeComponent;
      var activeChild = this._generateActivePanel();
      var steps = [{
        title: 'Deploy',
        active: activeComponent === 'deployment-summary'
      }];
      return (
        <div className="deployment-view">
          <juju.components.DeploymentBar
            hasCommits={this.state.hasCommits}
            deployButtonAction={this._barDeployAction}
            exportEnvironmentFile={this.props.exportEnvironmentFile}
            renderDragOverNotification={this.props.renderDragOverNotification}
            importBundleFile={this.props.importBundleFile}
            hasEntities={this.props.hasEntities}
            hideDragOverNotification={this.props.hideDragOverNotification}
            generateChangeDescription={this.props.generateChangeDescription}
            currentChangeSet={this.props.currentChangeSet}
            showInstall={this.props.showInstall} />
          <juju.components.DeploymentPanel
            buttons={activeChild && activeChild.buttons}
            closeButtonAction={this._summaryCloseAction}
            steps={steps}
            visible={!!activeComponent}>
            {activeChild && activeChild.component}
          </juju.components.DeploymentPanel>
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-bar',
    'deployment-panel',
    'deployment-summary'
  ]
});
