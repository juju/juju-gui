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

YUI.add('unit-list', function() {

  juju.components.UnitList = React.createClass({

    /**
      Fires changeState to update the UI based on the component clicked.

      @method _navigate
      @param {Object} e The click event.
    */
    _navigate: function(e) {
      this.props.changeState({
        sectionA: {
          component: 'inspector',
          metadata: {
            id: this.props.serviceId,
            activeComponent: 'scale'
          }}});
    },

    /**
      Sets the selectAll state property based on the "select all" child
      component.

      @method _selectAllUnits
      @param {String} group The key for a group of checkboxes.
      @param {Boolean} checked Whether the "select all" child component is
        checked.
    */
    _selectAllUnits: function(group, checked) {
      if (checked === undefined) {
        checked = false;
      }
      var groups = this._generateGroups();
      groups[group].units.forEach((unit) => {
        this.refs['UnitListItem-' + unit.id].setState({
          checked: checked
        });
      });
    },

    /**
      The callable to be passed to the unit items for navigating to the unit
      details.

      @method _unitItemAction
      @param {Object} e The click event.
    */
    _unitItemAction: function(e) {
      var unitParts = e.currentTarget.getAttribute('data-id').split('/');
      this.props.changeState({
        sectionA: {
          component: 'inspector',
          metadata: {
            // This is done in parts like this because subordinate units show
            // the service unit that it's placed on, not the subordinate itself.
            id: unitParts[0], // Service Id
            unit: unitParts[1], // Unit Id
            activeComponent: 'unit'
          }
        }
      });
    },

    /**
      Remove the selected units.

      @method _handleRemoveUnits
    */
    _handleRemoveUnits: function() {
      var units = [];
      var refs = this.refs;
      Object.keys(refs).forEach(function (ref) {
        var isInstance = ref.split('-')[0] === 'UnitListItem';
        if (isInstance && refs[ref].state.checked) {
          units.push(ref.slice(ref.indexOf('-') + 1));
        }
      });
      this.props.destroyUnits(units);
      this._selectAllUnits(null, false);
    },

    /**
      Generates a list of unit components.

      @method _generateUnitList
      @param {Object} group A definition for a group of checkboxes .
      @returns {Array} Collection of unit components.
    */
    _generateUnitList: function(group) {
      var key = group.key;
      var unitList = [
        <juju.components.UnitListItem
          key={key}
          label={group.label}
          className='select-all'
          whenChanged={this._selectAllUnits.bind(this, key)}/>
      ];
      group.units.forEach((unit) => {
        var ref = 'UnitListItem-' + unit.id;
        unitList.push(
          <juju.components.UnitListItem
            key={unit.displayName}
            ref={ref}
            label={unit.displayName}
            action={this._unitItemAction}
            unitId={unit.id} />);
      });
      return unitList;
    },

    /**
      Generate the classes for the actions from the props.

      @method _generateActionsClasses
      @returns {String} The collection of class names.
    */
    _generateActionsClasses: function() {
      return classNames(
        'unit-list__actions',
        {
          hidden: this.props.unitStatus
        }
      );
    },

    /**
      Generate the groups of units for the service.

      @method _generateGroups
      @returns {Object} The groups of units for the service.
    */
    _generateGroups: function() {
      var units = this.props.units;
      var groups = {};
      if (this.props.unitStatus === 'error') {
        var errors = {};
        units.forEach(function(unit) {
          var agentState = unit.agent_state_info;
          if (!errors[agentState]) {
            errors[agentState] = [];
          }
          errors[agentState].push(unit);
        });
        Object.keys(errors).forEach(function (error, i) {
          var key = 'select-all-' + i;
          groups[key] = {
            label: error,
            units: errors[error],
            key: key
          };
        });
      } else {
        var key = 'select-all';
        groups[key] = {
          label: 'Select all units',
          units: units,
          key: key
        };
      }
      return groups;
    },

    /**
      Generate the groups of units.

      @returns {Object} The list components
    */
    _generateListGroups: function() {
      var components = [];
      var groups = this._generateGroups();
      Object.keys(groups).forEach(function(key) {
        var group = groups[key];
        components = components.concat(this._generateUnitList(group));
      }, this);
      return components;
    },

    render: function() {
      var buttons = [{
        title: 'Remove',
        action: this._handleRemoveUnits
      }];
      return (
        <div className="unit-list">
          <div className={this._generateActionsClasses()}>
            <juju.components.OverviewAction
              action={this._navigate}
              title="Scale service" />
          </div>
          <ul className="unit-list__units">
            {this._generateListGroups()}
          </ul>
          <juju.components.ButtonRow
            buttons={buttons} />
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'button-row',
  'unit-list-item'
]});
