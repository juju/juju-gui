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

YUI.add('deployment-credential', function() {

  juju.components.DeploymentCredential = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      cloud: React.PropTypes.string,
      clouds: React.PropTypes.object.isRequired
    },

    getInitialState: function() {
      return {showAdd: true};
    },

    /**
      Show the add credentials form.

      @method _toggleAdd
    */
    _toggleAdd: function() {
      this.setState({showAdd: !this.state.showAdd});
    },

    /**
      Generate a change cloud action if a cloud has been selected.

      @method _generateAction
      @returns {Array} The list of actions.
    */
    _generateSelect: function() {
      if (this.state.showAdd) {
        return;
      }
      var disabled = this.props.acl.isReadOnly();
      return (
        <form className="deployment-credential__form">
          <div className="prepend-one four-col">
          <juju.components.InsetSelect
            disabled={disabled}
            label="Credential"
            options={[{
              label: 'test cred',
              value: 'test-cred'
            }]} />
          </div>
          <div className="four-col">
            <juju.components.InsetSelect
              disabled={disabled}
              label="Region"
              options={[{
                label: 'test region',
                value: 'test-region'
              }]} />
          </div>
          <div className="three-col last-col">
            <juju.components.GenericButton
              action={this._toggleAdd}
              title="Add credential"
              type="inline-neutral" />
          </div>
        </form>);
    },

    /**
      Generate the form for adding a credential.

      @method _generateAdd
      @returns {Array} The credential form.
    */
    _generateAdd: function() {
      if (!this.state.showAdd) {
        return;
      }
      return (
        <juju.components.DeploymentCredentialAdd
          acl={this.props.acl}
          close={this._toggleAdd}
          cloud={this.props.cloud}
          clouds={this.props.clouds} />);
    },

    render: function() {
      return (
        <juju.components.DeploymentSection
          completed={false}
          disabled={!this.props.cloud}
          instance="deployment-credential"
          showCheck={false}>
          {this._generateSelect()}
          {this._generateAdd()}
        </juju.components.DeploymentSection>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-credential-add',
    'deployment-section',
    'inset-select',
    'generic-button'
  ]
});
