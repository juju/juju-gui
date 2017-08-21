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
  drop: function (props, monitor, component) {
    var item = monitor.getItem();
    if (props.droppable) {
      props.dropUnit(item.unit, null, props.type);
    }
  },

  /**
    Called to check if the unit is allowed to be dropped on the header.

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
        <juju.components.MoreMenu
          activeItem={this.props.activeMenuItem}
          items={menuItems} />);
    } else if (toggle) {
      var icon = toggle.toggleOn ? 'close_16_white' : 'add-light-16';
      return (
        <juju.components.GenericButton
          action={toggle.action}
          disabled={toggle.disabled}
          type='inline-positive'>
          <juju.components.SvgIcon
            name={icon}
            size="16" />
        </juju.components.GenericButton>);
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
  title: PropTypes.string.isRequired,
  toggle: PropTypes.object,
  type: PropTypes.string
};

YUI.add('machine-view-header', function() {
  juju.components.MachineViewHeader = ReactDnD.DropTarget(
    'unit', MachineViewHeaderGlobals.dropTarget,
    MachineViewHeaderGlobals.collect)(MachineViewHeader);

}, '0.1.0', {
  requires: [
    'more-menu',
    'generic-button'
  ]
});
