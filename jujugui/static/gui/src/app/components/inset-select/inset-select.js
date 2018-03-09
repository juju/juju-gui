/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

class InsetSelect extends React.Component {
  /**
    Get the value of the field.

    @method getValue
  */
  getValue() {
    return this.refs.field.value;
  }

  /**
    Set the value of the field.

    @method getValue
    @param {String} value The value to set the select to.
  */
  setValue(value) {
    this.refs.field.value = value;
  }

  /**
    Call the supplied onChange method with the value of the select.

    @method _callOnChange
  */
  _callOnChange() {
    var onChange = this.props.onChange;
    if (onChange) {
      onChange(this.getValue());
    }
  }

  /**
    Generates a label for the input if the prop is provided.

    @method _generateLabel
    @returns {Object} the element and id.
  */
  _generateLabel() {
    var label = this.props.label;
    var element, id;
    if (label) {
      id = label.replace(' ', '-');
      element = (
        <label className="inset-select__label"
          htmlFor={id}>
          {label}
        </label>);
    }
    return {
      labelElement: element,
      id: id
    };
  }

  /**
    Generate the markup for the provided options.

    @method _generateLabel
    @returns {Array} The list of options markup.
  */
  _generateOptions() {
    return this.props.options.map((option, i) => {
      return (
        <option key={option.value + i}
          value={option.value}>
          {option.label}
        </option>
      );
    });
  }

  /**
    Generate the classes for the field.

    @method _generateClasses
    @returns {String} The list classes.
  */
  _generateClasses() {
    const label = this.props.label ?
      this.props.label.replace(/\W/g, '').toLowerCase() : null;
    return classNames(
      'inset-select',
      {
        [`inset-select--${label}`]: this.props.label,
        'inset-select--disabled': this.props.disabled
      }
    );
  }

  render() {
    var {labelElement, id} = this._generateLabel();
    return (
      <div className={this._generateClasses()}>
        {labelElement}
        <select className="inset-select__field"
          defaultValue={this.props.value}
          disabled={this.props.disabled}
          id={id}
          onChange={this._callOnChange.bind(this)}
          ref="field"
          required={this.props.required}>
          {this._generateOptions()}
        </select>
      </div>
    );
  }
};

InsetSelect.propTypes = {
  disabled: PropTypes.bool,
  label: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.array.isRequired,
  required: PropTypes.bool,
  value: PropTypes.string
};

module.exports = InsetSelect;
