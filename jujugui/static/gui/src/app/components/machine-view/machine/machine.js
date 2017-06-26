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
  drop: function (props, monitor, component) {
    var item = monitor.getItem();
    props.dropUnit(item.unit, props.machine.id);
  },

  /**
    Called to check whether something can be dropped on the component.

    @method drop
    @param {Object} props The component props.
    @param {Object} monitor A DropTargetMonitor.
  */
  canDrop: function (props, monitor) {
    return !props.acl.isReadOnly() && !props.machine.deleted;
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
    const id = this.props.machine.id;
    this.props.updateMachineConstraints(id, constraints);
    this.props.updateMachineSeries(id, series);
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
    const machine = this.props.machine;
    const disabled = this.props.acl.isReadOnly();
    const units = this.props.units.filterByMachine(
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
        <juju.components.Constraints
          constraints={this.props.parseConstraints(machine.constraints)}
          currentSeries={machine.series}
          disabled={disabled}
          hasUnit={!!units.length}
          providerType={this.props.providerType}
          series={this.props.series}
          valuesChanged={this._updateConstraints.bind(this)} />
        <juju.components.ButtonRow
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
    if (this.props.type === 'container' || !this.props.showConstraints ||
        this.state.showForm) {
      return;
    }
    return (
      <div className="machine-view__machine-hardware">
        {this.props.generateMachineDetails(this.props.machine)}
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
    var includeChildren = this.props.type === 'machine';
    var units = this.props.units.filterByMachine(
      this.props.machine.id, includeChildren);
    if (units.length === 0) {
      return;
    }
    var components = [];
    units.forEach((unit) => {
      var service = this.props.services.getById(unit.service);
      if (this.props.type === 'machine' && (service.get('hide')
        || service.get('fade'))) {
        return;
      }
      components.push(
        <juju.components.MachineViewMachineUnit
          acl={this.props.acl}
          key={unit.id}
          machineType={this.props.type}
          removeUnit={this.props.removeUnit}
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
    this.props.destroyMachines([this.props.machine.id], true);
  }

  /**
    Handle selecting a machine.

    @method _handleSelectMachine
  */
  _handleSelectMachine() {
    var selectMachine = this.props.selectMachine;
    if (selectMachine) {
      selectMachine(this.props.machine.id);
    }
  }

  /**
    Generate the classes for the machine.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    var machine = this.props.machine;
    var classes = {
      'machine-view__machine--drop': this.props.isOver && this.props.canDrop,
      'machine-view__machine--selected': this.props.selected,
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
    var machine = this.props.machine;
    var menuItems = [{
      label: 'Destroy',
      action: !this.props.acl.isReadOnly() && this._destroyMachine.bind(this)
    }];
    if (this.props.type === 'machine' &&
        machine.commitStatus === 'uncommitted') {
      menuItems.push({
        label: 'Update constraints',
        action: !this.props.acl.isReadOnly() && this._toggleForm.bind(this)
      });
    }
    // Wrap the returned components in the drop target method.
    return this.props.connectDropTarget(
      <div className={this._generateClasses()}
        onClick={this._handleSelectMachine.bind(this)}
        role="button"
        tabIndex="0">
        <juju.components.MoreMenu
          items={menuItems} />
        <div className="machine-view__machine-name">
          {this.props.machine.displayName}
        </div>
        {this._generateHardware()}
        {this._generateUnits()}
        {this._generateConstraintsForm()}
        <div className="machine-view__machine-drop-target">
          <div className="machine-view__machine-drop-message">
            Add to {this.props.machine.displayName}
          </div>
        </div>
      </div>
    );
  }
};

MachineViewMachine.propTypes = {
  acl: React.PropTypes.object.isRequired,
  canDrop: React.PropTypes.bool.isRequired,
  connectDropTarget: React.PropTypes.func.isRequired,
  destroyMachines: React.PropTypes.func.isRequired,
  dropUnit: React.PropTypes.func.isRequired,
  generateMachineDetails: React.PropTypes.func,
  isOver: React.PropTypes.bool.isRequired,
  machine: React.PropTypes.object.isRequired,
  machineModel: React.PropTypes.object,
  parseConstraints: React.PropTypes.func,
  providerType: React.PropTypes.string,
  removeUnit: React.PropTypes.func,
  selectMachine: React.PropTypes.func,
  selected: React.PropTypes.bool,
  series: React.PropTypes.array,
  services: React.PropTypes.object.isRequired,
  showConstraints: React.PropTypes.bool,
  type: React.PropTypes.string.isRequired,
  units: React.PropTypes.object.isRequired,
  updateMachineConstraints: React.PropTypes.func,
  updateMachineSeries: React.PropTypes.func
};

YUI.add('machine-view-machine', function() {
  juju.components.MachineViewMachine = ReactDnD.DropTarget(
    'unit', MachineViewMachineGlobals.dropTarget,
    MachineViewMachineGlobals.collect)(MachineViewMachine);
}, '0.1.0', {
  requires: [
    'machine-view-machine-unit',
    'more-menu'
  ]
});
