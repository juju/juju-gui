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

YUI.add('inspector-expose-unit', function() {

  juju.components.InspectorExposeUnit = React.createClass({

    propTypes: {
      action: React.PropTypes.func.isRequired,
      unit: React.PropTypes.object.isRequired
    },

    /**
      Don't bubble the click event to the parent.

      @method _stopBubble
      @param {Object} The click event.
    */
    _stopBubble: function(e) {
      e.stopPropagation();
    },

    /**
      Build a HTML list from an array of ports and an IP address.

      @method _getAddressList
      @param {String} address An IP address.
      @param {Array} portRanges A list of port ranges.
      @returns {String} HTML of list
    */
    _getAddressList: function(address, portRanges) {
      if (!portRanges || !portRanges.length || !address) {
        return (
          <div className="inspector-expose__unit-detail">
            No public address
          </div>);
      }
      const items = portRanges.map(portRange => {
        if (portRange.single) {
          const port = portRange.from;
          const label = `${address}:${port}`;
          const protocol = port === 443 ? 'https' : 'http';
          const href = `${protocol}://${label}`;
          return (
            <li className="inspector-expose__item" key={href}>
              <a href={href} onClick={this._stopBubble} target="_blank">
                {label}
              </a>
            </li>
          );
        }
        const range = `${portRange.from}-${portRange.to}`;
        const label = `${address}:${range}/${portRange.protocol}`;
        return (
          <li className="inspector-expose__item" key={label}>
            <span>{label}</span>
          </li>
        );
      });
      return <ul className="inspector-expose__unit-list">{items}</ul>;
    },

    render: function() {
      var unit = this.props.unit;
      var publicList = this._getAddressList(
        unit.public_address, unit.portRanges);
      return (
        <li className="inspector-expose__unit" tabIndex="0" role="button"
          data-id={unit.id}
          onClick={this.props.action}>
            <div className="inspector-expose__unit-detail">
                {unit.displayName}
            </div>
            {publicList}
        </li>
      );
    }

  });

}, '0.1.0', { requires: []});
