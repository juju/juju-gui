/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

class FileField extends React.Component {
  constructor() {
    super();
    this.ready = true;
    this.state = {
      errors: null,
      contents: null
    };
  }

  /**
    Validate the field value.

    @method validate
  */
  validate() {
    const errors = [];
    let components;
    if (this.props.required && this.refs.field.files.length === 0) {
      errors.push(
        <li className="file-field__error" key="required">
          This field is required.
        </li>);
    }
    if (!this.ready) {
      errors.push(
        <li className="file-field__error" key="partial-upload">
          File upload is not completed.
        </li>);
    }
    if (errors.length > 0) {
      components = (
        <ul className="file-field__errors">
          {errors}
        </ul>);
    } else {
      this._handleFileChange();
    }
    // Have to always set the state in case there used to be errors, but are
    // no longer.
    this.setState({errors: components});
    return errors.length === 0;
  }

  /**
    Get the value of the field.

    @method getValue
  */
  getValue() {
    return this.state.contents;
  }

  /**
    Set the focus on the input.

    @method focus
  */
  focus() {
    return this.refs.field.focus();
  }

  /**
    Set up and return a new file reader.

    @method _newFileReader
    @return {FileReader} The file reader.
  */
  _newFileReader() {
    const reader = new FileReader();
    reader.onload = evt => {
      // TODO frankban: handle errors.
      this.setState({contents: evt.target.result});
      this.ready = true;
    };
    return reader;
  }

  /**
    Handle uploading the file and getting the value.

    @method _handleFileChange
  */
  _handleFileChange() {
    this.ready = false;
    const reader = this._newFileReader();
    const file = this.refs.field.files[0];
    reader.readAsText(file);
  }

  /**
    Generates a label for the input if the prop is provided.

    @method _generateLabel
  */
  _generateLabel() {
    let label = this.props.label;
    const contents = this.state.contents;
    let element, id;
    if (label) {
      id = label.split(' ').join('-');
      if (contents) {
        label = 'File stored.';
      }
      element = (
        <label className="file-field__label"
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
    Render the component.

    @method render
  */
  render() {
    const {labelElement, id} = this._generateLabel();
    const classes = classNames(
      'file-field', {
        error: !!this.state.errors
      }
    );
    return (
      <div className={classes}>
        <input accept={this.props.accept}
          className="file-field__field"
          disabled={this.props.disabled}
          id={id}
          onChange={this.validate.bind(this)}
          ref="field"
          required={this.props.required}
          type="file" />
        {labelElement}
        {this.state.errors}
      </div>
    );
  }
};

FileField.propTypes = {
  accept: PropTypes.string,
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  required: PropTypes.bool
};

FileField.defaultProps = {
  required: false
};

module.exports = FileField;
