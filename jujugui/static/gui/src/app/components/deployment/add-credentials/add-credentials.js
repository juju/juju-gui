/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

YUI.add('deployment-add-credentials', function() {

  juju.components.DeploymentAddCredentials = React.createClass({

    propTypes: {
      changeState: React.PropTypes.func.isRequired,
      controller: React.PropTypes.string.isRequired,
      cloud: React.PropTypes.object.isRequired,
      jem: React.PropTypes.object.isRequired,
      setDeploymentInfo: React.PropTypes.func.isRequired,
      users: React.PropTypes.object.isRequired,
      validateForm: React.PropTypes.func.isRequired
    },

    /**
      Handling clicking on a cloud option.

      @method _handleCloudClick
    */
    _handleAddCredentials: function(id) {
      var valid = this.props.validateForm([
        'templateAccessKey',
        'templateName',
        'templateRegion',
        'templateSecretKey'
      ], this.refs);
      if (!valid) {
        // If there are any form validation errors then stop adding the
        // credentials.
        return;
      }
      // Add template
      var user = this.props.users.jem.user,
          templateName = this.refs.templateName.getValue(),
          template = {
            // XXX The controllers need to exist first; for now use a known good
            // controller with work to come to generate a controller name.
            // Makyo 2016-03-30
            'controller': this.props.controller,
            'config': {
              'access-key': this.refs.templateAccessKey.getValue(),
              'secret-key': this.refs.templateSecretKey.getValue(),
              // XXX This is a 'hack' to make Juju not complain about being
              // able to find ssh keys.
              'authorized-keys': 'fake'
            }
          };
      this.props.jem.addTemplate(
        user, templateName, template, error => {
          if (error) {
            console.error('Unable to add template', error);
          }
          this.props.setDeploymentInfo('templateName',
            [user, templateName].join('/'));
          this.props.setDeploymentInfo('template', template);
          this.props.changeState({
            sectionC: {
              component: 'deploy',
              metadata: {
                activeComponent: 'summary'
              }
            }
          });
        });
    },

    /**
      Navigate to the choose cloud step.

      @method _handleChangeCloud
    */
    _handleChangeCloud: function() {
      this.props.changeState({
        sectionC: {
          component: 'deploy',
          metadata: {
            activeComponent: 'choose-cloud'
          }
        }
      });
    },

    /**
      Generate the fields for entering cloud credentials.

      @method _generateCredentialsFields
    */
    _generateCredentialsFields: function() {
      switch (this.props.cloud.id) {
        case 'aws':
          return (
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
                label="Access key"
                placeholder="TDFIWNDKF7UW6DVGX98X"
                required={true}
                ref="templateAccessKey"
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]} />
              <juju.components.DeploymentInput
                label="Secret key"
                placeholder="p/hdU8TnOP5D7JNHrFiM8IO8f5GN6GhHj7tueBN9"
                required={true}
                ref="templateSecretKey"
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]} />
            </div>);
          break;
        case 'gcp':
          return (
            <div className="twelve-col">
              <p className="deployment-add-credentials__p six-col last-col">
                The GCE provider uses OAauth to Authenticate. This requires that
                you set it up and get the relevant credentials. For more
                information see&nbsp;
                <a className="deployment-panel__link"
                  href={'https://cloud.google.com/copmute/dosc/api/how-tos/' +
                    'authorization'}
                  target="_blank">
                  https://cloud.google.com/copmute/dosc/api/how-tos/
                  authorization
                </a>.
                The key information can be downloaded as a JSON file, or copied
                from&nbsp;
                <a className="deployment-panel__link"
                  href={'https://console.developers.google.com/project/apiui/' +
                    'credential'}
                  target="_blank">
                  https://console.developers.google.com/project/apiui/credential
                </a>.
              </p>
              <div className="deployment-add-credentials__upload twelve-col">
                Upload GCE auth-file or&nbsp;
                <span className="link">manually set the individual fields</span>
              </div>
            </div>);
          break;
        case 'azure':
          return (
            <div className="twelve-col">
              <p className="deployment-add-credentials__p six-col last-col">
                The following fields require your Windows Azure management
                information. For more information please see:&nbsp;
                <a className="deployment-panel__link"
                  href="https://msdn.microsoft.com/en-us/library/windowsazure"
                  target="_blank">
                  https://msdn.microsoft.com/en-us/library/windowsazure
                </a>
                &nbsp;for details.
              </p>
              <div className="deployment-add-credentials__upload twelve-col">
                Upload management certificate &rsaquo;
              </div>
            </div>);
          break;
      }
    },

    render: function() {
      var cloud = this.props.cloud;
      var title = cloud.title;
      var buttons = [{
        action: this._handleChangeCloud,
        title: 'Change cloud',
        type: 'inline-neutral'
      }, {
        title: 'Add credential',
        action: this._handleAddCredentials,
        disabled: cloud.id !== 'aws',
        type: 'inline-positive'
      }];
      var credentialName = cloud.id === 'gcp' ?
        'Project ID (credential name)' : 'Credential name';
      return (
        <div className="deployment-panel__child">
          <juju.components.DeploymentPanelContent
            title={`Configure ${title}`}>
            <div className="deployment-add-credentials__logo">
                <juju.components.SvgIcon
                  height={cloud.svgHeight}
                  name={cloud.id}
                  width={cloud.svgWidth} />
            </div>
            <div className="twelve-col deployment-add-credentials__signup">
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
                  label={credentialName}
                  placeholder="AWS-1"
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
                <juju.components.DeploymentInput
                  label="Region"
                  placeholder="us-central1"
                  required={true}
                  ref="templateRegion"
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }]} />
              </div>
              <div className="deployment-panel__notice six-col last-col">
                <p className="deployment-panel__notice-content">
                  <juju.components.SvgIcon
                    name="general-action-blue"
                    size="16" />
                  Credentials are stored securely on our servers and we will
                  notify you by email whenever they are used. See where they are
                  used and manage or remove them via the account page.
                </p>
              </div>
              <h3 className="deployment-panel__section-title twelve-col">
                Enter credentials
              </h3>
              {this._generateCredentialsFields()}
            </form>
          </juju.components.DeploymentPanelContent>
          <juju.components.DeploymentPanelFooter
            buttons={buttons} />
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'deployment-input',
  'deployment-panel-content',
  'deployment-panel-footer',
  'svg-icon'
]});
