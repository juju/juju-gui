/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const ReactDnD = require('react-dnd');
const shapeup = require('shapeup');

const ButtonRow = require('../../button-row/button-row');
const Constraints = require('../../constraints/constraints');
const ButtonDropdown = require('../../button-dropdown/button-dropdown');
const MachineViewMachineUnit = require('../machine-unit/machine-unit');

const MachineViewMachineGlobals = {};

MachineViewMachineGlobals.dropTarget = {
  /**
    Called when something is dropped on the machine.
    See: http://gaearon.github.io/react-dnd/docs-drop-target.html

    @method drop
    @param {Object} props The component props.
    @param {Object} monitor A DropTargetMonitor.
    @param {Object} component The component that is being dropped onto.
  */
  drop: function(props, monitor, component) {
    props.sendAnalytics('Machine View', 'Drop Target', 'Machine');
    props.dropUnit(monitor.getItem().unit, props.machineAPI.machine.id);
  },

  /**
    Called to check whether something can be dropped on the component.

    @method drop
    @param {Object} props The component props.
    @param {Object} monitor A DropTargetMonitor.
  */
  canDrop: function(props, monitor) {
    return !props.acl.isReadOnly() && !props.machineAPI.machine.deleted;
  }
};

/**
  Provides props to be injected into the component.

  @method collect
  @param {Object} connect The connector.
  @param {Object} monitor A DropTargetMonitor.
*/
MachineViewMachineGlobals.collect = function(connect, monitor) {
  return {
    canDrop: monitor.canDrop(),
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver()
  };
};

class MachineViewMachine extends React.Component {
  constructor() {
    super();
    this.state = {
      constraints: null,
      showForm: false
    };
  }

  /**
    Toggle the display of the constraints form.
  */
  _toggleForm() {
    this.setState({showForm: !this.state.showForm});
  }

  /**
    Update the state with the new constraints.

    @param constraints {Object} The new constraints.
  */
  _updateConstraints(constraints) {
    this.setState({constraints: constraints});
  }

  /**
    Set the new constraints on the machine.
  */
  _setConstraints() {
    const constraints = this.state.constraints;
    const series = constraints.series || null;
    // The series is updated separately from the constraints, so remove it
    // from the object that is passed to the update constraints method.
    delete constraints.series;
    const id = this.props.machineAPI.machine.id;
    const modelAPI = this.props.modelAPI;
    modelAPI.updateMachineConstraints(id, constraints);
    modelAPI.updateMachineSeries(id, series);
    this._toggleForm();
  }

  /**
    Generate the constraints form.

    @returns {Object} the form JSX.
  */
  _generateConstraintsForm() {
    if (!this.state.showForm) {
      return null;
    }
    const machine = this.props.machineAPI.machine;
    const disabled = this.props.acl.isReadOnly();
    const units = this.props.dbAPI.units.filterByMachine(
      machine.id, this.props.type === 'machine');
    const buttons = [{
      title: 'Cancel',
      action: this._toggleForm.bind(this),
      type: 'base'
    }, {
      title: 'Update',
      action: this._setConstraints.bind(this),
      type: 'neutral',
      disabled: disabled
    }];
    return (
      <div className="add-machine__constraints">
        <h4 className="add-machine__title">
          Update constraints
        </h4>
        <Constraints
          constraints={this.props.parseConstraints(machine.constraints)}
          currentSeries={machine.series}
          disabled={disabled}
          hasUnit={!!units.length}
          providerType={this.props.modelAPI.providerType}
          series={this.props.machineAPI.series}
          valuesChanged={this._updateConstraints.bind(this)} />
        <ButtonRow
          buttons={buttons}
          key="buttons" />
      </div>);
  }

  /**
    Generate the hardware for a machine.

    @method _generateHardware
    @returns {Object} the machine hardware elements.
  */
  _generateHardware() {
    const props = this.props;
    if (props.type === 'container' || !props.showConstraints ||
        this.state.showForm) {
      return;
    }
    const machineAPI = props.machineAPI;
    return (
      <div className="machine-view__machine-hardware">
        {machineAPI.generateMachineDetails(machineAPI.machine)}
      </div>);
  }

