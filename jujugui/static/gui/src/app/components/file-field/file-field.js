/*
This file is part of the Juju GUI, which lets users view and manage Juju
models within a graphical interface (https://github.com/juju/juju-gui).
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
      id = label.replace(' ', '-');
      if (contents) {
        label = 'File stored.';
      }
      element =
        <label className="file-field__label"
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
          required={this.props.required}
          onChange={this.validate}
          ref="field"
          type="file" />
        {labelElement}
        {this.state.errors}
      </div>
    );
  }
};

FileField.propTypes = {
  accept: React.PropTypes.string,
  disabled: React.PropTypes.bool,
  label: React.PropTypes.string.isRequired,
  required: React.PropTypes.bool
};

FileField.defaultProps = {
  required: false
};

YUI.add('file-field', function() {
  juju.components.FileField = FileField;
}, '0.1.0', { requires: []});
