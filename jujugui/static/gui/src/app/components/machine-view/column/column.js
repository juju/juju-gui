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

YUI.add('machine-view-column', function() {

  var dropTarget = {
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
  function collect(connect, monitor) {
    return {
      connectDropTarget: connect.dropTarget(),
      canDrop: monitor.canDrop(),
      isOver: monitor.isOver({shallow: true})
    };
  }

  var MachineViewColumn = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      activeMenuItem: React.PropTypes.string,
      canDrop: React.PropTypes.bool.isRequired,
      children: React.PropTypes.oneOfType([
        React.PropTypes.object,
        React.PropTypes.array
      ]),
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
      Generate the classes for the component.

      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      return classNames(
        'machine-view__column', {
          'machine-view__column--droppable':
            this.props.droppable && this.props.canDrop,
          'machine-view__column--drop': this.props.isOver
        });
    },

    render: function() {
      var props = this.props;
      return this.props.connectDropTarget(
        <div className={this._generateClasses()}>
          <juju.components.MachineViewHeader
            acl={this.props.acl}
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
              <juju.components.SvgIcon name="add_16"
                size="16" />
            </div>
          </div>
        </div>
      );
    }
  });

  juju.components.MachineViewColumn = ReactDnD.DropTarget(
    'unit', dropTarget, collect)(MachineViewColumn);

}, '0.1.0', {
  requires: [
    'machine-view-header',
    'svg-icon'
  ]
});
