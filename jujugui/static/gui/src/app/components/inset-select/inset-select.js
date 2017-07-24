/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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
      element =
        <label className="inset-select__label"
          htmlFor={id}>
          {label}
        </label>;
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
          required={this.props.required}
          ref="field">
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

YUI.add('inset-select', function() {
  juju.components.InsetSelect = InsetSelect;
}, '0.1.0', { requires: [
]});
