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
    propTypes: {
      service: React.PropTypes.object.isRequired,
    },

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
            id: this.props.service.get('id'),
            activeComponent: this.props.previousComponent || 'units',
            unitStatus: this.props.unitStatus,
            unit: null
          }}});
    },

    /**
      Build a HTML list from an array of ports and an IP address.

      @method _getAddressList
      @param {String} address An IP address.
      @param {Array} ports A list of ports.
      @param {Boolean} clickabl Whether the addresses are clickable.
      @returns {String} HTML of list.
    */
    _getAddressList: function(address, ports, clickable) {
      if (!ports || ports.length === 0 || !address) {
        return;
      }
      var items = [];
      for (var i in ports) {
        // The port can have the protocol e.g. "80/tcp" so we need to just get
        // the port number.
        var port = ports[i].toString().split('/')[0];
        var protocol = port === '443' ? 'https' : 'http';
        var href = `${protocol}://${address}:${port}`;
        var link;
        if (clickable) {
          var link = (
            <a href={href} target="_blank">
              {address}:{port}
            </a>);
        } else {
          var link = (
            <span>
              {address}:{port}
            </span>);
        }
        items.push(
          <li className="unit-details__list-item"
            key={href}>
            {link}
          </li>);
      }
      return (
        <ul className="unit-details__list">
          {items}
        </ul>);
    },

    render: function() {
      var unit = this.props.unit;
      var buttons = [{
        title: 'Remove',
        action: this._handleRemoveUnit
      }];
      var ports = unit.open_ports;
      var privateList = this._getAddressList(
        unit.private_address, ports, true);
      var publicList = this._getAddressList(
        unit.public_address, ports,
        this.props.service.get('exposed'));
      var privatePlural = unit.private_address && ports && ports.length > 1 ?
        'es' : '';
      var publicPlural = unit.public_address && ports && ports.length > 1 ?
        'es' : '';
      return (
        <div className="unit-details">
          <div className="unit-details__properties">
            <p className="unit-details__property">
              Status: {unit.agent_state || 'uncommitted'}
            </p>
            <p className="unit-details__property">
              IP address{privatePlural}: {privateList ? null : 'none'}
            </p>
            {privateList}
            <p className="unit-details__property">
              Public address{publicPlural}: {publicList ? null : 'none'}
            </p>
            {publicList}
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
