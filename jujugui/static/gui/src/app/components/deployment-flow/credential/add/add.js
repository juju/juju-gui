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
      addNotification: React.PropTypes.func.isRequired,
      close: React.PropTypes.func.isRequired,
      cloud: React.PropTypes.object,
      generateCloudCredentialName: React.PropTypes.func.isRequired,
      getCloudProviderDetails: React.PropTypes.func.isRequired,
      getCredentials: React.PropTypes.func.isRequired,
      setCredential: React.PropTypes.func.isRequired,
      updateCloudCredential: React.PropTypes.func.isRequired,
      user: React.PropTypes.string,
      validateForm: React.PropTypes.func.isRequired
    },

    DEFAULT_CLOUD_TYPE: 'gce',

    getInitialState: function() {
      const info = this._getInfo();
      return {
        authType: info && info.forms && Object.keys(info.forms)[0] || ''
      };
    },

    componentWillReceiveProps: function(nextProps) {
      const oldId = this.props.cloud && this.props.cloud.cloudType;
      const newId = nextProps.cloud && nextProps.cloud.cloudType;
      if (newId !== oldId) {
        const info = this._getInfo(nextProps);
        this.setState(
          {authType: info && info.forms && Object.keys(info.forms)[0]});
      }
    },

    /**
      Generate a full credential object in the expected format.

      @method _generateCredentials
      @returns {Object} The collection of field values.
    */
    _generateCredentials: function() {
      const info = this._getInfo();
      const fields = {};
      info.forms[this.state.authType].forEach(field => {
        let value = this.refs[field.id].getValue();
        if (field.unescape) {
          value = decodeURIComponent(value.replace(/\\n/g, '\n'));
        }
        fields[field.id] = value;
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
      if (!info || !info.forms) {
        return;
      }
      let fields = info.forms[this.state.authType].map(field => field.id);
      fields.push('credentialName');
      var valid = props.validateForm(fields, this.refs);
      if (!valid) {
        // If there are any form validation errors then stop adding the
        // credentials.
        return;
      }
      const credentialName = this.refs.credentialName.getValue();
      props.updateCloudCredential(
        props.generateCloudCredentialName(
          props.cloud.name, props.user, credentialName),
        this.state.authType,
        this._generateCredentials(),
        this._updateCloudCredentialCallback.bind(this, credentialName));
    },

    /**
      The method to be called once the updateCloudCredential request is
      complete.

      @method _updateCloudCredentialCallback
      @param {String} credential The credential name to select when the
        credential has been added and the list of credentials loaded again.
      @param {String} error An error message, or null if there's no error.
    */
    _updateCloudCredentialCallback: function(credential, error) {
      if (error) {
        this.props.addNotification({
          title: 'Could not add credential',
          message: `Could not add the credential: ${error}`,
          level: 'error'
        });
        return;
      }
      // Load the credentials again so that the list will contain the newly
      // added credential.
      this.props.getCredentials(
        this.props.generateCloudCredentialName(
          this.props.cloud.name, this.props.user, credential));
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
      @returns {Object} The auth type select component or undefined if there is
        only one auth type.
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
      @param {Object} props The component props.
      @returns {Object} The cloud info if available.
    */
    _getInfo: function(props=this.props) {
      const cloud = props.cloud;
      const id = cloud && cloud.cloudType || this.DEFAULT_CLOUD_TYPE;
      return props.getCloudProviderDetails(id);
    },

    /**
      Generate the fields for entering cloud credentials.

      @method _generateCredentialsFields
    */
    _generateCredentialsFields: function() {
      var isReadOnly = this.props.acl.isReadOnly();
      const info = this._getInfo();
      if (!info || !info.forms) {
        return;
      }
      const fields = info.forms[this.state.authType].map(field => {
        // If the required parameter is not provided then default it to true.
        const required = field.required === undefined ? true : field.required;
        if (field.json) {
          return (
            <div className="deployment-credential-add__upload"
              key={field.id}>
              <juju.components.FileField
                accept=".json"
                disabled={isReadOnly}
                key={field.id}
                label={`Upload ${info.title} .json auth-file`}
                required={required}
                ref={field.id} />
            </div>);
        }
        return (
          <juju.components.GenericInput
            autocomplete={field.autocomplete}
            disabled={isReadOnly}
            key={field.id}
            label={field.title}
            multiLine={field.multiLine}
            required={required}
            ref={field.id}
            type={field.type}
            validate={required ? [{
              regex: /\S+/,
              error: 'This field is required.'
            }] : undefined} />);
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

    render: function() {
      var buttons = [{
        action: () => { this.props.close(true); },
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
      const id = cloud && cloud.cloudType || this.DEFAULT_CLOUD_TYPE;
      const info = this._getInfo();
      var title = info && info.title || cloud.name;
      var credentialName = id === 'gce' ?
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
            <div className="six-col last-col">
              <juju.components.GenericInput
                disabled={isReadOnly}
                label={credentialName}
                required={true}
                ref="credentialName"
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }, {
                  regex: /^([a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?)?$/,
                  error: 'This field must only contain upper and lowercase ' +
                    'letters, numbers, and hyphens. It must not start or ' +
                    'end with a hyphen.'
                }]} />
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
    'file-field',
    'generic-input',
    'inset-select',
    'svg-icon'
  ]
});
