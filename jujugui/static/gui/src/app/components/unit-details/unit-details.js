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

YUI.add('unit-details', function() {

  juju.components.UnitDetails = React.createClass({

    /**
      Handle removing a unit if the button has been clicked.

      @method _handleRemoveUnit
    */
    _handleRemoveUnit: function() {
      this.props.destroyUnits([this.props.unit.id]);
      // Navigate to the unit list for the unit's service.
      this.props.changeState({
        sectionA: {
          component: 'inspector',
          metadata: {
            id: this.props.serviceId,
            activeComponent: 'units',
            unitStatus: this.props.unitStatus,
            unit: null
          }}});
    },

    render: function() {
      var unit = this.props.unit;
      var buttons = [{
        title: 'Remove',
        action: this._handleRemoveUnit
      }];
      return (
        <div className="unit-details">
          <div className="unit-details__properties">
            <p className="unit-details__property">
              IP address: {unit.private_address || 'none'}
            </p>
            <p className="unit-details__property">
              Status: {unit.agent_state || 'uncommitted'}
            </p>
            <p className="unit-details__property">
              Public address: {unit.public_address || 'none'}
            </p>
          </div>
          <juju.components.ButtonRow
            buttons={buttons} />
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'button-row',
  'inspector-confirm'
]});
