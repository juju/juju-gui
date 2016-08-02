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
      acl: React.PropTypes.object.isRequired,
      changeState: React.PropTypes.func.isRequired,
      cloud: React.PropTypes.object.isRequired,
      jem: React.PropTypes.object.isRequired,
      setDeploymentInfo: React.PropTypes.func.isRequired,
      users: React.PropTypes.object.isRequired,
      validateForm: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      return {
        regions: []
      };
    },

    componentWillMount: function() {
      var props = this.props;
      props.jem.listRegions(props.cloud.id, (error, regions) => {
        if (error) {
          console.error(error);
          return;
        }
        this.setState({regions: regions});
      });
    },

    /**
      Handling clicking on a cloud option.

      @method _handleCloudClick
    */
    _handleAddCredentials: function(id) {
      var valid = this.props.validateForm([
        'templateAccessKey',
        'templateName',
        'templateSecretKey'
      ], this.refs);
      if (!valid) {
        // If there are any form validation errors then stop adding the
        // credentials.
        return;
      }
      // Add template
      var props = this.props;
      var selectRegion = this.refs.selectRegion;
      var region = selectRegion.options[selectRegion.selectedIndex].value;
      var cloud = props.cloud.id;
      var user = props.users.jem.user;
      var templateName = this.refs.templateName.getValue();
      var template = {
        location: { region, cloud },
        config: {
          'access-key': this.refs.templateAccessKey.getValue(),
          'secret-key': this.refs.templateSecretKey.getValue(),
          // XXX This is a 'hack' to make Juju not complain about being
          // able to find ssh keys.
          'authorized-keys': 'fake'
        }
      };
      props.jem.addTemplate(user, templateName, template, error => {
        if (error) {
          console.error('Unable to add template', error);
        }
        var setDeploymentInfo = props.setDeploymentInfo;
        setDeploymentInfo('templateName',
          [user, templateName].join('/'));
        setDeploymentInfo('region', region);
        setDeploymentInfo('template', template);
        props.changeState({
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
      var isReadOnly = this.props.acl.isReadOnly();
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
              <juju.components.GenericInput
                disabled={isReadOnly}
                label="Access key"
                placeholder="TDFIWNDKF7UW6DVGX98X"
                required={true}
                ref="templateAccessKey"
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]} />
              <juju.components.GenericInput
                disabled={isReadOnly}
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
        case 'google':
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

    /**
      Generate the list of Regions.

      @method _generateRegionList
      @returns {Object} The list of regions in a select.
    */
    _generateRegionList: function() {
      var regions = this.state.regions;
      var options = null;
      var defaultMessage = 'Loading available regions';
      if (regions.length > 0) {
        defaultMessage = 'Choose a region';
        options = [];
        regions.forEach(region => {
          options.push(<option key={region} value={region}>{region}</option>);
        });
      }
      return (
        <select ref="selectRegion"
          disabled={this.props.acl.isReadOnly()}>
          <option>{defaultMessage}</option>
          {options}
        </select>);
    },

    render: function() {
      var isReadOnly = this.props.acl.isReadOnly();
      var cloud = this.props.cloud;
      var title = cloud.title;
      var buttons = [{
        action: this._handleChangeCloud,
        title: 'Change cloud',
        type: 'inline-neutral'
      }, {
        title: 'Add credential',
        action: this._handleAddCredentials,
        disabled: isReadOnly || cloud.id !== 'aws',
        type: 'inline-positive'
      }];
      var credentialName = cloud.id === 'google' ?
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
                <juju.components.GenericInput
                  disabled={isReadOnly}
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
                {this._generateRegionList()}
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
  'deployment-panel-content',
  'deployment-panel-footer',
  'generic-input',
  'svg-icon'
]});
