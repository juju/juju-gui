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

class DeploymentSSHKey extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      addSource: 'github',
      SSHkeys: [],
      error: null,
      buttonDisabled: true
    };
  }

  /** Handle keyboard input to listen for return.

    @method _onSSHKeyInputKey
    @param {Object} evt The keyboard event.
  */
  _onSSHKeyInputKey(evt) {
    if (evt.which === 13) {
      this._handleAddMoreKeys(null);
    }
    this.setState({
      buttonDisabled: this.refs.sshKey.getValue() ? false : true
    });
  }

  /** Handle keyboard input to listen for return.

    @method _onSSHKeyInputKey
    @param {Object} evt The keyboard event.
  */
  _onGithubUsernameInputKey(evt) {
    if (evt.which === 13) {
      this._handleAddMoreKeys(null);
    }
    this.setState({
      buttonDisabled: this.refs.githubUsername.getValue() ? false : true
    });
  }

  /**
    Split a Manual Key into its parts

    @method _splitKey
    @param (String) sshkey
   */
  _splitKey(sshKey) {
    const splitKey = sshKey.split(' ');
    return {
      'body': splitKey[1],
      'text': sshKey,
      'type': splitKey[0],
      'id': 0
    };
  }

  _keyExists(key) {
    return this.state.SSHkeys.filter(knownKey => {
      return knownKey.body === key.body;
    }).length !== 0;
  }

  /**
    Handle clicking AddMoreKeys.

    @method _handleAddMoreKeys
  */
  _handleAddMoreKeys() {
    if (this.state.buttonDisabled) {
      return;
    }
    const source = this.refs.sshSource.getValue();
    let SSHkeys = this.state.SSHkeys;
    this.setState({error: null});
    if (source === 'github') {
      const githubUsername = this.refs.githubUsername.getValue();
      window.jujugui.sshKeys.githubSSHKeys(
        new juju.environments.web.WebHandler,
        githubUsername,
        (error, keys) => {
          console.log(keys);
          if (error) {
            console.error(error);
            this.setState({error: error});
            return;
          }

          if (keys.length === 0) {
            this.setState({error:
              (<span>No keys found. <a className="link"
                href="https://github.com/settings/keys" target="_blank">
                Create an SSH Key</a>.</span>)});
            return;
          }

          keys.forEach(key => {
            if (!this._keyExists(key)) {
              SSHkeys.push(key);
            }
          });
          this.props.setSSHKey(SSHkeys[0].text);
          this.setState({SSHkeys: SSHkeys, buttonDisabled: true});
          this.refs.githubUsername.setValue(null);
          this.refs.githubUsername.focus();
        }
      );
    } else if (source === 'manual') {
      const manualKey = this.refs.sshKey.getValue();
      this.props.setSSHKey(manualKey);
      const key = this._splitKey(manualKey);
      let SSHkeys = this.state.SSHkeys;
      if (!this._keyExists(key)) {
        SSHkeys.push(key);
      }
      this.setState({SSHkeys: SSHkeys, buttonDisabled: true});
      this.refs.sshKey.setValue(null);
      this.refs.sshKey.focus();
    }

    return;
  }

  /**
    Handle source change.

    @method _handleSourceChange
  */
  _handleSourceChange() {
    const source = this.refs.sshSource.getValue();
    this.setState({addSource: source, buttonDisabled: true});
    return;
  }

  /**
    Remove key from table.

    @method _removeKey
    @param {Number} keyId The key's ID.
  */
  _removeKey(keyId) {
    const newSSHkeyList = this.state.SSHkeys.filter(key => {
      return key.id !== keyId;
    });

    this.setState({
      SSHkeys: newSSHkeyList
    });

    if (!newSSHkeyList.length) {
      this.props.setSSHKey(null);
    }
  }

  /**
    Create the added keys section.

    @method _generateAddedKeys
  */
  _generateAddedKeys() {
    const SSHkeys = this.state.SSHkeys;
    const stringLengths = 30;

    if (Object.keys(SSHkeys).length === 0) {
      return false;
    }

    let listBody = [];
    SSHkeys.forEach((key, i) => {
      let uniqueKey = key.id + i;
      const bodyStart = key.body.substring(0, stringLengths);
      const bodyEnd = key.body.substring(key.body.length - stringLengths);
      const body = `${bodyStart}...${bodyEnd}`;
      listBody.push(
        <li className="deployment-flow__row twelve-col" key={uniqueKey}>
          <div className="two-col">{key.type}</div>
          <div className="nine-col added-keys__key-value" title={key.body}>
            {body}
          </div>
          <div className="one-col last-col">
            <span className="added-keys__key-remove right" title="Remove key"
              role="button"
              onClick={this._removeKey.bind(this, key.id)}>
              <juju.components.SvgIcon
                name="close_16" size="16" />
            </span>
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
  }

  /**
    Create the added keys section.

    @method _generateAddKey
  */
  _generateAddKey() {
    const cloud = this.props.cloud;
    if (!cloud) {
      return false;
    }
    const isAzure = cloud.cloudType === AZURE_CLOUD_TYPE;

    if (this.state.addSource === 'github') {
      return (
        <div className="three-col last-col no-margin-bottom">
          <juju.components.GenericInput
            label="GitHub username"
            key="githubUsername"
            ref="githubUsername"
            multiLine={false}
            onKeyUp={this._onGithubUsernameInputKey.bind(this)}
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
        <div className="seven-col no-margin-bottom">
          <juju.components.GenericInput
            label="Enter your SSH key (typically found at ~/.ssh/id_rsa.pub)"
            key="sshKey"
            ref="sshKey"
            multiLine={true}
            onKeyUp={this._onSSHKeyInputKey.bind(this)}
            required={isAzure}
            validate={isAzure ? [{
              regex: /\S+/,
              error: 'This field is required.'
            }] : undefined}
          />
        </div>
      );
    }
  }

  /**
    Create the added key button.

    @method _generateAddKeyButton
  */
  _generateAddKeyButton() {
    const title = this.state.addSource === 'github' ? 'Add Keys' : 'Add Key';
    const disabled = this.state.buttonDisabled;
    return (<div className="right">
      <juju.components.GenericButton
        action={this._handleAddMoreKeys.bind(this)}
        disabled={disabled}
        type="positive"
        title={title} />
    </div>);
  }

  /**
    Generate select options for the available sources.

    @method _generateSourcesOptions
  */
  _generateSourceOptions() {
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
  }

  /**
    If an error occurs, generate it.

    @method _generateError
  */
  _generateError() {
    if (this.state.error) {
      const content = <span><b>Error:</b> {this.state.error}</span>;
      return (<juju.components.Notification
        content={content}
        type="negative" />);
    }
    return false;
  }

  /**
    Render the component.

    @method render
  */
  render() {
    const cloud = this.props.cloud;
    if (!cloud) {
      return null;
    }
    const isAzure = cloud.cloudType === AZURE_CLOUD_TYPE;

    let message = (
      <p>
        Keys will allow you SSH access to the machines provisioned by Juju
        for this model.
      </p>
    );
    if (isAzure) {
      message = (
        <p>
          Keys will allow you SSH access to the machines provisioned on Azure.
        </p>
      );
    }


    return (
      <div className="deployment-ssh-key">
        {message}
        {this._generateAddedKeys()}
        {this._generateError()}
        <div className="twelve-col no-margin-bottom">
          <div className="three-col no-margin-bottom">
            <juju.components.InsetSelect
              ref="sshSource"
              disabled={false}
              label="Source"
              onChange={this._handleSourceChange.bind(this)}
              options={this._generateSourceOptions()} />
          </div>
          {this._generateAddKey()}
          {this._generateAddKeyButton()}
        </div>
      </div>
    );
  }
};

DeploymentSSHKey.propTypes = {
  cloud: React.PropTypes.object,
  setSSHKey: React.PropTypes.func.isRequired
};

YUI.add('deployment-ssh-key', function() {
  juju.components.DeploymentSSHKey = DeploymentSSHKey;
}, '0.1.0', {
  requires: [
    'inset-select',
    'notification',
    'generic-input',
    'generic-button',
    'svg-icon'
  ]
});
