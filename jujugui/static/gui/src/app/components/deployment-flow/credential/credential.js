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
      clouds: React.PropTypes.object.isRequired,
      listRegions: React.PropTypes.func.isRequired,
      listTemplates: React.PropTypes.func.isRequired,
      setCredential: React.PropTypes.func.isRequired,
      setRegion: React.PropTypes.func.isRequired
    },

    credentialXHR: null,
    regionsXHR: null,

    getInitialState: function() {
      return {
        credentials: [],
        credentialsLoading: true,
        regions: [],
        regionsLoading: true,
        showAdd: true
      };
    },

    componentWillMount: function() {
      this._getCredentials();
      this._getRegions();
    },

    componentWillUnmount: function() {
      if (this.credentialXHR) {
        this.credentialXHR.abort();
      }
      if (this.regionsXHR) {
        this.regionsXHR.abort();
      }
    },

    /**
      Request credentials from JEM.

      @method _getCredentials
    */
    _getCredentials: function() {
      this.credentialXHR = this.props.listTemplates(
        this._getCredentialsCallback);
    },

    /**
      The method to be called when the credentials reponse has been received.

      @method _getCredentialsCallback
      @param {String} error An error message, or null if there's no error.
      @param {Array} credentials A list of the credentials found.
    */
    _getCredentialsCallback: function(error, credentials) {
      if (error) {
        console.error('Unable to list templates', error);
        return;
      }
      this.setState({
        credentials: credentials,
        credentialsLoading: false,
        // If there are no credentials then display the form to add credentials.
        showAdd: !credentials || credentials.length === 0
      });
    },

    /**
      Request regions from JEM.

      @method _getRegions
    */
    _getRegions: function() {
      var props = this.props;
      var cloud = props.cloud;
      if (!cloud) {
        this.setState({
          regionsLoading: false
        });
        return;
      }
      this.regionsXHR = props.listRegions(cloud, this._getRegionsCallback);
    },

    /**
      The method to be called when the regions reponse has been received.

      @method _getRegionsCallback
      @param {String} error An error message, or null if there's no error.
      @param {Array} regions A list of the regions found.
    */
    _getRegionsCallback: function(error, regions) {
      if (error) {
        console.error('Unable to list templates', error);
        return;
      }
      this.setState({
        regions: regions,
        regionsLoading: false
      });
    },

    /**
      Show the add credentials form.

      @method _toggleAdd
    */
    _toggleAdd: function() {
      this.setState({showAdd: !this.state.showAdd});
    },

    /**
      Generate the list of credential options.

      @method _generateCredentials
      @returns {Array} The list of credential options.
    */
    _generateCredentials: function() {
      return this.state.credentials.map((credential) => {
        var path = credential.path;
        return {
          label: path,
          value: path
        };
      });
    },

    /**
      Generate the list of credential options.

      @method _generateRegions
      @returns {Array} The list of credential options.
    */
    _generateRegions: function() {
      return this.state.regions.map((region) => {
        return {
          label: region,
          value: region
        };
      });
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
            onChange={this.props.setCredential}
            options={this._generateCredentials()} />
          </div>
          <div className="four-col">
            <juju.components.InsetSelect
              disabled={disabled}
              label="Region"
              onChange={this.props.setRegion}
              options={this._generateRegions()} />
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

    /**
      Display the credentials or a spinner if the data is loading.

      @method _generateContent
      @returns {Object} The dom elements.
    */
    _generateContent: function() {
      if (this.state.credentialsLoading || this.state.regionsLoading) {
        return (
          <div className="deployment-credential__loading">
            <juju.components.Spinner />
          </div>);
      }
      return (
        <div>
          {this._generateSelect()}
          {this._generateAdd()}
        </div>);
    },

    render: function() {
      return (
        <juju.components.DeploymentSection
          completed={false}
          disabled={!this.props.cloud}
          instance="deployment-credential"
          showCheck={false}>
          {this._generateContent()}
        </juju.components.DeploymentSection>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-credential-add',
    'deployment-section',
    'inset-select',
    'generic-button',
    'loading-spinner'
  ]
});
