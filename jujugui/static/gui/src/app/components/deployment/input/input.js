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

YUI.add('deployment-input', function() {

  juju.components.DeploymentInput = React.createClass({

    propTypes: {
      disabled: React.PropTypes.bool,
      label: React.PropTypes.string,
      placeholder: React.PropTypes.string.isRequired,
      required: React.PropTypes.bool,
      validate: React.PropTypes.array,
      value: React.PropTypes.string,
    },


    getDefaultProps: () => {
      return {
        required: false
      };
    },

    getInitialState: function() {
      return {errors: null};
    },

    /**
      Validate the field value.

      @method validate
    */
    validate: function() {
      var value = this.getValue();
      var errors = [];
      var components;
      this.props.validate.forEach((validator) => {
        if (!validator.regex.test(value)) {
          var error = validator.error;
          errors.push(
            <li className="deployment-input__error"
              key={error}>
              {error}
            </li>);
        }
      });
      if (errors.length > 0) {
        components = (
          <ul className="deployment-input__errors">
            {errors}
          </ul>);
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
      return this.refs.field.value;
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
          <label className="deployment-input__label"
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
      return (
        <div className="deployment-input">
          {labelElement}
          <input className="deployment-input__field"
            defaultValue={this.props.value}
            disabled={this.props.disabled}
            id={id}
            placeholder={this.props.placeholder}
            required={this.props.required}
            onChange={this.validate}
            ref="field"
            type="text" />
          {this.state.errors}
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
]});
