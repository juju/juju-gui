/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

class BooleanConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: this._cleanConfig(this.props.config) };
  }

  /**
    Get the option key.

    @returns {String} the option key.
  */
  getKey() {
    return this.props.option.key;
  }

  /**
    Get the value of the field.

   @returns {String} the value.
  */
  getValue() {
    return this.state.value;
  }

  /**
    Handles cleaning the config from the props.

    @method _cleanConfig
    @param {Multiple} The config property.
    @returns {Boolean} The config as a boolean.
  */
  _cleanConfig(config) {
    // If the type of the value is a boolean but we have to stringify all
    // values when sending them to juju-core so this value could be a string
    // representation of a boolean value.
    if (typeof config === 'string') {
      config = config.toLowerCase() === 'true' ? true : false;
    }
    return config;
  }

  /**
    Handles the checkbox change action.

    @method _handleChange
    @param {Object} The change event from the checkbox.
  */
  _handleChange(e) {
    const onChange = this.props.onChange;
    // Due to a bug in React we must use target here because we aren't able
    // to simulate changes on currentTarget.
    // https://github.com/facebook/react/issues/4950
    this.setState({ value: e.target.checked }, () => {
      if (onChange) {
        onChange();
      }
    });
  }

  /**
    Don't bubble the click event to the parent.

    @method _stopBubble
    @param {Object} The click event from the checkbox.
  */
  _stopBubble(e) {
    e.stopPropagation();
  }

  render() {
    const classes = classNames(
      'boolean-config--label',
      {
        'boolean-config--label-changed':
          this.state.value !== this.props.config
      });
    return (
      <div className="boolean-config">
        <div className="boolean-config--toggle-container">
          <div className="boolean-config--title">{this.props.label}</div>
          <div className="boolean-config--toggle">
            <input
              className="boolean-config--input"
              defaultChecked={this.state.value}
              disabled={this.props.disabled}
              id={this.props.option.key}
              onChange={this._handleChange.bind(this)}
              onClick={this._stopBubble.bind(this)}
              type="checkbox" />
            <label
              className={classes}
              htmlFor={this.props.option.key}>
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
};

BooleanConfig.propTypes = {
  config: PropTypes.any.isRequired,
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  option: PropTypes.object.isRequired
};

BooleanConfig.defaultProps = {
  disabled: false
};

module.exports = BooleanConfig;
