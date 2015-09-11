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
        uncommitted: [],
        started: [],
        pending: [],
        error: [],
      };
      var agentState;
      units.forEach(function(unit) {
        agentState = unit.agent_state || 'uncommitted';
        if (!unitStatuses[agentState]) {
          unitStatuses[agentState] = [];
        }
        unitStatuses[agentState].push(unit);
      });
      var top = {
        key: '',
        size: 0
      };
      for (var key in unitStatuses) {
        var size = unitStatuses[key].length;
        if (size > top.size) {
          top.key = key;
          top.size = size;
        }
      }
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
