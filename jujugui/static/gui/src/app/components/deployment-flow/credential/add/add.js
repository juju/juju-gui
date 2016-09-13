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

YUI.add('deployment-credential-add', function() {

  juju.components.DeploymentCredentialAdd = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      close: React.PropTypes.func.isRequired,
      cloud: React.PropTypes.object,
      clouds: React.PropTypes.object.isRequired,
      generateCloudCredentialTag: React.PropTypes.func.isRequired,
      regions: React.PropTypes.array.isRequired,
      setCredential: React.PropTypes.func.isRequired,
      setRegion: React.PropTypes.func.isRequired,
      setTemplate: React.PropTypes.func.isRequired,
      updateCloudCredential: React.PropTypes.func.isRequired,
      user: React.PropTypes.string,
      validateForm: React.PropTypes.func.isRequired
    },

    DEFAULTCLOUD: 'google',

    getInitialState: function() {
      const info = this._getInfo();
      return {
        authType: info && Object.keys(info.forms)[0] || ''
      };
    },

    /**
      Get the region value.

      @method _getRegion
      @returns {String} The region.
    */
    _getRegion: function() {
      return this.refs.region.getValue();
    },

    /**
      Generate a full credential object in the expected format.

      @method _generateCredentials
    */
    _generateCredentials: function(id) {
      const info = this._getInfo();
      if (!info) {
        return;
      }
      const fields = {};
      info.forms[this.state.authType].forEach(field => {
        fields[field.id] = this.refs[field.id].getValue();
      });
      return fields;
    },

    /**
      Handling clicking on a cloud option.

      @method _handleCloudClick
    */
    _handleAddCredentials: function() {
      const props = this.props;
      const info = this._getInfo();
      let fields = info.forms[this.state.authType].map(field => field.id);
      fields.push('templateName');
      var valid = props.validateForm(fields, this.refs);
      if (!valid) {
        // If there are any form validation errors then stop adding the
        // credentials.
        return;
      }
      props.updateCloudCredential(
        props.generateCloudCredentialTag(
          props.cloud.name, props.user, this.refs.templateName.getValue()),
        this.state.authType,
        this._generateCredentials(),
        this._updateCloudCredentialCallback);
    },

    /**
      The method to be called once the updateCloudCredential request is
      complete.

      @method _updateCloudCredentialCallback
      @param {String} error An error message, or null if there's no error.
    */
    _updateCloudCredentialCallback: function(error) {
      if (error) {
        console.error('Unable to add template', error);
        return;
      }
      const templateName = this.refs.templateName.getValue();
      const user = this.props.user;
      this.props.setCredential(`${user}/${templateName}`);
      this.props.setRegion(this._getRegion());
      this.props.setTemplate(this._generateCredentials());
      this.props.close();
    },

    /**
      Set the authType state when the select changes.

      @method _handleAuthChange
      @param {String} authType The selected authType.
    */
    _handleAuthChange: function(authType) {
      this.setState({authType: authType});
    },

    /**
      Generate the form select if the cloud has multiple forms.

      @method _generateAuthSelect
      @returns {Object} The cloud info if available.
    */
    _generateAuthSelect: function() {
      const info = this._getInfo();
      if (Object.keys(info.forms).length === 1) {
        return;
      }
      const authOptions = Object.keys(info.forms).map(auth => {
        return {
          label: auth,
          value: auth
        };
      });
      return (
        <juju.components.InsetSelect
          disabled={this.props.acl.isReadOnly()}
          label="Authentication type"
          onChange={this._handleAuthChange}
          options={authOptions} />);
    },

    /**
      Get the info for a cloud

      @method _getInfo
      @returns {Object} The cloud info if available.
    */
    _getInfo: function() {
      const cloud = this.props.cloud;
      const id = cloud && cloud.id || this.DEFAULTCLOUD;
      return this.props.clouds[id];
    },

    /**
      Generate the fields for entering cloud credentials.

      @method _generateCredentialsFields
    */
    _generateCredentialsFields: function() {
      var isReadOnly = this.props.acl.isReadOnly();
      const info = this._getInfo();
      if (!info) {
        return;
      }
      const fields = info.forms[this.state.authType].map(field => {
        if (field.json) {
          return (
            <div className="deployment-credential-add__upload twelve-col"
              key={field.id}>
              Upload {info.title} auth-file.
            </div>);
        }
        return (
          <juju.components.GenericInput
            disabled={isReadOnly}
            key={field.id}
            label={field.title}
            required={true}
            ref={field.id}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }]} />);
      });
      return (
        <div className="deployment-credential-add__credentials">
          <div className="six-col">
            {info.message}
            {this._generateAuthSelect()}
            {fields}
          </div>
          <div className="deployment-flow__notice six-col last-col">
            <p className="deployment-flow__notice-content">
              <juju.components.SvgIcon
                name="general-action-blue"
                size="16" />
              Credentials are stored securely on our servers and we will
              notify you by email whenever they are used. See where they are
              used and manage or remove them via the account page.
            </p>
          </div>
        </div>);
    },

    /**
      Generate the list of region options.

      @method _generateRegions
      @returns {Array} The list of region options.
    */
    _generateRegions: function() {
      var regions = this.props.regions;
      if (!regions) {
        return [];
      }
      return regions.map((region) => {
        return {
          label: region.name,
          value: region.name
        };
      });
    },

    render: function() {
      var buttons = [{
        action: this.props.close,
        title: 'Cancel',
        type: 'neutral'
      }, {
        action: this._handleAddCredentials,
        submit: true,
        title: 'Add cloud credential',
        type: 'positive'
      }];
      // If no cloud has been selected we set a default so that the disabled
      // form will display correctly as the next step.
      var isReadOnly = this.props.acl.isReadOnly();
      const cloud = this.props.cloud;
      const id = cloud && cloud.id || this.DEFAULTCLOUD;
      var info = this.props.clouds[id];
      var title = info && info.title || cloud.name;
      var credentialName = id === 'google' ?
        'Project ID (credential name)' : 'Credential name';
      return (
        <div className="deployment-credential-add twelve-col">
          <h4>{`Create new ${title} credential`}</h4>
          <div className="twelve-col deployment-credential-add__signup">
            <a href={info && info.signupUrl}
              target="_blank">
              Sign up for {title}
              &nbsp;
              <juju.components.SvgIcon
                name="external-link-16"
                size="12" />
            </a>
          </div>
          <form className="twelve-col">
            <div className="six-col">
              <juju.components.GenericInput
                disabled={isReadOnly}
                label={credentialName}
                placeholder="cred-1"
                required={true}
                ref="templateName"
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }, {
                  regex: /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/,
                  error: 'This field must only contain upper and lowercase ' +
                    'letters, numbers, and hyphens. It must not start or ' +
                    'end with a hyphen.'
                }]} />
            </div>
            <div className="six-col last-col">
              <juju.components.InsetSelect
                disabled={isReadOnly}
                label="Region"
                options={this._generateRegions()}
                ref="region" />
            </div>
            <h3 className="deployment-panel__section-title twelve-col">
              Enter credentials
            </h3>
            {this._generateCredentialsFields()}
          </form>
          <div className="prepend-six six-col last-col">
            <juju.components.ButtonRow
              buttons={buttons} />
          </div>
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'button-row',
    'generic-input',
    'inset-select',
    'svg-icon'
  ]
});
