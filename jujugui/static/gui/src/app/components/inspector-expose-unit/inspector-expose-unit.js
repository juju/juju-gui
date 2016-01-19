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
      @returns {String} HTML of list
    */
    _getAddressList: function(address, ports) {
      if (!ports || ports.length === 0 || !address) {
        return (
          <div className="inspector-expose__unit-detail">
            No public address
          </div>);
      }
      var items = [];
      for (var i in ports) {
        // The port can have the protocol e.g. "80/tcp" so we need to just get
        // the port number.
        var port = ports[i].toString().split('/')[0];
        var href = `http://${address}:${port}`;
        items.push(
          <li className="inspector-expose__unit-list-item"
            key={href}>
            <a href={href}
              onClick={this._stopBubble}
              target="_blank">
              {address}:{port}
            </a>
          </li>);
      }
      return (
        <ul className="inspector-expose__unit-list">
          {items}
        </ul>);
    },

    render: function() {
      var unit = this.props.unit;
      var publicList = this._getAddressList(
        unit.public_address, unit.open_ports);
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
