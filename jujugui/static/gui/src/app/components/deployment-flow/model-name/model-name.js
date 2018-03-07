/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericInput = require('../../generic-input/generic-input');

class DeploymentModelName extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modelNames: []
    };
  }

  componentDidMount() {
    const modelName = this.refs.modelName;
    if (modelName) {
      modelName.focus();
    }
    this._getModels();
  }

  /**
    Get the user's models
  */
  _getModels() {
    this.props.listModelsWithInfo((error, models) => {
      const modelNames = models.map(model => model.name);
      this.setState({ modelNames });
    });
  }

  /**
    Updates the db's environment name when the model name is changed
    in the deployment panel.

    @param evt {Object} The blur event.
  */
  _updateModelName(evt) {
    let modelName = '';
    // This method is called onChange and onBlur and the argument signature
    // differs for these two events.
    modelName = typeof evt === 'string' ? evt : evt.currentTarget.value;
    this.setState({modelName: modelName});
    if (modelName !== '') {
      this.props.setModelName(modelName);
    }
  }

  /**
    Check that the model name does not match an existing model.
    @param value {String} The model name to check.
    @returns
  */
  _validateIsDuplicate(name) {
    return this.state.modelNames.includes(name);
  }

  render() {
    const ddEntity = this.props.ddEntity;
    let value = this.props.modelName;
    if (value === 'mymodel' && ddEntity) {
      value = ddEntity.get('name');
    }
    const _updateModelName = this._updateModelName.bind(this);
    return (
      <div className="six-col no-margin-bottom">
        <GenericInput
          disabled={this.props.acl.isReadOnly()}
          key="modelName"
          label="Model name"
          required={true}
          onChange={_updateModelName}
          onBlur={_updateModelName}
          ref="modelName"
          validate={[{
            regex: /\S+/,
            error: 'This field is required.'
          }, {
            check: this._validateIsDuplicate.bind(this),
            error: 'You already have a model with that name.'
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
  listModelsWithInfo: PropTypes.func.isRequired,
  modelName: PropTypes.string.isRequired,
  setModelName: PropTypes.func.isRequired
};

module.exports = DeploymentModelName;
