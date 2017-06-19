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

const UnitDetails = React.createClass({
  propTypes: {
    acl: React.PropTypes.object.isRequired,
    changeState: React.PropTypes.func.isRequired,
    destroyUnits: React.PropTypes.func.isRequired,
    previousComponent: React.PropTypes.string,
    service: React.PropTypes.object.isRequired,
    unit: React.PropTypes.object.isRequired,
    unitStatus: React.PropTypes.string
  },

  /**
    Handle removing a unit if the button has been clicked.

    @method _handleRemoveUnit
  */
  _handleRemoveUnit: function() {
    this.props.destroyUnits([this.props.unit.id]);
    // Navigate to the unit list for the unit's service.
    this.props.changeState({
      gui: {
        inspector: {
          id: this.props.service.get('id'),
          activeComponent: this.props.previousComponent || 'units',
          unitStatus: this.props.unitStatus,
          unit: null
        }}});
  },

  /**
    Build a HTML list from an array of port ranges and an IP address.

    @param {String} address An IP address.
    @param {Array} portRanges A list of port ranges, each one being an object
      with the following attributes:
        - from: the initial port;
        - to: the last port in the range;
        - single: whether from === to (meaning it's not really a range);
        - protocol: the IP protocol (like "tcp").
    @param {Boolean} clickabl Whether the addresses are clickable.
    @returns {String} HTML of list.
  */
  _generateAddresses: function(address, portRanges, clickable) {
    if (!address) {
      return;
    }
    const createItem = (label, href) => {
      let link = <span>{label}</span>;
      if (href) {
        link = <a href={href} target="_blank">{label}</a>;
      }
      return <li className="unit-details__list-item" key={label}>{link}</li>;
    };
    if (!portRanges || !portRanges.length) {
      return (
        <ul className="unit-details__list">{createItem(address, '')}</ul>
      );
    }
    const items = portRanges.map(portRange => {
      if (portRange.single) {
        const port = portRange.from;
        const label = `${address}:${port}`;
        if (!clickable) {
          return createItem(label, '');
        }
        const protocol = port === 443 ? 'https' : 'http';
        const href = `${protocol}://${label}`;
        return createItem(label, href);
      }
      const range = `${portRange.from}-${portRange.to}`;
      const label = `${address}:${range}/${portRange.protocol}`;
      return createItem(label, '');
    });
    return <ul className="unit-details__list">{items}</ul>;
  },

  /**
    Build a HTML block of statuses for the given unit.

    @param {Object} unit The unit model instance.
    @returns {String} The node with the statuses.
  */
  _generateStatuses: function(unit) {
    if (!unit.agent_state) {
      return <p className="unit-details__property">Status: uncommitted</p>;
    }
    let msg = unit.agent_state;
    if (unit.workloadStatusMessage) {
      msg = `${msg} - ${unit.workloadStatusMessage}`;
    }
    let agent = null;
    if (unit.agentStatus) {
      agent = (
        <p className="unit-details__property">
          Agent Status: {unit.agentStatus}
        </p>
      );
    }
    let workload = null;
    if (unit.workloadStatus) {
      workload = (
        <p className="unit-details__property">
          Workload Status: {unit.workloadStatus}
        </p>
      );
    }
    return (
      <div>
        <p className="unit-details__property">Status: {msg}</p>
        {agent}
        {workload}
      </div>
    );
  },

  render: function() {
    const props = this.props;
    const unit = props.unit;
    const buttons = [{
      disabled: props.acl.isReadOnly(),
      title: 'Remove',
      action: this._handleRemoveUnit
    }];
    const privateList = this._generateAddresses(
      unit.private_address, unit.portRanges, true);
    const publicList = this._generateAddresses(
      unit.public_address, unit.portRanges, props.service.get('exposed'));
    return (
      <div className="unit-details">
        <div className="unit-details__properties">
          {this._generateStatuses(unit)}
          <p className="unit-details__property">
            Public addresses: {publicList ? null : 'none'}
          </p>
          {publicList}
          <p className="unit-details__property">
            IP addresses: {privateList ? null : 'none'}
          </p>
          {privateList}
        </div>
        <juju.components.ButtonRow
          buttons={buttons} />
      </div>
    );
  }

});

YUI.add('unit-details', function() {
  juju.components.UnitDetails = UnitDetails;
}, '0.1.0', { requires: [
  'button-row',
  'inspector-confirm'
]});
