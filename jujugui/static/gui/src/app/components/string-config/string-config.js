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

YUI.add('string-config', function() {

  juju.components.StringConfig = React.createClass({
    displayName: 'StringConfig',

    propTypes: {
      config: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number
      ]),
      disabled: React.PropTypes.bool,
      onChange: React.PropTypes.func,
      option: React.PropTypes.object.isRequired
    },

    getDefaultProps: () => {
      return {
        disabled: false
      };
    },

    getInitialState: function() {
      return { value: this.props.config };
    },

    /**
      Set the value of the field.

      @param value {String} The value to set.
    */
    _setValue: function(value) {
      this.setState({value: value}, () => {
        const onChange = this.props.onChange;
        if (onChange) {
          onChange();
        }
      });
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

      @method getValue
    */
    getValue: function() {
      return this.state.value;
    },

    render: function() {
      var disabled = this.props.disabled;
      var type = this.props.option.type;
      var typeString = type ? ` (${type})` : '';
      const value = this.state.value;
      const config = this.props.config;
      var classes = classNames(
        'string-config--value',
        {
          'string-config--changed':
            (value && value.toString()) !== (config && config.toString()),
          'string-config--disabled': disabled
        });
      return (
        <div className="string-config">
          <span className="string-config__label">
            {this.props.option.key}{typeString}
          </span>
          <div className={classes}>
            <juju.components.StringConfigInput
              config={this.props.config}
              disabled={disabled}
              ref="editableInput"
              setValue={this._setValue} />
          </div>
          <span className="string-config--description"
            dangerouslySetInnerHTML={{__html: this.props.option.description}}>
          </span>
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'string-config-input'
] });
