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
      Get the current state of the inspector.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      return {
        confirmationOpen: this.props.confirmationOpen
      };
    },

    /**
      Set the confirmation state to open.
      @method _showConfirmation
    */
    _showConfirmation: function() {
      this.setState({confirmationOpen: true});
    },

    /**
      Set the confirmation state to closed.
      @method _hideConfirmation
    */
    _hideConfirmation: function() {
      this.setState({confirmationOpen: false});
    },

    render: function() {
      var unit = this.props.unit;
      var buttons = [{
        title: 'Remove',
        action: this._showConfirmation
        }];
      var confirmMessage = 'Are you sure you want to remove the unit? ' +
        'This cannot be undone.';
      var confirmButtons = [
        {
          title: 'Cancel',
          action: this._hideConfirmation
          },
        {
          title: 'Confirm',
          type: 'confirm'
          }
        ];
      return (
        <div className="unit-details">
          <div className="unit-details__properties">
            <p>IP address: {unit.private_address || 'none'}</p>
            <p>Status: {unit.agent_state || 'uncommitted'}</p>
            <p>Public address: {unit.public_address || 'none'}</p>
          </div>
          <juju.components.ButtonRow
            buttons={buttons} />
          <juju.components.InspectorConfirm
            buttons={confirmButtons}
            message={confirmMessage}
            open={this.state.confirmationOpen} />
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'button-row',
  'inspector-confirm'
]});
