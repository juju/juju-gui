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

YUI.add('machine-view-scale-up', function() {

  juju.components.MachineViewScaleUp = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addGhostAndEcsUnits: React.PropTypes.func.isRequired,
      services: React.PropTypes.object.isRequired,
      toggleScaleUp: React.PropTypes.func.isRequired
    },

    /**
      Display a list of services.

      @method _generateServices
      @returns {Object} A unit list or onboarding.
    */
    _generateServices: function() {
      var components = [];
      var services = this.props.services.toArray();
      services.forEach((service) => {
        if (service.get('subordinate')) {
          return;
        }
        components.push(
          <li className="machine-view__scale-up-unit"
            key={service.get('id')}>
            <img alt={service.get('name')}
              className="machine-view__scale-up-unit-icon"
              src={service.get('icon')} />
            <div className="machine-view__scale-up-unit-name"
              title={service.get('name')}>
              {service.get('name')}
            </div>
            <input
              className="machine-view__scale-up-unit-input"
              disabled={this.props.acl.isReadOnly()}
              placeholder="units"
              ref={'scaleUpUnit-' + service.get('id')}
              type="number"
              min="0"
              step="1" />
          </li>);
      });
      return (
        <ul className="machine-view__scale-up-units">
          {components}
        </ul>);
    },

    /**
      Add units to the services.

      @method _handleAddUnits
      @param {Object} e An event object.
    */
    _handleAddUnits: function(e) {
      if (e) {
        e.preventDefault();
      }
      var re = /(scaleUpUnit-)(.*)/;
      Object.keys(this.refs).forEach((ref) => {
        var parts = re.exec(ref);
        if (parts) {
          var service = this.props.services.getById(parts[2]);
          this.props.addGhostAndEcsUnits(service, this.refs[ref].value);
        }
      });
      this.props.toggleScaleUp();
    },

    render: function() {
      var buttons = [{
        action: this.props.toggleScaleUp,
        title: 'Cancel',
        type: 'base'
      }, {
        action: this._handleAddUnits,
        disabled: this.props.acl.isReadOnly(),
        title: 'Add units',
        type: 'neutral'
      }];
      return (
        <form className="machine-view__scale-up"
           onSubmit={this._handleAddUnits}>
          {this._generateServices()}
          <juju.components.ButtonRow buttons={buttons} />
        </form>
      );
    }
  });
}, '0.1.0', {
  requires: [
    'button-row'
  ]
});
