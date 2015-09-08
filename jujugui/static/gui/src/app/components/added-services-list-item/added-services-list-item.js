/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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

YUI.add('added-services-list-item', function() {

  juju.components.AddedServicesListItem = React.createClass({

    /**
      Parses the supplied unit data to return the status color and number
      to display.

      @method _parseStatusData
      @param {Array} units An array of units.
    */
    _parseStatusData: function(units) {
      var unitStatuses = {
        uncommitted: { priority: 3, size: 0 },
        started: { priority: 2, size: 0 },
        pending: { priority: 1, size: 0 },
        error: { priority: 0, size: 0 },
      };
      var agentState;
      units.forEach(function(unit) {
        agentState = unit.agent_state || 'uncommitted';
        // If we don't have it in our status list then add it to the end
        // with a very low priority.
        if (!unitStatuses[agentState]) {
          unitStatuses[agentState] = { priority: 99, size: 0 };
        }
        unitStatuses[agentState].size += 1;
      });

      var top = { priority: 99, key: '', size: 0 };
      var status;
      for (var key in unitStatuses) {
        status = unitStatuses[key];
        if (status.priority < top.priority && status.size > 0) {
          top = {
            key: key,
            priority: status.priority,
            size: status.size
          };
        }
      }
      // size needs to be a string for test comparison purposes because react
      // converts this to a string for output but doesn't convert it in
      // the js dom.
      top.size = top.size + '';
      return top;
    },

    /**
      Renders and returns the status icon if necessary.

      @method _renderStatusIndicator
      @param {Object} statusData The status data that will be used to generate
        the staus icon.
    */
    _renderStatusIndicator: function(statusData) {
      var shownStatuses = ['uncommitted', 'pending', 'error'];
      var className = 'inspector-view__status--' + statusData.key;
      if (shownStatuses.indexOf(statusData.key) > -1) {
        return (
          <span className={className}>{statusData.size}</span>
        );
      }
    },

    render: function() {
      var service = this.props.service.getAttrs();
      var statusData = this._parseStatusData(service.units.toArray());
      var statusIndicator = this._renderStatusIndicator(statusData);
      return (
        <li className="inspector-view__list-item" tabIndex="0" role="button">
          <img src={service.icon} className="inspector-view__item-icon" />
          <span className="inspector-view__item-count">{service.unit_count}</span> {service.name}
          {statusIndicator}
        </li>
      );
    }

  });

}, '0.1.0', { requires: []});
