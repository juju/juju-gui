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

  /**
    Handle SSH key content changes.

    @method _onSSHIDInputBlur
    @param {Object} evt The blur event.
  */
  _onSSHIDInputBlur: function(evt) {
    const key = this.refs.sshID.getValue();
    this.props.setSSHKey(key);
  },

  /**
    Handle clicking AddMoreKeys.

    @method _handleAddMoreKeys
    @param {Object} evt The blur event.
  */
  _handleAddMoreKeys: function(evt) {
    return;
  },

  /**
    Create the added keys section.

    @method _generateAddedKeys
  */
  _generateAddedKeys: function() {
    const SSHkeys = [
      {
        "id": 1466196,
        "key": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDvgjbO06Kpt5ZelaxQn+mJBaM9xUiKF2Mgc7fQ6pqEOMhreGG75XpO6+/otSC/kmQbuHXnq4i82eY4OE49lJ2eUpHSzD06zAsrX4gqgkbZgmFJqyghD/EAgBpUxSe50B2WAdHPdgH2zqyTTLByV2w7inabjybi9S2y0H68aeAlMlavr/CKvvU8kDQMMkZhQ4MR3shLviO4OLHDIKWUtMEkoIpf63dGDstKT49s1RFCuSSd//3esUpkBfhVi0m/n1MgZydMP96wLV/PNuL4IkXCGATuPpAB+TtbgkBFdQsF2PiR48KduIHPD83MnfPLs+4Ib94itGs8TZM3EJgyhsFD"
      },
      {
        "id": 13201951,
        "key": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDCaYBIS0FwHcY5wffZTICJHL0jBHduvJYbd+oJdSL5O7VO6wLrITklhCLj23Tt7liLsTQvnFSp6vUmgE9tWy7f087k0Wu9/lwdUaKX8WcEYsClCCGDUU58pEG09QgPzDSuDilCIRvAHjn4eTK2AFBUsw3zryTJE7TEpvy1jZFkqcDsRwDEC0xshpRs7JP2IU94Z23yOi4Qc4CU139QMdKzHs/a6UmaWXnZv1JGG74Lksah71x1B9KyDVlser1uDhOdo4Jdjm9fq9G3ugsLgbV8XroMrPUyP5KAa7WANqqQEK7VQpgW/B0dIMPEmuX7BYB+uTnaNkM9ZH24acdJ923f"
      },
      {
        "id": 16902741,
        "key": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDmcRAW+vwMi5797tKSrq6mAIrsD63GNrTvoKd2XwwICRx6/4bzwVSfOfqbFlpA37jmRIdiS2xboI8r+lnZrDcd6Eog2AL9v3FfRkbx3vd7B3eJyhHzW/xMi1fJkD8QhCg8GcwwDIjmcMKUyGwXOUJh6dj1UtyxwbPw33acZcsgl2HTjmfA8aozMp1NJo/DC33ost4hwkJobQIovrae7pG41WwmV8vO8lBYqMVkP8GevejpE0a3m8L9dgGKyjhHF3ruUtFHkYSr10ZLZ71QMQkwzY5A1r+j+yA1hUSpjrLB7dFfay4By0BpTbtwAdegnD+ae+ZVYvhEWQYL49Of01g5"
      },
      {
        "id": 22119318,
        "key": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC7pfbeU8a54oyqMfjLGCI7vL9tfycDSSl2XICQ7B0jh4DRcI5H0uoBBbuS+So/9GZ2oSpC8DM9JSxKe4K4wkt0W4yXfHVPIBdk8bHq4fWXbzi2MjU8t8iKLyhG3X+2G/AGfqo8i9+fQaIL354q65SNCAiCAx0hNp9Z9oYyZy1iZlNBOnD7tBf7HWX336o1RfOMTQn4fKYFMZVV85ENaG4NrD9mJSn/FN3gstDqR/C34t6UhXAdwQqJMZIOgxEPo5yMcVOVk6BbfCYnITVkyF/KSlEwbHNrBmK1o0vuFmriTXzlwHh5oW0PFgHfN0OObKS/SVCdb5+LqW6fZM65bJZz"
      }
    ];

    let listBody = [];
    SSHkeys.forEach((key) => {
      listBody.push(
         <li className="deployment-flow__row twelve-col" ref={key.id}>
          <div className="two-col">{key.id}</div>
          <div className="ten-col last-col added-keys__key-value">{key.key}</div>
        </li>
      );
    });

    return (
      <ul className="deployment-machines__list clearfix">
        <li className="deployment-flow__row-header twelve-col">
          <div className="two-col">ID</div>
          <div className="ten-col last-col">Key</div>
        </li>
       {listBody}
      </ul>
    );

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
        <div className="four-col">
          <juju.components.GenericInput
            label="Source"
            key="sshSource"
            key="sshSource"
            ref="sshID"
            multiLine={false}
            onBlur={this._onSSHIDInputBlur}
            required={isAzure}
            validate={isAzure ? [{
              regex: /\S+/,
              error: 'This field is required.'
            }] : undefined}
          />
        </div>
        <div className="four-col">
          <juju.components.GenericInput
            label="ID"
            key="sshID"
            ref="sshID"
            multiLine={false}
            onBlur={this._onSSHIDInputBlur}
            required={isAzure}
            validate={isAzure ? [{
              regex: /\S+/,
              error: 'This field is required.'
            }] : undefined}
          />
        </div>
        <div className="four-col last-col">
          <juju.components.GenericButton
            action={this._handleAddMoreKeys.bind(this)}
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
