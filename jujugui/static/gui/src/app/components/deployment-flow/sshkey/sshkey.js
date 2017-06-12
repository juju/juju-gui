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
YUI.add('deployment-ssh-key', function() {

  juju.components.DeploymentSSHKey = React.createClass({
    displayName: 'DeploymentSSHKey',
    propTypes: {
      cloud: React.PropTypes.object,
      setSSHKey: React.PropTypes.func.isRequired
    },

    /**
      Handle SSH key content changes.

      @method _onSSHKeyInputBlur
      @param {Object} evt The blur event.
    */
    _onSSHKeyInputBlur: function(evt) {
      const key = this.refs.sshKey.getValue();
      this.props.setSSHKey(key);
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
      return (
        <div>
          <p>
            Optionally provide a SSH key (e.g. ~/.ssh/id_rsa.pub) to allow
            accessing machines provisioned on this model via "juju ssh".
            <br/> SSH keys can be added at any time using "juju add-ssh-key" or
            "juju import-ssh-key".
          </p>
          <juju.components.GenericInput
            label="SSH key"
            key="sshKey"
            ref="sshKey"
            multiLine={true}
            onBlur={this._onSSHKeyInputBlur}
            required={false}
          />
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: []
});
