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

  var MachineView = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addGhostAndEcsUnits: React.PropTypes.func.isRequired,
      autoPlaceUnits: React.PropTypes.func.isRequired,
      changeState: React.PropTypes.func.isRequired,
      createMachine: React.PropTypes.func.isRequired,
      destroyMachines: React.PropTypes.func.isRequired,
      environmentName: React.PropTypes.string.isRequired,
      machines: React.PropTypes.object.isRequired,
      placeUnit: React.PropTypes.func.isRequired,
      providerType: React.PropTypes.string,
      removeUnits: React.PropTypes.func.isRequired,
      series: React.PropTypes.array,
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
        containerSort: 'name',
        machineSort: 'name',
        placingUnit: null,
        selectedMachine: this._getFirstMachineId(this.props.machines),
        showAddMachine: false,
        showConstraints: true,
        showScaleUp: false
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
      Handle dropping a unit.

      @method _dropUnit
      @param {Object} unit The unit that was dropped.
      @param {String} machine The machine id that the unit dropped onto.
    */
    _dropUnit: function(unit, machine, newType) {
      if (machine) {
        this.props.placeUnit(unit, machine);
      } else {
        var state = {};
        if (newType === 'machine') {
          state.showAddMachine = true;
        } else {
          state.showAddContainer = true;
        }
        state.placingUnit = unit;
        this.setState(state);
      }
    },

    /**
      Handle opening the store.

      @method _openStore
    */
    _openStore: function() {
      this.props.changeState({store: ''});
    },

    /**
      Display a list of unplaced units or onboarding.

      @method _generateUnplacedUnits
      @returns {Object} A unit list or onboarding.
    */
    _generateUnplacedUnits: function() {
      const props = this.props;
      let units = props.units.filterByMachine();
      units = units.filter((unit) => {
        const service = props.services.getById(unit.service);
        if (!service.get('subordinate')) {
          return unit;
        }
      });
      if (units.length === 0) {
        var icon;
        var content;
        if (props.services.size() === 0) {
          icon = 'add_16';
          content = (
            <span className="link"
              onClick={this._openStore}>
              Add applications to get started
            </span>
        );
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
      const components = [];
      const state = this.state;
      let placingUnit;
      if (state.showAddMachine || state.showAddContainer) {
        placingUnit = state.placingUnit;
      }
      units.forEach((unit) => {
        const service = props.services.getById(unit.service);
        if (placingUnit && unit.id === placingUnit.id) {
          return;
        }
        components.push(
          <juju.components.MachineViewUnplacedUnit
            acl={props.acl}
            createMachine={props.createMachine}
            icon={service.get('icon') || ''}
            key={unit.id}
            machines={props.machines}
            placeUnit={props.placeUnit}
            providerType={props.providerType}
            removeUnit={this._removeUnit}
            selectMachine={this.selectMachine}
            series={props.series}
            unit={unit}
          />
        );
      });
      return (
        <div>
          <div className="machine-view__auto-place">
            <juju.components.GenericButton
              action={props.autoPlaceUnits}
              disabled={props.acl.isReadOnly()}
              type="inline-neutral"
              title="Auto place" />
            or manually place
          </div>
          <ul className="machine-view__list">
            {components}
          </ul>
        </div>
      );
    },

    /**
      Display the scale up form.

      @method _generateScaleUp
      @returns {Object} The scale up component.
    */
    _generateScaleUp: function() {
      if (!this.state.showScaleUp) {
        return;
      }
      return (
        <juju.components.MachineViewScaleUp
          acl={this.props.acl}
          addGhostAndEcsUnits={this.props.addGhostAndEcsUnits}
          services={this.props.services}
          toggleScaleUp={this._toggleScaleUp} />);
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
      var machineList = this.props.machines.filterByParent();
      var machines = this._sortMachines(machineList, this.state.machineSort);
      var onboarding;
      if (this.state.showAddMachine) {
        return;
      }
      else if (machines.length === 0) {
        return (
          <div className="machine-view__column-onboarding">
            <p>Use machine view to:</p>
            <ul>
              <li>Create machines</li>
              <li>Create containers</li>
              <li>Customise placement</li>
              <li>Scale up your model</li>
              <li>Manually place new units</li>
              <li>Collocate applications</li>
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
        var selectedMachine = this.state.selectedMachine;
        components.push(
          <juju.components.MachineViewMachine
            acl={this.props.acl}
            destroyMachines={this.props.destroyMachines}
            dropUnit={this._dropUnit}
            key={machine.id}
            machine={machine}
            selected={selectedMachine === machine.id}
            selectMachine={this.selectMachine}
            services={this.props.services}
            showConstraints={
              this.state.showConstraints || machine.id === selectedMachine}
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
      var containerList = this.props.machines.filterByParent(selectedMachine);
      var containers = this._sortMachines(
        containerList, this.state.containerSort);
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
            acl={this.props.acl}
            destroyMachines={this.props.destroyMachines}
            dropUnit={this._dropUnit}
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
      this.setState({
        placingUnit: null,
        showAddMachine: false
      });
    },

    /**
      Generate the UI for adding a machine.

      @method _generateAddMachine
    */
    _generateAddMachine: function() {
      if (!this.state.showAddMachine) {
        return;
      }
      const props = this.props;
      return (
        <juju.components.MachineViewAddMachine
          acl={props.acl}
          close={this._closeAddMachine}
          createMachine={props.createMachine}
          placeUnit={props.placeUnit}
          providerType={props.providerType}
          selectMachine={this.selectMachine}
          series={props.series}
          unit={this.state.placingUnit}
        />
      );
    },

    /**
      Handle showing the UI for adding a container.

      @method _addContainer
    */
    _addContainer: function() {
      var selectedMachine = this.state.selectedMachine;
      var deleted = false;
      if (selectedMachine) {
        var machine = this.props.machines.getById(selectedMachine);
        deleted = machine.deleted;
      }
      if (this.state.selectedMachine && !deleted) {
        this.setState({showAddContainer: true});
      }
    },

    /**
      Handle closing the UI for adding a container.

      @method _closeAddContainer
    */
    _closeAddContainer: function() {
      this.setState({
        placingUnit: null,
        showAddContainer: false
      });
    },

    /**
      Generate the UI for adding a container.

      @method _generateAddContainer
    */
    _generateAddContainer: function() {
      if (!this.state.showAddContainer) {
        return;
      }
      const props = this.props;
      return (
        <juju.components.MachineViewAddMachine
          acl={props.acl}
          close={this._closeAddContainer}
          createMachine={props.createMachine}
          parentId={this.state.selectedMachine}
          placeUnit={props.placeUnit}
          providerType={props.providerType}
          series={props.series}
          unit={this.state.placingUnit}
        />
      );
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
      Toggle the visibililty of the constraints on machines.

      @method _toggleConstraints
    */
    _toggleConstraints: function() {
      this.setState({showConstraints: !this.state.showConstraints});
    },

    /**
      Toggle the visibililty of the service scale up.

      @method _toggleScaleUp
    */
    _toggleScaleUp: function() {
      this.setState({showScaleUp: !this.state.showScaleUp});
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

    /**
      Sort the machines.

      @method _sortMachines
      @param {Array} machines A list of machines.
      @param {String} method The sort method.
      @returns {Array} A sorted list of machines
    */
    _sortMachines: function(machines, method) {
      var sortMethod = this._getSortMethod(method);
      return machines.sort(function (a, b) {
        var sortedA = sortMethod(a);
        var sortedB = sortMethod(b);
        if (sortedA == sortedB) {
          return 0;
        } else if (sortedA > sortedB) {
          return 1;
        } else if (sortedA < sortedB) {
          return -1;
        }
      });
    },

    /**
      Set the sort method to the given method.

      @method _setSortMethod
      @param {String} sort The sort method.
      @param {Boolean} sortContainers Whether to sort containers.
    */
    _setSortMethod: function(sort, sortContainers) {
      var state = {};
      if (sortContainers) {
        state.containerSort = sort;
      } else {
        state.machineSort = sort;
      }
      this.setState(state);
    },

    /**
       Get the sort method for the given sort type.

       @method _getSortMethod
       @param {String} sort The sort type.
       @return {Function} The sorting method function.
     */
    _getSortMethod: function(sort) {
      var sortMethod;
      var weight = 0;
      var units = this.props.units;
      switch (sort) {
        case 'units':
          sortMethod = function(model) {
            var unitList = units.filterByMachine(model.id);
            if (unitList) {
              weight = unitList.length;
            }
            return -weight;
          };
          break;
        case 'name':
          sortMethod = function(model) {
            // A fairly arbitrary string length to pad out the strings
            // to. If there are sort issues, try increasing this value.
            var maxLength = 50;
            var name = model.displayName;
            // Pad the string out to our max value so that the numbers
            // inside the strings sort correctly.
            for (var i = 0; i < maxLength - name.length; i += 1) {
              name = '0' + name;
            }
            return name;
          };
          break;
        case 'disk':
          sortMethod = function(model) {
            if (model.hardware) {
              weight = model.hardware.disk;
            }
            return -weight;
          };
          break;
        case 'ram':
          sortMethod = function(model) {
            if (model.hardware) {
              weight = model.hardware.mem;
            }
            return -weight;
          };
          break;
        case 'cpu':
          sortMethod = function(model) {
            if (model.hardware) {
              weight = model.hardware.cpuPower;
            }
            return -weight;
          };
          break;
        case 'application':
          sortMethod = function(model) {
            var unitList = units.filterByMachine(model.id);
            if (unitList) {
              var services = {};
              unitList.forEach(function(unit) {
                services[unit.service] = true;
              });
              weight = Object.keys(services);
            }
            return weight;
          };
          break;
        case 'applications':
          sortMethod = function(model) {
            var unitList = units.filterByMachine(model.id);
            if (unitList) {
              var services = {};
              unitList.forEach(function(unit) {
                services[unit.service] = true;
              });
              weight = Object.keys(services).length;
            }
            return -weight;
          };
          break;
        case 'size':
          sortMethod = function(model) {
            if (model.hardware) {
              weight = model.hardware.mem + model.hardware.disk;
            }
            return -weight;
          };
          break;
      }
      return sortMethod;
    },

    render: function() {
      var isReadOnly = this.props.acl.isReadOnly();
      var machineMenuItems = [{
        label: 'Add machine',
        action: !isReadOnly && this._addMachine
      }, {
        label: this.state.showConstraints ?
          'Hide constraints' : 'Show constaints',
        action: this._toggleConstraints
      }, {
        label: 'Sort by:'
      }, {
        label: 'Name',
        id: 'name',
        action: this._setSortMethod.bind(this, 'name')
      }, {
        label: 'No. applications',
        id: 'applications',
        action: this._setSortMethod.bind(this, 'applications')
      }, {
        label: 'No. units',
        id: 'units',
        action: this._setSortMethod.bind(this, 'units')
      }, {
        label: 'Disk',
        id: 'disk',
        action: this._setSortMethod.bind(this, 'disk')
      }, {
        label: 'RAM',
        id: 'ram',
        action: this._setSortMethod.bind(this, 'ram')
      }, {
        label: 'CPU',
        id: 'cpu',
        action: this._setSortMethod.bind(this, 'cpu')
      }];
      var containerMenuItems = [{
        label: 'Add container',
        action: !isReadOnly && (
          this.state.selectedMachine ? this._addContainer : null)
      }, {
        label: 'Sort by:'
      }, {
        label: 'Name',
        id: 'name',
        action: this._setSortMethod.bind(this, 'name', true)
      }, {
        label: 'No. units',
        id: 'units',
        action: this._setSortMethod.bind(this, 'units', true)
      }, {
        label: 'Applications',
        id: 'applications',
        action: this._setSortMethod.bind(this, 'application', true)
      }];
      var unplacedToggle = {
        action: this._toggleScaleUp,
        disabled: this.props.services.size() === 0,
        toggleOn: this.state.showScaleUp
      };
      return (
        <div className="machine-view">
          <div className="machine-view__content">
            <juju.components.MachineViewColumn
              acl={this.props.acl}
              droppable={false}
              title="New units"
              toggle={unplacedToggle}>
              {this._generateScaleUp()}
              {this._generateUnplacedUnits()}
            </juju.components.MachineViewColumn>
            <juju.components.MachineViewColumn
              acl={this.props.acl}
              activeMenuItem={this.state.machineSort}
              droppable={true}
              dropUnit={this._dropUnit}
              menuItems={machineMenuItems}
              title={this._generateMachinesTitle()}
              type="machine">
              {this._generateAddMachine()}
              {this._generateMachines()}
            </juju.components.MachineViewColumn>
            <juju.components.MachineViewColumn
              acl={this.props.acl}
              activeMenuItem={this.state.containerSort}
              droppable={!!this.state.selectedMachine}
              dropUnit={this._dropUnit}
              menuItems={containerMenuItems}
              title={this._generateContainersTitle()}
              type="container">
              {this._generateAddContainer()}
              {this._generateContainers()}
            </juju.components.MachineViewColumn>
          </div>
        </div>
      );
    }
  });

  juju.components.MachineView = ReactDnD.DragDropContext(
    ReactDnDHTML5Backend)(MachineView);

}, '0.1.0', {
  requires: [
    'machine-view-add-machine',
    'machine-view-column',
    'machine-view-header',
    'machine-view-machine',
    'machine-view-scale-up',
    'machine-view-unplaced-unit',
    'svg-icon'
  ]
});
