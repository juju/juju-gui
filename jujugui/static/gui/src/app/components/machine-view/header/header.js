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

YUI.add('machine-view-header', function() {

  var dropTarget = {
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
  function collect(connect, monitor) {
    return {
      connectDropTarget: connect.dropTarget(),
      canDrop: monitor.canDrop(),
      isOver: monitor.isOver()
    };
  }

  var MachineViewHeader = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      activeMenuItem: React.PropTypes.string,
      canDrop: React.PropTypes.bool.isRequired,
      connectDropTarget: React.PropTypes.func.isRequired,
      dropUnit: React.PropTypes.func,
      droppable: React.PropTypes.bool.isRequired,
      isOver: React.PropTypes.bool.isRequired,
      menuItems: React.PropTypes.array,
      title: React.PropTypes.string.isRequired,
      toggle: React.PropTypes.object,
      type: React.PropTypes.string
    },

    /**
      Generate a menu for the supplied controls.

      @method _generateControl
      @returns {Object} A more menu component
    */
    _generateControl: function() {
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
            type='inline-positive'
            icon={icon} />);
      }
    },

    /**
      Generate the classes for the component.

      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      return classNames(
        'machine-view__header', {
          'machine-view__header--droppable':
            this.props.droppable && this.props.canDrop,
          'machine-view__header--drop': this.props.isOver
        });
    },

    render: function() {
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
  });

  juju.components.MachineViewHeader = ReactDnD.DropTarget(
    'unit', dropTarget, collect)(MachineViewHeader);

}, '0.1.0', {
  requires: [
    'more-menu',
    'generic-button'
  ]
});
