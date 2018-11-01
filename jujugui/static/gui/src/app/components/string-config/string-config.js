/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const StringConfigInput = require('./input/input');

class StringConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: this.props.config};
  }

  /**
    Set the value of the field.

    @param value {String} The value to set.
  */
  _setValue(value) {
    this.setState({value: value}, () => {
      const onChange = this.props.onChange;
      if (onChange) {
        onChange();
      }
    });
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

    @method getValue
  */
  getValue() {
    const value = this.state.value;
    let cleanedValue = value;
    // Firefox sometimes adds newlines in contenteditable fields.
    if (value && value.toString().endsWith('\n')) {
      cleanedValue = value.slice(0, value.length - 1);
    }
    return cleanedValue;
  }

  render() {
    var disabled = this.props.disabled;
    var type = this.props.option.type;
    var typeString = type ? ` (${type})` : '';
    const value = this.getValue();
    const config = this.props.config;
    var classes = classNames('string-config--value', {
      'string-config--changed':
        (value !== undefined && value !== null && value.toString()) !==
        (config !== undefined && config !== null && config.toString()),
      'string-config--disabled': disabled
    });
    return (
      <div className="string-config">
        <span className="string-config__label">
          {this.props.option.key}
          {typeString}
        </span>
        <div className={classes}>
          <StringConfigInput
            config={this.props.config}
            disabled={disabled}
            ref="editableInput"
            setValue={this._setValue.bind(this)}
          />
        </div>
        <span
          className="string-config--description"
          dangerouslySetInnerHTML={{__html: this.props.option.description}}
        />
      </div>
    );
  }
}

StringConfig.propTypes = {
  config: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  option: PropTypes.object.isRequired
};

StringConfig.defaultProps = {
  disabled: false
};

module.exports = StringConfig;
