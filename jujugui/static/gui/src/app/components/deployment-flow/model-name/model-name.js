/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericInput = require('../../generic-input/generic-input');

class DeploymentModelName extends React.Component {

  componentDidMount() {
    const modelName = this.refs.modelName;
    if (modelName) {
      modelName.focus();
    }
  }

  /**
    Updates the db's environment name when the model name is changed
    in the deployment panel.

    @param evt {Object} The blur event.
  */
  _updateModelName(evt) {
    const modelName = evt.currentTarget.value;
    this.setState({modelName: modelName});
    if (modelName !== '') {
      this.props.setModelName(modelName);
    }
  }

  render() {
    const ddEntity = this.props.ddEntity;
    let value = this.props.modelName;
    if (value === 'mymodel' && ddEntity) {
      value = ddEntity.get('name');
    }
    return (
      <div className="six-col no-margin-bottom">
        <GenericInput
          disabled={this.props.acl.isReadOnly()}
          key="modelName"
          label="Model name"
          required={true}
          onBlur={this._updateModelName.bind(this)}
          ref="modelName"
          validate={[{
            regex: /\S+/,
            error: 'This field is required.'
          }, {
            regex: /^([a-z0-9]([a-z0-9-]*[a-z0-9])?)?$/,
            error: 'This field must only contain lowercase ' +
              'letters, numbers, and hyphens. It must not start or ' +
              'end with a hyphen.'
          }]}
          value={value} />
      </div>
    );
  }
};

DeploymentModelName.propTypes = {
  acl: PropTypes.object.isRequired,
  ddEntity: PropTypes.object,
  modelName: PropTypes.string.isRequired,
  setModelName: PropTypes.func.isRequired
};

module.exports = DeploymentModelName;
