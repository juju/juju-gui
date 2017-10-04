/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const ReactDnD = require('react-dnd');
const ReactDnDHTML5Backend = require('react-dnd-html5-backend');
const ReactDOM = require('react-dom');
const shapeup = require('shapeup');

const MachineViewAddMachine = require('./add-machine/add-machine');
const MachineViewColumn = require('./column/column');
const MachineViewMachine = require('./machine/machine');
const MachineViewScaleUp = require('./scale-up/scale-up');
const MachineViewUnplacedUnit = require('./unplaced-unit/unplaced-unit');
const SvgIcon = require('../svg-icon/svg-icon');
const GenericButton = require('../generic-button/generic-button');

class MachineView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      containerSort: 'name',
      machineSort: 'name',
      placingUnit: null,
      showAddMachine: false,
      showConstraints: true,
      showScaleUp: false
    };
  }

  componentDidMount() {
    this.selectMachine(
      this.props.machine ||
      this._getFirstMachineId(this.props.dbAPI.machines));
  }

  /**
    Called when the component is supplied with new props.

    @method componentWillReceiveProps
    @param {Object} The new props.
  */
  componentWillReceiveProps(nextProps) {
    const selected = this._getSelected();
    // Check for the existance of a container first as we can be sure that if
    // the container exists then the parent machine must exist.
    let selectedMachine = selected.container || selected.machine;
    if (selectedMachine) {
      // If the currently selected machine gets deployed the id will be
      // invalid as it will have been assigned a new id, so check that the
      // the machine for the selected id still exists and if not reset it
      // so the first machine gets selected.
      if (!this.props.dbAPI.machines.getById(selectedMachine)) {
        this.selectMachine(
          this._getFirstMachineId(nextProps.dbAPI.machines));
      }
    }
  }

  /**
    Get the id of the first machine.

    @method _getFirstMachine
    @param {Object} machines The list of machines.
    @returns {String} The id of the first machine, or null if no machines are
      present.
  */
  _getFirstMachineId(machines) {
    const machineList = machines.filterByParent();
    if (machineList.length === 0) {
      return null;
    }
    return machineList[0].id;
  }

  /**
    Handle removing a unit.

    @method _removeUnit
    @param id The unit id.
  */
  _removeUnit(id) {
    this.props.modelAPI.removeUnits([id]);
  }

  /**
    Handle dropping a unit.

    @method _dropUnit
    @param {Object} unit The unit that was dropped.
    @param {String} machine The machine id that the unit dropped onto.
  */
  _dropUnit(unit, machine, newType) {
    if (machine) {
      this.props.modelAPI.placeUnit(unit, machine);
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
  }

  /**
    Handle opening the store.

    @method _openStore
  */
  _openStore() {
    this.props.changeState({root: 'store'});
  }

  /**
    Display a list of unplaced units or onboarding.

    @method _generateUnplacedUnits
    @returns {Object} A unit list or onboarding.
  */
  _generateUnplacedUnits() {
    const props = this.props;
    let units = props.dbAPI.units.filterByMachine();
    units = units.filter((unit) => {
      const service = props.dbAPI.applications.getById(unit.service);
      if (!service.get('subordinate')) {
        return unit;
      }
    });
    if (units.length === 0) {
      var icon;
      var content;
      if (props.dbAPI.applications.size() === 0) {
        content = (
          <div>
            <p>
              Unplaced units will appear here. Drag and drop them to
              customise your deployment.
            </p>
            <span className="link"
              onClick={this._openStore.bind(this)}>
              Add applications to get started
            </span>
          </div>
        );
      } else {
        icon = 'task-done_16';
        content = 'You have placed all of your units';
      }
      return (
        <div className="machine-view__column-onboarding">
          {icon ? (
            <SvgIcon name={icon}
              size="16" />) : null}
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
      const service = props.dbAPI.applications.getById(unit.service);
      if (placingUnit && unit.id === placingUnit.id) {
        return;
      }
      const propTypes = (
        MachineViewUnplacedUnit.DecoratedComponent.propTypes);
      components.push(
        <MachineViewUnplacedUnit
          acl={props.acl.reshape(propTypes.acl)}
          dbAPI={props.dbAPI.reshape(propTypes.dbAPI)}
          key={unit.id}
          modelAPI={props.modelAPI.reshape(propTypes.modelAPI)}
          series={props.series}
          unitAPI={{
            icon: service.get('icon') || '',
            removeUnit: this._removeUnit.bind(this),
            selectMachine: this.selectMachine.bind(this),
            unit: unit
          }}
        />
      );
    });
    return (
      <div>
        <div className="machine-view__auto-place">
          <GenericButton
            action={props.modelAPI.autoPlaceUnits}
            disabled={props.acl.isReadOnly()}
            type="inline-neutral">
            Auto place
          </GenericButton>
          <p>
            You can also drag and drop unplaced units to customise your
            deployment.
          </p>
        </div>
        <ul className="machine-view__list">
          {components}
        </ul>
      </div>
    );
  }

  /**
    Display the scale up form.

    @method _generateScaleUp
    @returns {Object} The scale up component.
  */
  _generateScaleUp() {
    if (!this.state.showScaleUp) {
      return;
    }
    const props = this.props;
    const propTypes = MachineViewScaleUp.propTypes;
    return (
      <MachineViewScaleUp
        acl={props.acl.reshape(propTypes.acl)}
        dbAPI={props.dbAPI.reshape(propTypes.dbAPI)}
        toggleScaleUp={this._toggleScaleUp.bind(this)}
      />);
  }

  /**
    Scroll a column to a machine or container.
    @param {String} id The machine id to scroll to.
    @param {Boolean} isContainer Whether the machine is a container.
  */
  _scrollToMachine(id, isContainer=false) {
    // Get the correct column that contains the machine to scroll to.
    const column = ReactDOM.findDOMNode(isContainer ?
      this.refs.containersColumn : this.refs.machinesColumn);
    // Get the content node that scrolls.
    const content = column.querySelector('.machine-view__column-content');
    const machine = ReactDOM.findDOMNode(
      this.refs[`${isContainer ? 'container' : 'machine'}-${id}`]);
    if (content && machine) {
      content.scrollTop = machine.offsetTop - content.offsetTop;
    }
  }

  /**
    Handle selecting a machine.

    @param {String} id The machine id to select. If the id is null, no machine
      is selected.
    @param {Boolean} scrollToMachine Whether to scroll to the selected machine.
  */
  selectMachine(id, scrollToMachine=true) {
    if (id === null) {
      return;
    }
    if (scrollToMachine) {
      const selected = this._getSelected(id);
      this._scrollToMachine(selected.machine, false);
      if (selected.container) {
        this._scrollToMachine(selected.container, true);
      }
    }
    this.props.changeState({gui: {machines: id}});
  }

  /**
    Get the currently selected machine and container.
    @param machine {String} The machine id.
    @returns {Object} The selected machine and container.
  */
  _getSelected(machine) {
    if (!machine) {
      machine = this.props.machine;
    }
    let selected = {
      machine: null,
      container: null
    };
    if (machine) {
      const parsed = this.props.parseMachineName(machine);
      selected.machine = parsed.parentId || parsed.number;
      // Set the container to the full container id.
      selected.container = parsed.parentId ? machine : null;
    }
    return selected;
  }

  /**
    Display a list of machines or onboarding.

    @method _generateMachines
    @returns {Object} A list of machines or onboarding.
  */
  _generateMachines() {
    if (this.state.showAddMachine) {
      return;
    }
    const props = this.props;
    const machineList = props.dbAPI.machines.filterByParent();
    const machines = this._sortMachines(machineList, this.state.machineSort);
    let onboarding;
    if (machines.length === 0) {
      return (
        <div className="machine-view__column-onboarding">
          <p>Use machine view to:</p>
          <ul>
            <li>Create machines</li>
            <li>Create containers</li>
            <li>Customise placement</li>
            <li>Scale up your model</li>
            <li>Manually place new units</li>
            <li>Colocate applications</li>
          </ul>
          <span className="link"
            onClick={this._addMachine.bind(this)}
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
    const components = [];
    const propTypes = (
      MachineViewMachine.DecoratedComponent.propTypes);
    const acl = props.acl.reshape(propTypes.acl);
    const dbAPI = props.dbAPI.reshape(propTypes.dbAPI);
    const modelAPI = props.modelAPI.reshape(propTypes.modelAPI);
    machines.forEach((machine) => {
      const selectedMachine = this._getSelected().machine;
      components.push(
        <MachineViewMachine
          acl={acl}
          dbAPI={dbAPI}
          dropUnit={this._dropUnit.bind(this)}
          key={machine.id}
          machineAPI={{
            generateMachineDetails: props.generateMachineDetails,
            machine: machine,
            series: props.series,
            selectMachine: this.selectMachine.bind(this),
            selected: selectedMachine === machine.id
          }}
          modelAPI={modelAPI}
          parseConstraints={props.parseConstraints}
          ref={`machine-${machine.id}`}
          showConstraints={
            this.state.showConstraints || machine.id === selectedMachine}
          type="machine"
        />);
    });
    return (
      <div>
        {onboarding}
        <ul className="machine-view__list">
          {components}
        </ul>
      </div>);
  }

  /**
    Display a list of containers for the selected machine.

    @method _generateContainers
    @returns {Object} A list of machines or onboarding.
  */
  _generateContainers() {
    const selected = this._getSelected();
    const selectedMachine = selected.machine;
    if (!selectedMachine) {
      return;
    }
    const props = this.props;
    const containerList = props.dbAPI.machines.filterByParent(selectedMachine);
    const containers = this._sortMachines(
      containerList, this.state.containerSort);
    const machine = props.dbAPI.machines.getById(selectedMachine);
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
    const propTypes = (
      MachineViewMachine.DecoratedComponent.propTypes);
    const components = [];
    containers.forEach((container) => {
      components.push(
        <MachineViewMachine
          acl={props.acl.reshape(propTypes.acl)}
          dbAPI={props.dbAPI.reshape(propTypes.dbAPI)}
          dropUnit={this._dropUnit.bind(this)}
          key={container.id}
          machineAPI={{
            machine: container,
            removeUnit: this._removeUnit.bind(this),
            selected: selected.container ? selected.container === container.id :
              selected.machine === container.id,
            selectMachine: this.selectMachine.bind(this)
          }}
          modelAPI={props.modelAPI.reshape(propTypes.modelAPI)}
          parseConstraints={props.parseConstraints}
          ref={`container-${container.id}`}
          type="container"
        />);
    });
    return (
      <ul className="machine-view__list">
        {components}
      </ul>);
  }

  /**
    Handle showing the UI for adding a machine.

    @method _addMachine
  */
  _addMachine() {
    this.setState({showAddMachine: true});
  }

  /**
    Handle closing the UI for adding a machine.

    @method _closeAddMachine
  */
  _closeAddMachine() {
    this.setState({
      placingUnit: null,
      showAddMachine: false
    });
  }

  /**
    Generate the UI for adding a machine.

    @method _generateAddMachine
  */
  _generateAddMachine() {
    if (!this.state.showAddMachine) {
      return;
    }
    const props = this.props;
    const propTypes = MachineViewAddMachine.propTypes;
    return (
      <MachineViewAddMachine
        acl={props.acl.reshape(propTypes.acl)}
        close={this._closeAddMachine.bind(this)}
        modelAPI={props.modelAPI.reshape(propTypes.modelAPI)}
        selectMachine={this.selectMachine.bind(this)}
        series={props.series}
        unit={this.state.placingUnit}
      />
    );
  }

  /**
    Handle showing the UI for adding a container.

    @method _addContainer
  */
  _addContainer() {
    var selectedMachine = this._getSelected().machine;
    let deleted = false;
    if (selectedMachine) {
      const machine = this.props.dbAPI.machines.getById(selectedMachine);
      deleted = machine.deleted;
    }
    if (selectedMachine && !deleted) {
      this.setState({showAddContainer: true});
    }
  }

  /**
    Handle closing the UI for adding a container.

    @method _closeAddContainer
  */
  _closeAddContainer() {
    this.setState({
      placingUnit: null,
      showAddContainer: false
    });
  }

  /**
    Generate the UI for adding a container.

    @method _generateAddContainer
  */
  _generateAddContainer() {
    if (!this.state.showAddContainer) {
      return;
    }
    const props = this.props;
    const propTypes = MachineViewAddMachine.propTypes;
    return (
      <MachineViewAddMachine
        acl={props.acl.reshape(propTypes.acl)}
        close={this._closeAddContainer.bind(this)}
        modelAPI={props.modelAPI.reshape(propTypes.modelAPI)}
        parentId={this._getSelected().machine}
        series={props.series}
        unit={this.state.placingUnit}
      />
    );
  }

  /**
    Generate the title for the machine column header.

    @method _generateMachinesTitle
    @returns {String} the machine header title.
  */
  _generateMachinesTitle() {
    const machines = this.props.dbAPI.machines.filterByParent();
    return `${this.props.dbAPI.modelName} (${machines.length})`;
  }

  /**
    Toggle the visibililty of the constraints on machines.

    @method _toggleConstraints
  */
  _toggleConstraints() {
    this.setState({showConstraints: !this.state.showConstraints});
  }

  /**
    Toggle the visibililty of the service scale up.

    @method _toggleScaleUp
  */
  _toggleScaleUp() {
    this.setState({showScaleUp: !this.state.showScaleUp});
  }

  /**
    Generate the title for the container column header.

    @method _generateContainersTitle
    @returns {String} the container header title.
  */
  _generateContainersTitle() {
    const dbAPI = this.props.dbAPI;
    var selectedMachine = this._getSelected().machine;
    let containerCount = 0;
    let unitCount = 0;
    if (selectedMachine) {
      const containers = dbAPI.machines.filterByParent(selectedMachine);
      const units = dbAPI.units.filterByMachine(selectedMachine);
      containerCount = containers.length;
      unitCount = units.length;
    }
    const containerPlural = containerCount === 1 ? '' : 's';
    const unitPlural = unitCount === 1 ? '' : 's';
    return `${containerCount} container${containerPlural}, ` +
      `${unitCount} unit${unitPlural}`;
  }

  /**
    Sort the machines.

    @method _sortMachines
    @param {Array} machines A list of machines.
    @param {String} method The sort method.
    @returns {Array} A sorted list of machines
  */
  _sortMachines(machines, method) {
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
  }

  /**
    Set the sort method to the given method.

    @method _setSortMethod
    @param {String} sort The sort method.
    @param {Boolean} sortContainers Whether to sort containers.
  */
  _setSortMethod(sort, sortContainers) {
    var state = {};
    if (sortContainers) {
      state.containerSort = sort;
    } else {
      state.machineSort = sort;
    }
    this.setState(state);
  }

  /**
     Get the sort method for the given sort type.

     @method _getSortMethod
     @param {String} sort The sort type.
     @return {Function} The sorting method function.
   */
  _getSortMethod(sort) {
    let sortMethod;
    let weight = 0;
    const units = this.props.dbAPI.units;
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
  }

  render() {
    const props = this.props;
    const isReadOnly = props.acl.isReadOnly();
    const machineMenuItems = [{
      label: 'Add machine',
      action: !isReadOnly && this._addMachine.bind(this)
    }, {
      label: this.state.showConstraints ?
        'Hide constraints' : 'Show constaints',
      action: this._toggleConstraints.bind(this)
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
        this._getSelected().machine ? this._addContainer.bind(this) : null)
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
    const unplacedToggle = {
      action: this._toggleScaleUp.bind(this),
      disabled: props.dbAPI.applications.size() === 0,
      toggleOn: this.state.showScaleUp
    };
    const comp = MachineViewColumn.DecoratedComponent;
    const acl = props.acl.reshape(comp.propTypes.acl);
    return (
      <div className="machine-view">
        <div className="machine-view__content">
          <MachineViewColumn
            acl={acl}
            droppable={false}
            title="New units"
            toggle={unplacedToggle}>
            {this._generateScaleUp()}
            {this._generateUnplacedUnits()}
          </MachineViewColumn>
          <MachineViewColumn
            acl={acl}
            activeMenuItem={this.state.machineSort}
            droppable={true}
            dropUnit={this._dropUnit.bind(this)}
            menuItems={machineMenuItems}
            ref="machinesColumn"
            title={this._generateMachinesTitle()}
            type="machine">
            {this._generateAddMachine()}
            {this._generateMachines()}
          </MachineViewColumn>
          <MachineViewColumn
            acl={acl}
            activeMenuItem={this.state.containerSort}
            droppable={!!this._getSelected().machine}
            dropUnit={this._dropUnit.bind(this)}
            menuItems={containerMenuItems}
            ref="containersColumn"
            title={this._generateContainersTitle()}
            type="container">
            {this._generateAddContainer()}
            {this._generateContainers()}
          </MachineViewColumn>
        </div>
      </div>
    );
  }
};

MachineView.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc
  }).frozen.isRequired,
  changeState: PropTypes.func.isRequired,
  dbAPI: shapeup.shape({
    addGhostAndEcsUnits: PropTypes.func.isRequired,
    applications: PropTypes.object.isRequired,
    machines: PropTypes.object.isRequired,
    modelName: PropTypes.string.isRequired,
    reshape: shapeup.reshapeFunc,
    units: PropTypes.object.isRequired
  }).isRequired,
  generateMachineDetails: PropTypes.func.isRequired,
  machine: PropTypes.string.isRequired,
  modelAPI: shapeup.shape({
    autoPlaceUnits: PropTypes.func.isRequired,
    createMachine: PropTypes.func.isRequired,
    destroyMachines: PropTypes.func.isRequired,
    placeUnit: PropTypes.func.isRequired,
    providerType: PropTypes.string,
    removeUnits: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc,
    updateMachineConstraints: PropTypes.func.isRequired,
    updateMachineSeries: PropTypes.func.isRequired
  }).isRequired,
  parseConstraints: PropTypes.func.isRequired,
  parseMachineName: PropTypes.func.isRequired,
  series: PropTypes.array
};

module.exports = ReactDnD.DragDropContext(
  ReactDnDHTML5Backend)(MachineView);
