/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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
  */
  _updateModelName() {
    const modelName = this.refs.modelName.getValue();
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
        <juju.components.GenericInput
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

YUI.add('deployment-model-name', function() {
  juju.components.DeploymentModelName = DeploymentModelName;
}, '0.1.0', {
  requires: [
    'generic-input'
  ]
});
