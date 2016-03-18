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
      activeComponent: React.PropTypes.string,
      changeActiveComponent: React.PropTypes.func.isRequired,
      hasCommits: React.PropTypes.bool,
      machines: React.PropTypes.array.isRequired,
      setHasCommits: React.PropTypes.func.isRequired,
      ecsClear: React.PropTypes.func.isRequired
    },

    /**
      Get the current state of the component.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      return {
        autoPlace: !localStorage.getItem('disable-auto-place')
      };
    },

    /**
      Generate the content for the active panel.

      @method _generateActivePanel
      @return {Object} The markup for the panel content.
    */
    _generateActivePanel: function() {
      switch (this.props.activeComponent) {
        case 'summary':
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
    _updateHasCommits: function() {
      var hasCommits = false;
      if (!this.props.hasCommits) {
        this.props.services.forEach(service => {
          if (!service.get('pending')) {
            hasCommits = true;
            return false;
          }
        });
        if (!hasCommits) {
          this.props.machines.forEach(machine => {
            if (machine.commitStatus === 'committed') {
              hasCommits = true;
              return false;
            }
          });
        }
      }
      if (hasCommits) {
        this.props.setHasCommits();
      }
    },

    /**
      Handles calling to clear the ecs and then closing the deployment
      summary.

      @method _summaryClearAction
    */
    _summaryClearAction: function() {
      this.props.ecsClear();
      this.props.changeActiveComponent(null);
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
        this.props.changeActiveComponent(null);
      });
    },

    /**
      Handle closing the summary when the close button is clicked.

      @method _summaryCloseAction
    */
    _summaryCloseAction: function() {
      this.props.changeActiveComponent(null);
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
      this.props.changeActiveComponent(null);
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

    render: function() {
      var activeComponent = this.props.activeComponent;
      var activeChild = this._generateActivePanel();
      var steps = [{
        title: 'Deploy',
        active: activeComponent === 'summary'
      }];
      return (
        <juju.components.DeploymentPanel
          buttons={activeChild && activeChild.buttons}
          closeButtonAction={this._summaryCloseAction}
          steps={steps}
          visible={!!activeComponent}>
          {activeChild && activeChild.component}
        </juju.components.DeploymentPanel>
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
