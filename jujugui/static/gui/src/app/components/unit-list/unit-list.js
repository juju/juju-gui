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
    _navigate: function(e) { },

    /**
      Generates a list of unit components.

      @method _generateUnitList
      @param {Array} units Collection of units.
      @returns {Array} Collection of unit components.
    */
    _generateUnitList: function(units) {
      var components = [
        <juju.components.UnitListItem
          key='select-all'
          label='Select all units'/>
      ];
      units.forEach((unit) => {
        components.push(
          <juju.components.UnitListItem
            key={unit.displayname}
            label={unit.displayName} />);
      });
      return components;
    },

    render: function() {
      var units = this._generateUnitList(this.props.units.toArray());
      return (
        <div className="unit-list">
          <div className="unit-list__actions">
            <juju.components.OverviewAction
              action={this._navigate}
              title="Scale Service" />
          </div>
          <ul>
            {units}
          </ul>
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'unit-list-item'
]});
