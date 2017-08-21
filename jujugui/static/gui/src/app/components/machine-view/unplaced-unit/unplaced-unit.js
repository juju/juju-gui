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

const MachineViewUnplacedUnitGlobals = {};

MachineViewUnplacedUnitGlobals.dragSource = {
  /**
    Called when the component starts the drag.
    See: http://gaearon.github.io/react-dnd/docs-drag-source.html

    @method beginDrag
    @param {Object} props The component props.
  */
  beginDrag: function(props) {
    return {unit: props.unitAPI.unit};
  },

  /**
    Called to check if the component is allowed to be dragged.
    See: http://gaearon.github.io/react-dnd/docs-drag-source.html

    @method canDrag
    @param {Object} props The component props.
  */
  canDrag: function(props) {
    return !props.acl.isReadOnly();
  }
};

/**
  Provides props to be injected into the component.

  @method collect
  @param {Object} connect The connector.
  @param {Object} monitor A DropTargetMonitor.
*/
MachineViewUnplacedUnitGlobals.collect = function(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
};

class MachineViewUnplacedUnit extends React.Component {
  constructor() {
    super();
    this.state = {showPlaceUnit: false};
  }

  /**
    Toggle the visibility of the unit placement form.

    @method _togglePlaceUnit
  */
  _togglePlaceUnit() {
    this.setState({showPlaceUnit: !this.state.showPlaceUnit});
  }

  /**
    Generate the place unit form.

    @method _generatePlaceUnit
  */
  _generatePlaceUnit() {
    if (!this.state.showPlaceUnit) {
      return;
    }
    const props = this.props;
    const propTypes = juju.components.MachineViewAddMachine.propTypes;
    return (
      <juju.components.MachineViewAddMachine
        acl={props.acl.reshape(propTypes.acl)}
        close={this._togglePlaceUnit.bind(this)}
        dbAPI={props.dbAPI.reshape(propTypes.dbAPI)}
        modelAPI={props.modelAPI.reshape(propTypes.modelAPI)}
        selectMachine={props.unitAPI.selectMachine}
        series={props.series}
        unit={props.unitAPI.unit}
      />
    );
  }

  /**
    Generate the classes for the unit.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    return classNames(
      'machine-view__unplaced-unit', {
        'machine-view__unplaced-unit--dragged': this.props.isDragging
      });
  }

  render() {
    const props = this.props;
    const isReadOnly = props.acl.isReadOnly();
    const unitAPI = props.unitAPI;
    const unit = unitAPI.unit;
    const menuItems = [{
      label: 'Deploy to...',
      action: !isReadOnly && this._togglePlaceUnit.bind(this)
    }, {
      label: 'Destroy',
      action: !isReadOnly && unitAPI.removeUnit.bind(null, unit.id)
    }];
    // Wrap the returned components in the drag source method.
    return props.connectDragSource(
      <li className={this._generateClasses()}>
        <img src={unitAPI.icon} alt={unit.displayName}
          className="machine-view__unplaced-unit-icon" />
        {unit.displayName}
        <juju.components.MoreMenu
          items={menuItems} />
        {this._generatePlaceUnit()}
        <div className="machine-view__unplaced-unit-drag-state"></div>
      </li>
    );
  }
};

MachineViewUnplacedUnit.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc
  }).frozen.isRequired,
  connectDragSource: PropTypes.func.isRequired,
  dbAPI: shapeup.shape({
    machines: PropTypes.object.isRequired
  }),
  isDragging: PropTypes.bool.isRequired,
  modelAPI: shapeup.shape({
    createMachine: PropTypes.func.isRequired,
    placeUnit: PropTypes.func.isRequired,
    providerType: PropTypes.string
  }).isRequired,
  series: PropTypes.array,
  unitAPI: shapeup.shape({
    icon: PropTypes.string.isRequired,
    removeUnit: PropTypes.func.isRequired,
    selectMachine: PropTypes.func.isRequired,
    unit: PropTypes.object.isRequired
  }).isRequired
};

YUI.add('machine-view-unplaced-unit', function() {
  juju.components.MachineViewUnplacedUnit = ReactDnD.DragSource(
    'unit', MachineViewUnplacedUnitGlobals.dragSource,
    MachineViewUnplacedUnitGlobals.collect)(MachineViewUnplacedUnit);
}, '0.1.0', {
  requires: [
    'machine-view-add-machine',
    'more-menu'
  ]
});