  /**
    Generate the unit icons for the machine.

    @method _generateUnits
    @returns {Object} the unit elements.
  */
  _generateUnits() {
    if (this.state.showForm) {
      return null;
    }
    const props = this.props;
    const includeChildren = props.type === 'machine';
    const units = props.dbAPI.units.filterByMachine(
      props.machineAPI.machine.id, includeChildren);
    if (units.length === 0) {
      return;
    }
    const components = [];
    units.forEach(unit => {
      const service = props.dbAPI.applications.getById(unit.service);
      if (props.type === 'machine' && (service.get('hide')
        || service.get('fade'))) {
        return;
      }
      const propTypes = (
        MachineViewMachineUnit.DecoratedComponent.propTypes);
      components.push(
        <MachineViewMachineUnit
          acl={props.acl.reshape(propTypes.acl)}
          key={unit.id}
          machineType={props.type}
          removeUnit={props.machineAPI.removeUnit}
          sendAnalytics={props.sendAnalytics}
          service={service}
          unit={unit} />);
    });
    return (
      <ul className="machine-view__machine-units">
        {components}
      </ul>);
  }

  /**
    Handle destroying a machine.

    @method _destroyMachine
  */
  _destroyMachine() {
    const props = this.props;
    props.modelAPI.destroyMachines([props.machineAPI.machine.id], true);
  }

  /**
    Handle selecting a machine.

    @method _handleSelectMachine
  */
  _handleSelectMachine() {
    const selectMachine = this.props.machineAPI.selectMachine;
    if (selectMachine) {
      selectMachine(this.props.machineAPI.machine.id, false);
    }
  }

  /**
    Generate the classes for the machine.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    var machine = this.props.machineAPI.machine;
    var classes = {
      'machine-view__machine--drop': this.props.isOver && this.props.canDrop,
      'machine-view__machine--selected': this.props.machineAPI.selected,
      'machine-view__machine--uncommitted': machine.deleted ||
        machine.commitStatus === 'uncommitted',
      'machine-view__machine--root': machine.root
    };
    classes['machine-view__machine--' + this.props.type] = true;
    return classNames(
      'machine-view__machine',
      classes
    );
  }

  render() {
    var machine = this.props.machineAPI.machine;
    var menuItems = [{
      label: 'Destroy',
      action: (!this.props.acl.isReadOnly() && this._destroyMachine.bind(this)) || null
    }];
    if (this.props.type === 'machine' &&
        machine.commitStatus === 'uncommitted') {
      menuItems.push({
        label: 'Update constraints',
        action: (!this.props.acl.isReadOnly() && this._toggleForm.bind(this)) || null
      });
    }
    // Wrap the returned components in the drop target method.
    return this.props.connectDropTarget(
      <div className={this._generateClasses()}
        onClick={this._handleSelectMachine.bind(this)}
        role="button"
        tabIndex="0">
        <ButtonDropdown
          classes={['machine-view__machine-dropdown']}
          listItems={menuItems} />
        <div className="machine-view__machine-name">
          {this.props.machineAPI.machine.displayName}
        </div>
        {this._generateHardware()}
        {this._generateUnits()}
        {this._generateConstraintsForm()}
        <div className="machine-view__machine-drop-target">
          <div className="machine-view__machine-drop-message">
            Add to {this.props.machineAPI.machine.displayName}
          </div>
        </div>
      </div>
    );
  }
};

MachineViewMachine.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc
  }).frozen.isRequired,
  canDrop: PropTypes.bool.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  dbAPI: shapeup.shape({
    applications: PropTypes.object.isRequired,
    units: PropTypes.object.isRequired
  }).isRequired,
  dropUnit: PropTypes.func.isRequired,
  isOver: PropTypes.bool.isRequired,
  machineAPI: shapeup.shape({
    generateMachineDetails: PropTypes.func,
    machine: PropTypes.object.isRequired,
    removeUnit: PropTypes.func,
    series: PropTypes.array,
    selectMachine: PropTypes.func,
    selected: PropTypes.bool
  }).isRequired,
  modelAPI: shapeup.shape({
    destroyMachines: PropTypes.func.isRequired,
    providerType: PropTypes.string,
    updateMachineConstraints: PropTypes.func,
    updateMachineSeries: PropTypes.func
  }).isRequired,
  parseConstraints: PropTypes.func.isRequired,
  sendAnalytics: PropTypes.func.isRequired,
  showConstraints: PropTypes.bool,
  type: PropTypes.string.isRequired
};

module.exports = ReactDnD.DropTarget(
  'unit', MachineViewMachineGlobals.dropTarget,
  MachineViewMachineGlobals.collect)(MachineViewMachine);
