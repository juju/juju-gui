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

YUI.add('added-services-list-item', function() {

  juju.components.AddedServicesListItem = React.createClass({

    propTypes: {
      getUnitStatusCounts: React.PropTypes.func.isRequired,
      hovered: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.bool
      ]),
      hoverService: React.PropTypes.func.isRequired,
      changeState: React.PropTypes.func.isRequired,
      panToService: React.PropTypes.func.isRequired,
      service: React.PropTypes.object.isRequired
    },

    /**
      Parses the supplied unit data to return the status color and number
      to display.

      @method _getPriorityUnits
      @param {Array} units An array of units.
    */
    _getPriorityUnits: function(units) {
      var unitStatuses = this.props.getUnitStatusCounts(units);
      var top = { priority: 99, key: '', size: 0 };
      var status;
      for (var key in unitStatuses) {
        status = unitStatuses[key];
        if (key !== 'started' && status.priority < top.priority &&
            status.size > 0) {
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
        the status icon.
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

    /**
      Click handler for clicks on the entire list item.

      @method _onClickHandler
      @param {Object} e The click event.
    */
    _onClickHandler: function(e) {
      this.props.panToService(this.props.service.get('id'));
      var state = {
        sectionA: {
          component: 'inspector',
          metadata: { id: e.currentTarget.getAttribute('data-serviceid') }
        }
      };
      this.props.changeState(state);
    },

    _generateClassName: function() {
      var props = this.props;
      var service = props.service;
      return classNames(
        'inspector-view__list-item',
        {
          'visibility-toggled': service.get('highlight') || service.get('fade'),
          hover: props.hovered
        }
      );
    },

    /**
      Handle highlighting a service token when the item is hovered.

      @method _onMouseEnter
      @param {Object} e The mouse event.
    */
    _onMouseEnter: function(e) {
      this.props.hoverService(this.props.service.get('id'), true);
    },

    /**
      Handle unhighlighting a service token when the item is no longer hovered.

      @method _onMouseLeave
      @param {Object} e The mouse event.
    */
    _onMouseLeave: function(e) {
      this.props.hoverService(this.props.service.get('id'), false);
    },

    render: function() {
      var service = this.props.service.getAttrs();
      var statusData = this._getPriorityUnits(service.units.toArray());
      var statusIndicator = this._renderStatusIndicator(statusData);
      return (
        <li className={this._generateClassName()}
            data-serviceid={service.id}
            onClick={this._onClickHandler}
            onMouseEnter={this._onMouseEnter}
            onMouseLeave={this._onMouseLeave}
            tabIndex="0"
            role="button">
          <img src={service.icon} className="inspector-view__item-icon" />
          <span className="inspector-view__item-count">
            {service.unit_count}
          </span>
          {' '}
          <span className="inspector-view__item-name">
            {service.name}
          </span>
          <span className="inspector-view__status-block">
            {statusIndicator}
          </span>
        </li>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'svg-icon'
  ]
});
