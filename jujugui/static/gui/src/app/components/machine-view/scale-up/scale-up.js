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

class MachineViewScaleUp extends React.Component {
  /**
    Display a list of applications.

    @method _generateServices
    @returns {Object} A unit list or onboarding.
  */
  _generateServices() {
    const components = [];
    const applications = this.props.dbAPI.applications.toArray();
    applications.forEach((service) => {
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
  }

  /**
    Add units to the applications.

    @method _handleAddUnits
    @param {Object} evt An event object.
  */
  _handleAddUnits(evt) {
    if (evt) {
      evt.preventDefault();
    }
    const re = /(scaleUpUnit-)(.*)/;
    const props = this.props;
    Object.keys(this.refs).forEach((ref) => {
      const parts = re.exec(ref);
      if (parts) {
        const application = props.dbAPI.applications.getById(parts[2]);
        props.dbAPI.addGhostAndEcsUnits(application, this.refs[ref].value);
      }
    });
    props.toggleScaleUp();
  }

  render() {
    var buttons = [{
      action: this.props.toggleScaleUp,
      title: 'Cancel',
      type: 'base'
    }, {
      action: this._handleAddUnits.bind(this),
      disabled: this.props.acl.isReadOnly(),
      title: 'Add units',
      type: 'neutral'
    }];
    return (
      <form className="machine-view__scale-up"
        onSubmit={this._handleAddUnits.bind(this)}>
        {this._generateServices()}
        <juju.components.ButtonRow buttons={buttons} />
      </form>
    );
  }
};

MachineViewScaleUp.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired
  }).frozen.isRequired,
  dbAPI: shapeup.shape({
    addGhostAndEcsUnits: PropTypes.func.isRequired,
    applications: PropTypes.object.isRequired
  }).isRequired,
  toggleScaleUp: PropTypes.func.isRequired
};

YUI.add('machine-view-scale-up', function() {
  juju.components.MachineViewScaleUp = MachineViewScaleUp;
}, '0.1.0', {
  requires: [
    'button-row'
  ]
});
