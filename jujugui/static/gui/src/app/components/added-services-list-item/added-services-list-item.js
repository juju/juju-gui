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
      focusService: React.PropTypes.func.isRequired,
      unfocusService: React.PropTypes.func.isRequired,
      fadeService: React.PropTypes.func.isRequired,
      unfadeService: React.PropTypes.func.isRequired,
      getUnitStatusCounts: React.PropTypes.func.isRequired,
      changeState: React.PropTypes.func.isRequired,
      service: React.PropTypes.object.isRequired
    },

    getInitialState: function() {
      var service = this.props.service;
      return {
        focus: service.get('highlight') || false,
        fade: service.get('fade') || false
      };
    },

    componentWillReceiveProps: function(nextProps) {
      var service = this.props.service;
      this.setState({focus: service.get('highlight')});
      this.setState({fade: service.get('fade')});
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
      var state = {
        sectionA: {
          component: 'inspector',
          metadata: { id: e.currentTarget.getAttribute('data-serviceid') }
        }
      };
      this.props.changeState(state);
    },

    /**
      Toggles the focus attribute on the service

      @method _toggleFocus
      @param {Object} e The click event.
    */
    _toggleFocus: function(e) {
      // We need to stop the propagation so that the click event doesn't
      // bubble up to the list item and navigate away.
      e.stopPropagation();
      var props = this.props;
      var focus = !this.state.focus;
      this.setState({focus: focus});
      var serviceId = props.service.get('id');
      if (focus) {
        this.setState({fade: false});
        props.focusService(serviceId);
      } else {
        props.unfocusService(serviceId);
      }
    },

    /**
      Toggles the highlight attribute on the service

      @method _toggleHighlight
      @param {Object} e The click event.
    */
    _toggleHighlight: function(e) {
      // We need to stop the propagation so that the click event doesn't
      // bubble up to the list item and navigate away.
      e.stopPropagation();
      var props = this.props;
      var fade = !this.state.fade;
      this.setState({fade: fade});
      var serviceId = props.service.get('id');
      if (fade) {
        this.setState({focus: false});
        props.fadeService(serviceId);
      } else {
        props.unfadeService(serviceId);
      }
    },

    _generateClassName: function() {
      return classNames(
        'inspector-view__list-item',
        {
          'visibility-toggled': this.state.focus || this.state.fade,
          hover: this.props.hovered
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
      var state = this.state;
      var service = this.props.service.getAttrs();
      var statusData = this._getPriorityUnits(service.units.toArray());
      var statusIndicator = this._renderStatusIndicator(statusData);
      var focusIcon = state.focus ? 'focused_16' : 'unfocused_16';
      var highlightIcon = state.fade ? 'hide_16' : 'show_16';
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
            <span
              className="inspector-view__visibility-toggle"
              ref="focusVisibilityIcon"
              onClick={this._toggleFocus}>
              <juju.components.SvgIcon name={focusIcon} size="16"/>
            </span>
            <span
              className="inspector-view__visibility-toggle"
              ref="fadeVisibilityIcon"
              onClick={this._toggleHighlight}>
              <juju.components.SvgIcon name={highlightIcon} size="16"/>
            </span>
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
