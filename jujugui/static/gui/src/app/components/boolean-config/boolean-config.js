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

const BooleanConfig = React.createClass({
  displayName: 'BooleanConfig',

  propTypes: {
    config: React.PropTypes.any.isRequired,
    disabled: React.PropTypes.bool,
    label: React.PropTypes.string,
    onChange: React.PropTypes.func,
    option: React.PropTypes.object.isRequired
  },

  getDefaultProps: () => {
    return {
      disabled: false
    };
  },

  getInitialState: function() {
    return { value: this._cleanConfig(this.props.config) };
  },

  /**
    Get the option key.

    @returns {String} the option key.
  */
  getKey: function() {
    return this.props.option.key;
  },

  /**
    Get the value of the field.

   @returns {String} the value.
  */
  getValue: function() {
    return this.state.value;
  },

  /**
    Handles cleaning the config from the props.

    @method _cleanConfig
    @param {Multiple} The config property.
    @returns {Boolean} The config as a boolean.
  */
  _cleanConfig: function(config) {
    // If the type of the value is a boolean but we have to stringify all
    // values when sending them to juju-core so this value could be a string
    // representation of a boolean value.
    if (typeof config === 'string') {
      config = config.toLowerCase() === 'true' ? true : false;
    }
    return config;
  },

  /**
    Handles the checkbox change action.

    @method _handleChange
    @param {Object} The change event from the checkbox.
  */
  _handleChange: function(e) {
    const onChange = this.props.onChange;
    // Due to a bug in React we must use target here because we aren't able
    // to simulate changes on currentTarget.
    // https://github.com/facebook/react/issues/4950
    this.setState({ value: e.target.checked }, () => {
      if (onChange) {
        onChange();
      }
    });
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
    const classes = classNames(
      'boolean-config--label',
      {
        'boolean-config--label-changed':
          this.state.value !== this.props.config
      });
    const labelElement = this.props.label ? (
      <div className="boolean-config--title">{this.props.label}</div>) : null;
    return (
      <div className="boolean-config">
        <div className="boolean-config--toggle-container">
          {labelElement}
          <div className="boolean-config--toggle">
            <input
              disabled={this.props.disabled}
              type="checkbox"
              id={this.props.option.key}
              onClick={this._stopBubble}
              onChange={this._handleChange}
              defaultChecked={this.state.value}
              className="boolean-config--input" />
            <label
              htmlFor={this.props.option.key}
              className={classes}>
              <div className="boolean-config--handle"></div>
            </label>
          </div>
        </div>
        <div className="boolean-config--description"
          dangerouslySetInnerHTML={{__html: this.props.option.description}}>
        </div>
      </div>
    );
  }
});

YUI.add('boolean-config', function() {
  juju.components.BooleanConfig = BooleanConfig;
}, '0.1.0', { requires: [] });
