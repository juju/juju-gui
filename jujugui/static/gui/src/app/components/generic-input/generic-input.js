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

class GenericInput extends React.Component {
  constructor() {
    super();
    this.state = {errors: [], focus: false};
  }

  /**
    Validate the field value.

    @param {Object} evt The trigger event.
    @method validate
  */
  validate(evt) {
    const validate = this.props.validate;
    if (!validate) {
      // If there are no validators then this field should always be valid.
      return true;
    }
    var value = this.getValue();
    var errors = [];
    this.props.validate.forEach((validator) => {
      if ((validator.check && validator.check(value)) ||
        (validator.regex && !validator.regex.test(value))) {
        errors.push(validator.error);
      }
    });
    // Have to always set the state in case there used to be errors, but are
    // no longer.
    this.setState({errors: errors});
    return errors.length === 0;
  }

  /**
    Get the value of the field.

    @method getValue
  */
  getValue() {
    if (this.refs.field) {
      if (this.props.multiLine) {
        return this.refs.field.innerText;
      }
      return this.refs.field.value;
    }
  }

  /**
    Set the value of the field.

    @method setValue
    @param {String} newValue The field's new value.
  */
  setValue(newValue) {
    if (this.refs.field) {
      if (this.props.multiLine) {
        this.refs.field.innerText = newValue;
      } else {
        this.refs.field.value = newValue;
      }
    }
  }

  /**
    Set the focus on the input.

    @method focus
  */
  focus() {
    return this.refs.field.focus();
  }

  /**
    Handle focus events for the input.
    @method _focusHandler
  */
  _focusHandler() {
    this.setState({focus: true});
  }

  /**
    Handle keyup event if set in props.
    @param {Object} evt The keyboard event.
  */
  _keyUpHandler (evt) {
    if (this.props.onKeyUp) {
      this.props.onKeyUp(evt);
    }
  }

  /**
    Handle blur events for the input.
    @method _blurHandler
  */
  _blurHandler(e) {
    this.setState({focus: false});
    this.validate();
    if (this.props.onBlur) {
      this.props.onBlur(e);
    }
  }

  /**
    Call the supplied onChange method with the value of the input.

    @method _callOnChange
  */
  _callOnChange() {
    var onChange = this.props.onChange;
    if (onChange) {
      onChange(this.getValue());
    }
  }

  /**
    Handle the onChange event for a content editable element.

    @method _handleDIVOnchange
  */
  _handleDIVOnchange() {
    this.validate();
    this._callOnChange();
  }

  /**
    Generate the error elements.

    @method _generateErrors
    @returns {Object} The errors markup.
  */
  _generateErrors(evt) {
    const errors = this.state.errors;
    if (errors.length === 0) {
      return null;
    }
    const components = errors.map(error => {
      return (
        <li className="generic-input__error"
          key={error}
          role="alert">
          {error}
        </li>);
    });
    return (
      <ul className="generic-input__errors">
        {components}
      </ul>);
  }

  /**
    Generates a label for the input if the prop is provided.
    @method _generateLabel
  */
  _generateLabel() {
    var label = this.props.label;
    var element, id;
    var classes = classNames(
      'generic-input__label', {
        'generic-input__label--focus': this.state.focus,
        'generic-input__label--value-present': !!this.getValue() ||
          this.props.value,
        'generic-input__label--placeholder-present': !!this.props.placeholder
      }
    );
    if (label) {
      id = label.replace(' ', '-');
      element =
        <label className={classes}
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
    Generates a single or multi line input field.
    @method _generateInput
    @param {String} id The element id.
  */
  _generateInput(id) {
    const disabled = this.props.disabled;
    const errors = this.state.errors.length > 0;
    if (this.props.multiLine) {
      const classes = classNames(
        'generic-input__multiline-field',
        {'generic-input__multiline-field--disabled': disabled});
      return (
        <div
          className={classes}
          contentEditable={!disabled}
          id={id}
          dangerouslySetInnerHTML={{__html: this.props.value}}
          onChange={this._handleDIVOnchange.bind(this)}
          onKeyUp={this._keyUpHandler.bind(this)}
          onFocus={this._focusHandler.bind(this)}
          onBlur={this._blurHandler.bind(this)}
          aria-invalid={errors}
          ref="field">
        </div>);
    }
    return (
      <input className="generic-input__field"
        autoComplete={this.props.autocomplete}
        defaultValue={this.props.value}
        disabled={disabled}
        id={id}
        placeholder={this.props.placeholder}
        required={this.props.required}
        onKeyUp={this._keyUpHandler.bind(this)}
        onFocus={this._focusHandler.bind(this)}
        onBlur={this._blurHandler.bind(this)}
        onChange={this._callOnChange.bind(this)}
        aria-invalid={errors}
        ref="field"
        type={this.props.type} />);
  }

  render() {
    const showErrors = this.state.errors.length > 0 ||
      this.props.hasExternalError;
    var {labelElement, id} = this._generateLabel();
    var classes = classNames(
      'generic-input', {
        'has-error': showErrors
      }
    );
    // If there's an error and an inline icon has been explicitly asked for.
    const errorIcon = showErrors && this.props.inlineErrorIcon ?
      (<juju.components.SvgIcon
        name="relation-icon-error"
        size={16}
      />) : undefined;
    return (
      <div className={classes}>
        {labelElement}
        {this._generateInput(id)}
        {errorIcon}
        {this._generateErrors()}
      </div>
    );
  }
};

GenericInput.propTypes = {
  autocomplete: React.PropTypes.bool,
  disabled: React.PropTypes.bool,
  hasExternalError: React.PropTypes.bool,
  inlineErrorIcon: React.PropTypes.bool,
  label: React.PropTypes.string,
  multiLine: React.PropTypes.bool,
  onBlur: React.PropTypes.func,
  onChange: React.PropTypes.func,
  onFocus: React.PropTypes.func,
  onKeyUp: React.PropTypes.func,
  placeholder: React.PropTypes.string,
  required: React.PropTypes.bool,
  type: React.PropTypes.string,
  validate: React.PropTypes.array,
  value: React.PropTypes.string
};

GenericInput.defaultProps = {
  autocomplete: true,
  required: false,
  type: 'text'
};

YUI.add('generic-input', function() {
  juju.components.GenericInput = GenericInput;
}, '0.1.0', { requires: [
  'svg-icon'
]});
