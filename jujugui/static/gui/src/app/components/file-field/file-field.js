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

YUI.add('file-field', function() {

  juju.components.FileField = React.createClass({

    propTypes: {
      accept: React.PropTypes.string,
      disabled: React.PropTypes.bool,
      label: React.PropTypes.string,
      required: React.PropTypes.bool,
    },

    getDefaultProps: () => {
      return {
        required: false
      };
    },

    getInitialState: function() {
      return {
        errors: null,
        contents: null
      };
    },

    /**
      Validate the field value.

      @method validate
    */
    validate: function() {
      var errors = [];
      var components;
      if (this.props.required && this.refs.field.files.length === 0) {
        errors.push(
          <li className="file-field__error"
            key="required">
            This field is required.
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
    },

    /**
      Get the value of the field.

      @method getValue
    */
    getValue: function() {
      return this.state.contents;
    },

    /**
      Set the focus on the input.

      @method focus
    */
    focus: function() {
      return this.refs.field.focus();
    },

    /**
      Handle uploading the file and getting the value.

      @method _handleFileChange
    */
    _handleFileChange: function() {
      const reader = new FileReader();
      const file = this.refs.field.files[0];
      reader.onload = e => {
        this.setState({contents: e.target.result});
      };
      reader.readAsText(file);
    },

    /**
      Generates a label for the input if the prop is provided.
      @method _generateLabel
    */
    _generateLabel: function() {
      var label = this.props.label;
      var element, id;
      if (label) {
        id = label.replace(' ', '-');
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
    },


    render: function() {
      var {labelElement, id} = this._generateLabel();
      var classes = classNames(
        'file-field', {
          error: !!this.state.errors
        }
      );
      return (
        <div className={classes}>
          {labelElement}
          <input accept={this.props.accept}
            className="file-field__field"
            disabled={this.props.disabled}
            id={id}
            required={this.props.required}
            onChange={this.validate}
            ref="field"
            type="file" />
          {this.state.errors}
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
]});
