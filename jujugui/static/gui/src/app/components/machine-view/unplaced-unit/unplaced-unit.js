/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const ReactDnD = require('react-dnd');
const shapeup = require('shapeup');

const ButtonDropdown = require('../../button-dropdown/button-dropdown');
const MachineViewAddMachine = require('../add-machine/add-machine');

const MachineViewUnplacedUnitGlobals = {};

MachineViewUnplacedUnitGlobals.dragSource = {
  /**
    Called when the component starts the drag.
    See: http://gaearon.github.io/react-dnd/docs-drag-source.html

    @method beginDrag
    @param {Object} props The component props.
  */
  beginDrag: function(props) {
    props.sendAnalytics('Machine View', 'Drag Target', 'Application Unit');
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
    const propTypes = MachineViewAddMachine.propTypes;
    return (
      <MachineViewAddMachine
        acl={props.acl.reshape(propTypes.acl)}
        close={this._togglePlaceUnit.bind(this)}
        dbAPI={props.dbAPI.reshape(propTypes.dbAPI)}
        modelAPI={props.modelAPI.reshape(propTypes.modelAPI)}
        selectMachine={props.unitAPI.selectMachine}
        series={props.series}
        unit={props.unitAPI.unit} />
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
      action: (!isReadOnly && this._togglePlaceUnit.bind(this)) || null
    }, {
      label: 'Destroy',
      action: (!isReadOnly && unitAPI.removeUnit.bind(null, unit.id)) || null
    }];
    // Wrap the returned components in the drag source method.
    return props.connectDragSource(
      <li className={this._generateClasses()}>
        <img alt={unit.displayName} className="machine-view__unplaced-unit-icon"
          src={unitAPI.icon} />
        {unit.displayName}
        <ButtonDropdown
          classes={['machine-view__unplaced-unit-dropdown']}
          listItems={menuItems} />
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
  sendAnalytics: PropTypes.func.isRequired,
  series: PropTypes.array,
  unitAPI: shapeup.shape({
    icon: PropTypes.string.isRequired,
    removeUnit: PropTypes.func.isRequired,
    selectMachine: PropTypes.func.isRequired,
    unit: PropTypes.object.isRequired
  }).isRequired
};

module.exports = ReactDnD.DragSource(
  'unit', MachineViewUnplacedUnitGlobals.dragSource,
  MachineViewUnplacedUnitGlobals.collect)(MachineViewUnplacedUnit);
