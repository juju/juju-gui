/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const ReactDnD = require('react-dnd');
const shapeup = require('shapeup');

const MachineUnit = require('../../shared/machine-unit/machine-unit');

const dragSource = {
  /**
    Called when the component starts the drag.
    See: http://gaearon.github.io/react-dnd/docs-drag-source.html
    @param {Object} props The component props.
  */
  beginDrag: function(props) {
    props.sendAnalytics('Machine View', 'Drag Target', 'Machine Unit');
    return {unit: props.unit};
  },

  /**
    Called to check if the component is allowed to be dragged.
    See: http://gaearon.github.io/react-dnd/docs-drag-source.html
    @param {Object} props The component props.
  */
  canDrag: function(props) {
    return !props.acl.isReadOnly() && !props.unit.agent_state;
  }
};

/**
  Provides props to be injected into the component.
  @param {Object} connect The connector.
  @param {Object} monitor A DropTargetMonitor.
*/
const collect = function(connect, monitor) {
  return {
    canDrag: monitor.canDrag(),
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
};

class MachineViewMachineUnit extends React.Component {
  /**
    Generate the classes for the unit.
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    const classes = {
      'machine-view__machine-unit': true,
      'machine-view__machine-unit--draggable': this.props.canDrag,
      'machine-view__machine-unit--dragged': this.props.isDragging
    };
    return Object.keys(classes).filter(className => classes[className]);
  }

  render() {
    let menuItems;
    const unit = this.props.unit;
    const agentState = unit.agent_state;
    if (this.props.machineType === 'container') {
      menuItems = [{
        label: 'Destroy',
        action: (!this.props.acl.isReadOnly() &&
          this.props.removeUnit.bind(null, unit.id)) || null
      }];
    }
    // Wrap the returned components in the drag source method.
    return this.props.connectDragSource(
      <div>
        <MachineUnit
          classes={this._generateClasses()}
          icon={this.props.icon}
          menuItems={menuItems}
          name={unit.displayName}
          status={unit.deleted || !agentState ? 'uncommitted' : agentState} />
      </div>
    );
  }
};

MachineViewMachineUnit.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired
  }).frozen.isRequired,
  canDrag: PropTypes.bool.isRequired,
  connectDragSource: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  isDragging: PropTypes.bool.isRequired,
  machineType: PropTypes.string.isRequired,
  removeUnit: PropTypes.func,
  sendAnalytics: PropTypes.func.isRequired,
  unit: PropTypes.object.isRequired
};

module.exports = ReactDnD.DragSource('unit', dragSource, collect)(MachineViewMachineUnit);
