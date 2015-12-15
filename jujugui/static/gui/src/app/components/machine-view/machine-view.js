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

YUI.add('machine-view', function() {

  juju.components.MachineView = React.createClass({
    propTypes: {
      autoPlaceUnits: React.PropTypes.func.isRequired,
      createMachine: React.PropTypes.func.isRequired,
      destroyMachines: React.PropTypes.func.isRequired,
      environmentName: React.PropTypes.string.isRequired,
      machines: React.PropTypes.object.isRequired,
      removeUnits: React.PropTypes.func.isRequired,
      services: React.PropTypes.object.isRequired,
      units: React.PropTypes.object.isRequired
    },

    /**
      Get the initial state.

      @method getInitialState
      @returns {String} The intial state.
    */
    getInitialState: function() {
      return {
        selectedMachine: this._getFirstMachineId(this.props.machines),
        showAddMachine: false
      };
    },

    /**
      Called when the component is supplied with new props.

      @method componentWillReceiveProps
      @param {Object} The new props.
    */
    componentWillReceiveProps: function(nextProps) {
      var selectedMachine = this.state.selectedMachine;
      if (selectedMachine) {
        // If the currently selected machine gets deployed the id will be
        // invalid as it will have been assigned a new id, so check that the
        // the machine for the selected id still exists and if not reset it
        // so the first machine gets selected.
        if (!this.props.machines.getById(selectedMachine)) {
          selectedMachine = null;
        }
      }
      if (!selectedMachine) {
        selectedMachine = this._getFirstMachineId(nextProps.machines);
      }
      this.setState({selectedMachine: selectedMachine});
    },

    /**
      Get the id of the first machine.

      @method _getFirstMachine
      @param {Object} machines The list of machines.
      @returns {String} The id of the first machine
    */
    _getFirstMachineId: function(machines) {
      var machineList = machines.filterByParent();
      if (machineList.length === 0) {
        return;
      }
      return machineList[0].id;
    },

    /**
      Handle removing a unit.

      @method _removeUnit
      @param id The unit id.
    */
    _removeUnit: function(id) {
      this.props.removeUnits([id]);
    },

    /**
      Display a list of unplaced units or onboarding.

      @method _generateUnplacedUnits
      @returns {Object} A unit list or onboarding.
    */
    _generateUnplacedUnits: function() {
      var units = this.props.units.filterByMachine();
      if (units.length === 0) {
        var icon;
        var content;
        if (this.props.services.size() === 0) {
          icon = 'add_16';
          content = 'Add services to get started';
        } else {
          icon = 'task-done_16';
          content = 'You have placed all of your units';
        }
        return (
          <div className="machine-view__column-onboarding">
            <juju.components.SvgIcon name={icon}
              size="16" />
            {content}
          </div>);
      }
      var components = [];
      units.forEach((unit) => {
        var service = this.props.services.getById(unit.service);
        components.push(
          <juju.components.MachineViewUnplacedUnit
            key={unit.id}
            icon={service.get('icon') || ''}
            removeUnit={this._removeUnit}
            unit={unit} />);
      });
      return (
        <div>
          <div className="machine-view__auto-place">
            <button onClick={this.props.autoPlaceUnits}>
              Auto place
            </button>
            or manually place
          </div>
          <ul className="machine-view__list">
            {components}
          </ul>
        </div>);
    },

    /**
      Handle selecting a machine.

      @method selectMachine
      @param {String} id The machine id to select.
    */
    selectMachine: function(id) {
      this.setState({selectedMachine: id});
    },

    /**
      Display a list of machines or onboarding.

      @method _generateMachines
      @returns {Object} A list of machines or onboarding.
    */
    _generateMachines: function() {
      var machines = this.props.machines.filterByParent();
      var onboarding;
      if (this.state.showAddMachine) {
        return;
      }
      else if (machines.length === 0) {
        return (
          <div className="machine-view__column-onboarding">
            Use machine view to:
            <ul>
              <li>Create machines</li>
              <li>Create containers</li>
              <li>Customise placement</li>
              <li>Scale up your environment</li>
              <li>Manually place new units</li>
              <li>Collocate services</li>
            </ul>
            <span className="link"
              onClick={this._addMachine}
              role="button"
              tabIndex="0">
              Add machine
            </span>
          </div>);
      } else if (machines.length === 1) {
        onboarding = (
          <div className="machine-view__column-onboarding">
            Drag and drop unplaced units onto your machines and containers to
            customise your deployment.
          </div>);
      }
      var components = [];
      machines.forEach((machine) => {
        components.push(
          <juju.components.MachineViewMachine
            destroyMachines={this.props.destroyMachines}
            key={machine.id}
            machine={machine}
            selected={this.state.selectedMachine === machine.id}
            selectMachine={this.selectMachine}
            services={this.props.services}
            type="machine"
            units={this.props.units} />);
      });
      return (
        <div>
          {onboarding}
          <ul className="machine-view__list">
            {components}
          </ul>
        </div>);
    },

    /**
      Display a list of containers for the selected machine.

      @method _generateContainers
      @returns {Object} A list of machines or onboarding.
    */
    _generateContainers: function() {
      var selectedMachine = this.state.selectedMachine;
      if (!selectedMachine) {
        return;
      }
      var containers = this.props.machines.filterByParent(selectedMachine);
      var machine = this.props.machines.getById(selectedMachine);
      if (!machine) {
        return;
      }
      containers.unshift({
        commitStatus: machine.commitStatus,
        deleted: machine.deleted,
        displayName: 'Root container',
        id: selectedMachine,
        root: true
      });
      var components = [];
      containers.forEach((container) => {
        components.push(
          <juju.components.MachineViewMachine
            destroyMachines={this.props.destroyMachines}
            key={container.id}
            machine={container}
            removeUnit={this._removeUnit}
            services={this.props.services}
            type="container"
            units={this.props.units} />);
      });
      return (
        <ul className="machine-view__list">
          {components}
        </ul>);
    },

    /**
      Handle showing the UI for adding a machine.

      @method _addMachine
    */
    _addMachine: function() {
      this.setState({showAddMachine: true});
    },

    /**
      Handle closing the UI for adding a machine.

      @method _closeAddMachine
    */
    _closeAddMachine: function() {
      this.setState({showAddMachine: false});
    },

    /**
      Generate the UI for adding a machine.

      @method _generateAddMachine
    */
    _generateAddMachine: function() {
      if (!this.state.showAddMachine) {
        return;
      }
      return (
        <juju.components.MachineViewAddMachine
          close={this._closeAddMachine}
          createMachine={this.props.createMachine} />);
    },

    /**
      Handle showing the UI for adding a container.

      @method _addContainer
    */
    _addContainer: function() {
      if (this.state.selectedMachine) {
        this.setState({showAddContainer: true});
      }
    },

    /**
      Handle closing the UI for adding a container.

      @method _closeAddContainer
    */
    _closeAddContainer: function() {
      this.setState({showAddContainer: false});
    },

    /**
      Generate the UI for adding a container.

      @method _generateAddContainer
    */
    _generateAddContainer: function() {
      if (!this.state.showAddContainer) {
        return;
      }
      return (
        <juju.components.MachineViewAddMachine
          close={this._closeAddContainer}
          createMachine={this.props.createMachine}
          parentId={this.state.selectedMachine} />);
    },

    /**
      Generate the title for the machine column header.

      @method _generateMachinesTitle
      @returns {String} the machine header title.
    */
    _generateMachinesTitle: function() {
      var machines = this.props.machines.filterByParent();
      return `${this.props.environmentName} (${machines.length})`;
    },

    /**
      Generate the title for the container column header.

      @method _generateContainersTitle
      @returns {String} the container header title.
    */
    _generateContainersTitle: function() {
      var selectedMachine = this.state.selectedMachine;
      var containerCount = 0;
      var unitCount = 0;
      if (selectedMachine) {
        var containers = this.props.machines.filterByParent(selectedMachine);
        var units = this.props.units.filterByMachine(selectedMachine);
        containerCount = containers.length;
        unitCount = units.length;
      }
      var containerPlural = containerCount === 1 ? '' : 's';
      var unitPlural = unitCount === 1 ? '' : 's';
      return `${containerCount} container${containerPlural}, ` +
        `${unitCount} unit${unitPlural}`;
    },

    render: function() {
      var machineMenuItems = [{
        label: 'Add machine',
        action: this._addMachine
      }];
      var containerMenuItems = [{
        label: 'Add container',
        action: this._addContainer
      }];
      return (
        <div className="machine-view">
          <div className="machine-view__content">
            <div className="machine-view__column">
              <juju.components.MachineViewHeader
                title="New units" />
              <div className="machine-view__column-content">
                {this._generateUnplacedUnits()}
              </div>
            </div>
            <div className="machine-view__column machine-view__column--overlap">
              <juju.components.MachineViewHeader
                menuItems={machineMenuItems}
                title={this._generateMachinesTitle()} />
              <div className="machine-view__column-content">
                {this._generateAddMachine()}
                {this._generateMachines()}
              </div>
            </div>
            <div className="machine-view__column">
              <juju.components.MachineViewHeader
                menuItems={containerMenuItems}
                title={this._generateContainersTitle()} />
              <div className="machine-view__column-content">
                {this._generateAddContainer()}
                {this._generateContainers()}
              </div>
            </div>
          </div>
        </div>
      );
    }
  });
}, '0.1.0', {
  requires: [
    'machine-view-add-machine',
    'machine-view-header',
    'machine-view-machine',
    'machine-view-unplaced-unit',
    'svg-icon'
  ]
});
