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

YUI.add('deployment-change-item', function() {

  juju.components.DeploymentChangeItem = React.createClass({

    propTypes: {
      change: React.PropTypes.object.isRequired,
      showTime: React.PropTypes.bool
    },

    getDefaultProps: function() {
      return {showTime: true};
    },

    /**
      Generate the icon node.

      @method _generateIcon
      @param {String} icon The icon to display.
      @returns {Object} The icon node.
    */
    _generateIcon: function(icon) {
      var node;
      var className = 'deployment-change-item__icon';
      if (icon.indexOf('.svg') > -1) {
        node = <img src={icon} alt="" className={className} />;
      } else {
        node = (
          <juju.components.SvgIcon name={icon}
            className={className}
            size="16" />);
      }
      return node;
    },

    /**
      Generate the time if required.

      @method _generateTime
      @returns {Object} The time markup.
    */
    _generateTime: function() {
      if (!this.props.showTime) {
        return;
      }
      return (
        <span className="deployment-change-item__time">
          {this.props.change.time}
        </span>);
    },

    render: function() {
      var change = this.props.change;
      return (
        <li className="deployment-change-item">
          <span className="deployment-change-item__change">
            {this._generateIcon(change.icon)}
            {change.description}
          </span>
          {this._generateTime()}
        </li>
      );
    }
  });

}, '0.1.0', { requires: [
  'svg-icon'
]});
