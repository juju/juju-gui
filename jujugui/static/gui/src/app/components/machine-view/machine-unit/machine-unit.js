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

YUI.add('machine-view-machine-unit', function() {
  var dragSource = {
    /**
      Called when the component starts the drag.
      See: http://gaearon.github.io/react-dnd/docs-drag-source.html

      @method beginDrag
      @param {Object} props The component props.
    */
    beginDrag: function(props) {
      return {unit: props.unit};
    },

    /**
      Called to check if the component is allowed to be dragged.
      See: http://gaearon.github.io/react-dnd/docs-drag-source.html

      @method canDrag
      @param {Object} props The component props.
    */
    canDrag: function(props) {
      return !props.unit.agent_state;
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
      canDrag: monitor.canDrag(),
      connectDragSource: connect.dragSource(),
      isDragging: monitor.isDragging()
    };
  }

  var MachineViewMachineUnit = React.createClass({
    propTypes: {
      machineType: React.PropTypes.string.isRequired,
      removeUnit: React.PropTypes.func,
      service: React.PropTypes.object.isRequired,
      unit: React.PropTypes.object.isRequired
    },

    /**
      Generate the classes for the unit.

      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      var unit = this.props.unit;
      return classNames(
        'machine-view__machine-unit', {
          'machine-view__machine-unit--uncommitted':
            unit.deleted || !unit.agent_state,
          'machine-view__machine-unit--draggable': this.props.canDrag,
          'machine-view__machine-unit--dragged': this.props.isDragging
        });
    },

    render: function() {
      var menu;
      var title;
      var service = this.props.service;
      var unit = this.props.unit;
      if (this.props.machineType === 'container') {
        var menuItems = [{
          label: 'Destroy',
          action: this.props.removeUnit.bind(null, unit.id)
        }];
        menu = (
          <juju.components.MoreMenu
            items={menuItems} />);
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
  });

  juju.components.MachineViewMachineUnit = ReactDnD.DragSource(
    'unit', dragSource, collect)(MachineViewMachineUnit);

}, '0.1.0', {
  requires: [
    'machine-view-add-machine',
    'more-menu'
  ]
});
