/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const ReactDnD = require('react-dnd');
const shapeup = require('shapeup');

const GenericButton = require('../../generic-button/generic-button');
const ButtonDropdown = require('../../button-dropdown/button-dropdown');
const SvgIcon = require('../../svg-icon/svg-icon');

const MachineViewHeaderGlobals = {};

MachineViewHeaderGlobals.dropTarget = {
  /**
    Called when something is dropped on the header.
    See: http://gaearon.github.io/react-dnd/docs-drop-target.html

    @method drop
    @param {Object} props The component props.
    @param {Object} monitor A DropTargetMonitor.
    @param {Object} component The component that is being dropped onto.
  */
  drop: function(props, monitor, component) {
    props.sendAnalytics('Machine View', 'Drop Target', 'Header');
    if (props.droppable) {
      props.dropUnit(monitor.getItem().unit, null, props.type);
    }
  },

  /**
    Called to check if the unit is allowed to be dropped on the header.

    @method canDrop
    @param {Object} props The component props.
    @param {Object} monitor A DropTargetMonitor.
  */
  canDrop: function(props, monitor) {
    return !props.acl.isReadOnly() && props.droppable;
  }
};

/**
  Provides props to be injected into the component.

  @method collect
  @param {Object} connect The connector.
  @param {Object} monitor A DropTargetMonitor.
*/
MachineViewHeaderGlobals.collect = function(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    canDrop: monitor.canDrop(),
    isOver: monitor.isOver()
  };
};

class MachineViewHeader extends React.Component {
  /**
    Generate a menu for the supplied controls.

    @method _generateControl
    @returns {Object} A more menu component
  */
  _generateControl() {
    var menuItems = this.props.menuItems;
    var toggle = this.props.toggle;
    if (menuItems) {
      return (
        <ButtonDropdown
          activeItem={this.props.activeMenuItem}
          classes={['machine-view__header-dropdown']}
          listItems={menuItems} />);
    } else if (toggle) {
      var icon = toggle.toggleOn ? 'close_16_white' : 'add-light-16';
      return (
        <GenericButton
          action={toggle.action}
          disabled={toggle.disabled}
          type='inline-positive'>
          <SvgIcon
            name={icon}
            size="16" />
        </GenericButton>);
    }
  }

  /**
    Generate the classes for the component.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    return classNames(
      'machine-view__header', {
        'machine-view__header--droppable':
          this.props.droppable && this.props.canDrop,
        'machine-view__header--drop': this.props.isOver
      });
  }

  render() {
    return this.props.connectDropTarget(
      <div className={this._generateClasses()}>
        {this.props.title}
        {this._generateControl()}
        <div className="machine-view__header-drop-target">
          <div className="machine-view__header-drop-message">
            Create new {this.props.type}
          </div>
        </div>
      </div>
    );
  }
};

MachineViewHeader.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired
  }).frozen.isRequired,
  activeMenuItem: PropTypes.string,
  canDrop: PropTypes.bool.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  dropUnit: PropTypes.func,
  droppable: PropTypes.bool.isRequired,
  isOver: PropTypes.bool.isRequired,
  menuItems: PropTypes.array,
  sendAnalytics: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  toggle: PropTypes.object,
  type: PropTypes.string
};

module.exports = ReactDnD.DropTarget(
  'unit', MachineViewHeaderGlobals.dropTarget,
  MachineViewHeaderGlobals.collect)(MachineViewHeader);
