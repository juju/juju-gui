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

YUI.add('boolean-config', function() {

  juju.components.BooleanConfig = React.createClass({

    getInitialState: function() {
      var config = this.props.config;
      // If the type of the value is a boolean but we have to stringify all
      // values when sending them to juju-core so this value could be a string
      // representation of a boolean value.
      if (typeof config === 'string') {
        config = config.toLowerCase() === 'true' ? true : false;
      }
      return { value: config };
    },

    /**
      Handles the checkbox change action.

      @method _handleChange
      @param {Object} The change event from the checkbox.
    */
    _handleChange: function(e) {
      this.setState({ value: e.currentTarget.checked });
    },

    /**
      Don't bubble the click event to the parent.

      @method _stopBubble
      @param {Object} The click event from the checkbox.
    */
    _stopBubble: function(e) {
      e.stopPropagation();
    },

    render: function() {
      return (
        <div className="boolean-config">
          <div className="boolean-config--title">{this.props.option.key}: </div>
          <div className="boolean-config--toggle">
            <input
              type="checkbox"
              id={this.props.option.key}
              onClick={this._stopBubble}
              onChange={this._handleChange}
              checked={this.state.value}
              className="boolean-config--input" />
            <label
              htmlFor={this.props.option.key}
              className="boolean-config--label">
              <div className="boolean-config--handle"></div>
            </label>
          </div>
          <div className="boolean-config--description">
            {this.props.option.description}
          </div>
        </div>
      );
    }
  });

}, '0.1.0', { requires: [] });
