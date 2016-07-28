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
      addTemplate: React.PropTypes.func.isRequired,
      close: React.PropTypes.func.isRequired,
      cloud: React.PropTypes.string,
      clouds: React.PropTypes.object.isRequired,
      regions: React.PropTypes.array.isRequired,
      setCredential: React.PropTypes.func.isRequired,
      setRegion: React.PropTypes.func.isRequired,
      setTemplate: React.PropTypes.func.isRequired,
      users: React.PropTypes.object.isRequired,
      validateForm: React.PropTypes.func.isRequired
    },

    DEFAULTCLOUD: 'google',

    /**
      Get the region value.

      @method _getRegion
      @returns {String} The region.
    */
    _getRegion: function() {
      return this.refs.region.getValue();
    },

    /**
      Generate a full template object in the expected format.

      @method _generateTemplate
    */
    _generateTemplate: function(id) {
      var cloud = this.props.cloud;
      var region = this._getRegion();
      return {
        location: {region, cloud},
        config: {
          'access-key': this.refs.templateAccessKey.getValue(),
          'secret-key': this.refs.templateSecretKey.getValue(),
          // XXX This is a 'hack' to make Juju not complain about being
          // able to find ssh keys.
          'authorized-keys': 'fake'
        }
      };
    },

    /**
      Handling clicking on a cloud option.

      @method _handleCloudClick
    */
    _handleAddCredentials: function() {
      var fields = [
        'templateName'
      ];
      if (this.props.cloud === 'aws') {
        fields = fields.concat([
          'templateAccessKey',
          'templateSecretKey'
        ]);
      }
      var valid = this.props.validateForm(fields, this.refs);
      if (!valid) {
        // If there are any form validation errors then stop adding the
        // credentials.
        return;
      }
      // Add template
      var user = this.props.users.jem.user;
      var templateName = this.refs.templateName.getValue();
      var template = this._generateTemplate();
      this.props.addTemplate(
        user, templateName, template, this._addTemplateCallback);
    },

    /**
      The method to be called once the addTemplate request is complete.

      @method _addTemplateCallback
      @param {String} error An error message, or null if there's no error.
    */
    _addTemplateCallback: function(error) {
      if (error) {
        console.error('Unable to add template', error);
        return;
      }
      var templateName = this.refs.templateName.getValue();
      this.props.setCredential(`${user}/${templateName}`);
      this.props.setRegion(this._getRegion());
      this.props.setTemplate(this._generateTemplate());
      this.props.close();
    },

    /**
      Generate the fields for entering cloud credentials.

      @method _generateCredentialsFields
    */
    _generateCredentialsFields: function() {
      var isReadOnly = this.props.acl.isReadOnly();
      var notice = (
        <div className="deployment-flow__notice six-col last-col">
          <p className="deployment-flow__notice-content">
            <juju.components.SvgIcon
              name="general-action-blue"
              size="16" />
            Credentials are stored securely on our servers and we will
            notify you by email whenever they are used. See where they are
            used and manage or remove them via the account page.
          </p>
        </div>);
      switch (this.props.cloud || this.DEFAULTCLOUD) {
        case 'aws':
          return (
            <div>
              <div className="six-col">
                <p className="deployment-add-credentials__p">
                  You can obtain your AWS credentials at:<br />
                  <a className="deployment-panel__link"
                    href={'https://console.aws.amazon.com/iam/home?region=' +
                      'eu-west-1#security_credential'}
                    target="_blank">
                    https://console.aws.amazon.com/iam/home?region=eu-west-1#
                    security_credential
                  </a>
                </p>
                <juju.components.DeploymentInput
                  disabled={isReadOnly}
                  label="Access key"
                  placeholder="TDFIWNDKF7UW6DVGX98X"
                  required={true}
                  ref="templateAccessKey"
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }]} />
                <juju.components.DeploymentInput
                  disabled={isReadOnly}
                  label="Secret key"
                  placeholder="p/hdU8TnOP5D7JNHrFiM8IO8f5GN6GhHj7tueBN9"
                  required={true}
                  ref="templateSecretKey"
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }]} />
              </div>
              {notice}
            </div>);
          break;
        case 'google':
          return (
            <div className="twelve-col">
              <p className="deployment-add-credentials__p six-col">
                The GCE provider uses OAauth to Authenticate. This requires that
                you set it up and get the relevant credentials. For more
                information see
                &nbsp;<a className="deployment-panel__link"
                  href={'https://cloud.google.com/copmute/dosc/api/how-tos/' +
                    'authorization'}
                  target="_blank">
                  https://cloud.google.com/copmute/dosc/api/how-tos/
                  authorization
                </a>.
                The key information can be downloaded as a JSON file, or copied
                from
                &nbsp;<a className="deployment-panel__link"
                  href={'https://console.developers.google.com/project/apiui/' +
                    'credential'}
                  target="_blank">
                  https://console.developers.google.com/project/apiui/credential
                </a>.
              </p>
              {notice}
              <div className="deployment-add-credentials__upload twelve-col">
                Upload GCE auth-file or&nbsp;
                <span className="link">manually set the individual fields</span>
              </div>
            </div>);
          break;
        case 'azure':
          return (
            <div className="twelve-col">
              <p className="deployment-add-credentials__p six-col">
                The following fields require your Windows Azure management
                information. For more information please see:&nbsp;
                <a className="deployment-panel__link"
                  href="https://msdn.microsoft.com/en-us/library/windowsazure"
                  target="_blank">
                  https://msdn.microsoft.com/en-us/library/windowsazure
                </a>
                &nbsp;for details.
              </p>
              {notice}
              <div className="deployment-add-credentials__upload twelve-col">
                Upload management certificate &rsaquo;
              </div>
            </div>);
          break;
      }
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
          label: region,
          value: region
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
      var cloud = this.props.clouds[this.props.cloud || this.DEFAULTCLOUD];
      var title = cloud.title;
      var credentialName = cloud.id === 'google' ?
        'Project ID (credential name)' : 'Credential name';
      return (
        <div className="deployment-credential-add twelve-col">
          <h4>{`Create new ${title} credential`}</h4>
          <div className="twelve-col deployment-credential-add__signup">
            <a href={cloud.signupUrl}
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
              <juju.components.DeploymentInput
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
    'deployment-input',
    'button-row',
    'inset-select',
    'svg-icon'
  ]
});
