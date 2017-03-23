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

YUI.add('machine-view-unplaced-unit', function() {
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
      return !props.acl.isReadOnly();
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
      connectDragSource: connect.dragSource(),
      isDragging: monitor.isDragging()
    };
  }

  var MachineViewUnplacedUnit = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      connectDragSource: React.PropTypes.func.isRequired,
      createMachine: React.PropTypes.func.isRequired,
      icon: React.PropTypes.string.isRequired,
      isDragging: React.PropTypes.bool.isRequired,
      machines: React.PropTypes.object.isRequired,
      placeUnit: React.PropTypes.func.isRequired,
      providerType: React.PropTypes.string,
      removeUnit: React.PropTypes.func.isRequired,
      selectMachine: React.PropTypes.func.isRequired,
      series: React.PropTypes.array,
      unit: React.PropTypes.object.isRequired
    },

    /**
      Generate the initial state for the component.

      @method getInitialState
      @returns {Object} The initial state.
    */
    getInitialState: function() {
      return {showPlaceUnit: false};
    },

    /**
      Toggle the visibility of the unit placement form.

      @method _togglePlaceUnit
    */
    _togglePlaceUnit: function() {
      this.setState({showPlaceUnit: !this.state.showPlaceUnit});
    },

    /**
      Generate the place unit form.

      @method _generatePlaceUnit
    */
    _generatePlaceUnit: function() {
      if (!this.state.showPlaceUnit) {
        return;
      }
      const props = this.props;
      return (
        <juju.components.MachineViewAddMachine
          acl={props.acl}
          close={this._togglePlaceUnit}
          createMachine={props.createMachine}
          machines={props.machines}
          placeUnit={props.placeUnit}
          providerType={props.providerType}
          selectMachine={props.selectMachine}
          series={props.series}
          unit={props.unit}
        />
      );
    },

    /**
      Generate the classes for the unit.

      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      return classNames(
        'machine-view__unplaced-unit', {
          'machine-view__unplaced-unit--dragged': this.props.isDragging
        });
    },

    render: function() {
      var isReadOnly = this.props.acl.isReadOnly();
      var unit = this.props.unit;
      var menuItems = [{
        label: 'Deploy to...',
        action: !isReadOnly && this._togglePlaceUnit
      }, {
        label: 'Destroy',
        action: !isReadOnly && this.props.removeUnit.bind(null, unit.id)
      }];
      // Wrap the returned components in the drag source method.
      return this.props.connectDragSource(
        <li className={this._generateClasses()}>
          <img src={this.props.icon} alt={unit.displayName}
            className="machine-view__unplaced-unit-icon" />
          {unit.displayName}
          <juju.components.MoreMenu
            items={menuItems} />
          {this._generatePlaceUnit()}
          <div className="machine-view__unplaced-unit-drag-state"></div>
        </li>
      );
    }
  });

  juju.components.MachineViewUnplacedUnit = ReactDnD.DragSource(
    'unit', dragSource, collect)(MachineViewUnplacedUnit);

}, '0.1.0', {
  requires: [
    'machine-view-add-machine',
    'more-menu'
  ]
});
