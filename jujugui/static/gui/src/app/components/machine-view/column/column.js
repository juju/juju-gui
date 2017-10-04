/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const ReactDnD = require('react-dnd');
const shapeup = require('shapeup');

const SvgIcon = require('../../svg-icon/svg-icon');
const MachineViewHeader = require('../header/header');

const MachineViewColumnGlobals = {};

MachineViewColumnGlobals.dropTarget = {
  /**
    Called when something is dropped on the component.
    See: http://gaearon.github.io/react-dnd/docs-drop-target.html

    @method drop
    @param {Object} props The component props.
    @param {Object} monitor A DropTargetMonitor.
    @param {Object} component The component that is being dropped onto.
  */
  drop: function (props, monitor, component) {
    // Don't try and place the unit if it was dropped on a nested component.
    if (monitor.didDrop()) {
      return;
    };
    var item = monitor.getItem();
    if (props.droppable) {
      props.dropUnit(item.unit, null, props.type);
    }
  },

  /**
    Called to check if the unit is allowed to be dropped on the column.

    @method canDrop
    @param {Object} props The component props.
    @param {Object} monitor A DropTargetMonitor.
  */
  canDrop: function (props, monitor) {
    return !props.acl.isReadOnly() && props.droppable;
  }
};

/**
  Provides props to be injected into the component.

  @method collect
  @param {Object} connect The connector.
  @param {Object} monitor A DropTargetMonitor.
*/
MachineViewColumnGlobals.collect = function(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    canDrop: monitor.canDrop(),
    isOver: monitor.isOver({shallow: true})
  };
};

class MachineViewColumn extends React.Component {
  /**
    Generate the classes for the component.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    return classNames(
      'machine-view__column', {
        'machine-view__column--droppable':
          this.props.droppable && this.props.canDrop,
        'machine-view__column--drop': this.props.isOver
      });
  }

  render() {
    const props = this.props;
    const propTypes = (
      MachineViewHeader.DecoratedComponent.propTypes);
    return props.connectDropTarget(
      <div className={this._generateClasses()}>
        <MachineViewHeader
          acl={props.acl.reshape(propTypes.acl)}
          activeMenuItem={props.activeMenuItem}
          droppable={props.droppable}
          dropUnit={props.dropUnit}
          menuItems={props.menuItems}
          title={props.title}
          toggle={props.toggle}
          type={props.type} />
        <div className="machine-view__column-content">
          {this.props.children}
          <div className="machine-view__column-drop-target">
            <SvgIcon name="add_16"
              size="16" />
          </div>
        </div>
      </div>
    );
  }
};

MachineViewColumn.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc
  }).frozen.isRequired,
  activeMenuItem: PropTypes.string,
  canDrop: PropTypes.bool.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  connectDropTarget: PropTypes.func.isRequired,
  dropUnit: PropTypes.func,
  droppable: PropTypes.bool.isRequired,
  isOver: PropTypes.bool.isRequired,
  menuItems: PropTypes.array,
  title: PropTypes.string.isRequired,
  toggle: PropTypes.object,
  type: PropTypes.string
};

module.exports = ReactDnD.DropTarget(
  'unit', MachineViewColumnGlobals.dropTarget,
  MachineViewColumnGlobals.collect)(MachineViewColumn);
