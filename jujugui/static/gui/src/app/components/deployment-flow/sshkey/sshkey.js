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

/**
  This component allows users to provide their public SSH keys.
  Providing SSH keys when creating a model is important as it allows accessing
  the machines provisioned on that model, via "juju ssh" or similar. On Azure,
  providing SSH keys is even more important as, at least for the time being, no
  machines can be provisioned otherwise.
*/

// Define the Azure cloud type.
const AZURE_CLOUD_TYPE = 'azure';

const DeploymentSSHKey = React.createClass({
  propTypes: {
    cloud: React.PropTypes.object,
    setSSHKey: React.PropTypes.func.isRequired
  },

  getInitialState: function() {
    return {
      addSource: 'github',
      SSHkeys: []
    };
  },

  /**
    Handle SSH key content changes.

    @method _onSSHKeyInputBlur
    @param {Object} evt The blur event.
  */
  _onSSHInputBlur: function(evt) {
    const key = this.refs.sshKey.getValue();
    this.props.setSSHKey(key);
  },

  /**
    Handle SSH key content changes.

    @method _onGithubUsernameInputBlur
    @param {Object} evt The blur event.
  */
  _onGithubUsernameInputBlur: function(evt) {
    const key = this.refs.githubUsername.getValue();
    this.props.setSSHKey(key);
  },

  /**
    Handle clicking AddMoreKeys.

    @method _handleAddMoreKeys
    @param {Object} evt The blur event.
  */
  _handleAddMoreKeys: function(evt) {
    const source = this.refs.sshSource.getValue();
    let SSHkeys = this.state.SSHkeys;
    if (source === 'github') {
      const githubUsername = this.refs.githubUsername.getValue();
      window.jujugui.githubSSHKeys(githubUsername, (keys) => {
        SSHkeys.push(keys);
        this.setState({SSHkeys: SSHkeys});
      });
    }
    return;
  },

  /**
    Handle source change.

    @method _handleSourceChange
    @param {Object} evt The change event.
  */
  _handleSourceChange: function(evt) {
    const source = this.refs.sshSource.getValue();
    this.setState({addSource: source});
    return;
  },

  /**
    Create the added keys section.

    @method _generateAddedKeys
  */
  _generateAddedKeys: function() {
    const SSHkeys = this.state.SSHkeys;

    if (Object.keys(SSHkeys).length === 0) {
      return;
    }

    let listBody = [];
    SSHkeys[0].forEach((key, i) => {
      let uniqueKey = key.id + i;
      listBody.push(
         <li className="deployment-flow__row twelve-col" key={uniqueKey}>
          <div className="two-col">{key.type}</div>
          <div className="ten-col last-col added-keys__key-value">
            {key.body}
          </div>
        </li>
      );
    });

    return (
      <ul className="deployment-machines__list clearfix">
        <li className="deployment-flow__row-header twelve-col" >
          <div className="two-col">Type</div>
          <div className="ten-col last-col">Key</div>
        </li>
       {listBody}
      </ul>
    );

  },

  /**
    Create the added keys section.

    @method _generateAddKey
  */
  _generateAddKey: function() {
    const cloud = this.props.cloud;
    if (!cloud) {
      return null;
    }
    const isAzure = cloud.cloudType === AZURE_CLOUD_TYPE;

    if (this.state.addSource === 'github') {
      return (
        <div className="four-col">
          <juju.components.GenericInput
            label="GitHub username"
            key="githubUsername"
            ref="githubUsername"
            multiLine={false}
            onBlur={this._onSSHGithubUsernameInputBlur}
            required={isAzure}
            validate={isAzure ? [{
              regex: /\S+/,
              error: 'This field is required.'
            }] : undefined}
          />
        </div>
      );
    } else if (this.state.addSource === 'manual') {
      return (
        <div className="eight-col">
          <juju.components.GenericInput
            label="Enter your SSH key"
            key="sshKey"
            ref="sshKey"
            multiLine={false}
            onBlur={this._onSSHKeyInputBlur}
            required={isAzure}
            validate={isAzure ? [{
              regex: /\S+/,
              error: 'This field is required.'
            }] : undefined}
          />
        </div>
      );
    }
  },

  /**
    Generate select options for the available sources.

    @method _generateSourcesOptions
  */
  _generateSourceOptions: function() {
      return [
        {
          label: 'GitHub',
          value: 'github'
        },
        {
          label: 'Manual',
          value: 'manual'
        }
      ];
  },

  /**
    Render the component.

    @method render
  */
  render: function() {
    const cloud = this.props.cloud;
    if (!cloud) {
      return null;
    }
    const isAzure = cloud.cloudType === AZURE_CLOUD_TYPE;

    let message = (
      <p>
        Provide a SSH key to allow access to the machines provisioned on this
        model.
      </p>
    );
    if (isAzure) {
      message = (
        <p>
          Provide the SSH key that will be used to provision machines on Azure.
        </p>
      );
    }


    return (
      <div className="deployment-ssh-key">
        {message}
        {this._generateAddedKeys()}
        <div className="twelve-col no-margin-bottom">
          <div className="four-col">
            <juju.components.InsetSelect
              ref="sshSource"
              disabled={false}
              label="Source"
              onChange={this._handleSourceChange}
              options={this._generateSourceOptions()} />
          </div>
        </div>
        {this._generateAddKey()}
        <div className="four-col last-col">
          <juju.components.GenericButton
            action={this._handleAddMoreKeys}
            type="positive"
            title="Add more keys" />
          </div>
      </div>
    );
  }

});

YUI.add('deployment-ssh-key', function() {
  juju.components.DeploymentSSHKey = DeploymentSSHKey;
}, '0.1.0', {
  requires: []
});
