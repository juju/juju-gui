/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const ReactDnD = require('react-dnd');
const shapeup = require('shapeup');

const ButtonDropdown = require('../../button-dropdown/button-dropdown');

const MachineViewMachineUnitGlobals = {};

MachineViewMachineUnitGlobals.dragSource = {
  /**
    Called when the component starts the drag.
    See: http://gaearon.github.io/react-dnd/docs-drag-source.html

    @method beginDrag
    @param {Object} props The component props.
  */
  beginDrag: function(props) {
    props.sendAnalytics('Machine View', 'Drag Target', 'Machine Unit');
    return {unit: props.unit};
  },

  /**
    Called to check if the component is allowed to be dragged.
    See: http://gaearon.github.io/react-dnd/docs-drag-source.html

    @method canDrag
    @param {Object} props The component props.
  */
  canDrag: function(props) {
    return !props.acl.isReadOnly() && !props.unit.agent_state;
  }
};

/**
  Provides props to be injected into the component.

  @method collect
  @param {Object} connect The connector.
  @param {Object} monitor A DropTargetMonitor.
*/
MachineViewMachineUnitGlobals.collect = function(connect, monitor) {
  return {
    canDrag: monitor.canDrag(),
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
};

class MachineViewMachineUnit extends React.Component {
  /**
    Generate the classes for the unit.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    var unit = this.props.unit;
    var agentState = unit.agent_state;
    var status = unit.deleted || !agentState ? 'uncommitted' : agentState;
    var classes = {
      'machine-view__machine-unit--draggable': this.props.canDrag,
      'machine-view__machine-unit--dragged': this.props.isDragging
    };
    classes['machine-view__machine-unit--' + status] = true;
    return classNames(
      'machine-view__machine-unit',
      classes);
  }

  render() {
    var menu;
    var title;
    var service = this.props.service;
    var unit = this.props.unit;
    if (this.props.machineType === 'container') {
      var menuItems = [{
        label: 'Destroy',
        action: (!this.props.acl.isReadOnly() &&
          this.props.removeUnit.bind(null, unit.id)) || null
      }];
      menu = (
        <ButtonDropdown
          classes={['machine-view__machine-dropdown']}
          listItems={menuItems} />);
      title = unit.displayName;
    }
    // Wrap the returned components in the drag source method.
    return this.props.connectDragSource(
      <li className={this._generateClasses()}>
        <span className="machine-view__machine-unit-icon">
          <img
            alt={unit.displayName}
            className="machine-view__machine-unit-icon-img"
            src={service.get('icon')}
            title={unit.displayName} />
        </span>
        {title}
        {menu}
      </li>
    );
  }
};

MachineViewMachineUnit.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired
  }).frozen.isRequired,
  canDrag: PropTypes.bool.isRequired,
  connectDragSource: PropTypes.func.isRequired,
  isDragging: PropTypes.bool.isRequired,
  machineType: PropTypes.string.isRequired,
  removeUnit: PropTypes.func,
  sendAnalytics: PropTypes.func.isRequired,
  service: PropTypes.object.isRequired,
  unit: PropTypes.object.isRequired
};

module.exports = ReactDnD.DragSource(
  'unit', MachineViewMachineUnitGlobals.dragSource,
  MachineViewMachineUnitGlobals.collect)(MachineViewMachineUnit);
