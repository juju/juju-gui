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

YUI.add('deployment-flow', function() {

  juju.components.DeploymentFlow = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      changeState: React.PropTypes.func.isRequired,
      changes: React.PropTypes.object.isRequired,
      listPlansForCharm: React.PropTypes.func.isRequired,
      listTemplates: React.PropTypes.func.isRequired,
      servicesGetById: React.PropTypes.func.isRequired
    },

    CLOUDS: {
      google: {
        id: 'google',
        showLogo: true,
        signupUrl: 'https://console.cloud.google.com/billing/freetrial',
        svgHeight: 33,
        svgWidth: 256,
        title: 'Google Compute Engine'
      },
      azure: {
        id: 'azure',
        showLogo: true,
        signupUrl: 'https://azure.microsoft.com/en-us/free/',
        svgHeight: 24,
        svgWidth: 204,
        title: 'Microsoft Azure'
      },
      aws: {
        id: 'aws',
        showLogo: true,
        signupUrl: 'https://portal.aws.amazon.com/gp/aws/developer/' +
        'registration/index.html',
        svgHeight: 48,
        svgWidth: 120,
        title: 'Amazon Web Services'
      },
      local: {
        id: 'local',
        showLogo: false,
        title: 'Local'
      }
    },

    getInitialState: function() {
      return {
        cloud: null,
        credential: null
      };
    },

    /**
      Store the selected cloud in state.

      @method _setCloud
    */
    _setCloud: function(cloud) {
      this.setState({cloud: cloud});
    },

    /**
      Store the selected credential in state.

      @method _setCloud
    */
    _setCredential: function(credential) {
      this.setState({credential: credential});
    },

    /**
      Handle closing the panel when the close button is clicked.

      @method _handleClose
    */
    _handleClose: function() {
      this.props.changeState({
        sectionC: {
          component: null,
          metadata: {}
        }
      });
    },

    render: function() {
      var disabled = this.props.acl.isReadOnly();
      return (
        <juju.components.Panel
          instanceName="deployment-flow-panel"
          visible={true}>
          <div className="deployment-flow">
            <div className="deployment-flow__header">
              <div className="deployment-flow__close">
                <juju.components.GenericButton
                  action={this._handleClose}
                  type="neutral"
                  title="Back to canvas" />
              </div>
            </div>
            <div className="deployment-flow__content">
              <div className="twelve-col">
                <div className="inner-wrapper">
                  <juju.components.DeploymentCloud
                    acl={this.props.acl}
                    cloud={this.state.cloud}
                    clouds={this.CLOUDS}
                    setCloud={this._setCloud} />
                  <juju.components.DeploymentCredential
                    acl={this.props.acl}
                    cloud={this.state.cloud}
                    clouds={this.CLOUDS}
                    listTemplates={this.props.listTemplates} />
                  <juju.components.DeploymentMachines
                    acl={this.props.acl}
                    cloud={this.state.cloud && this.CLOUDS[this.state.cloud]} />
                  <juju.components.DeploymentServices
                    acl={this.props.acl}
                    changes={this.props.changes}
                    cloud={this.state.cloud}
                    listPlansForCharm={this.props.listPlansForCharm}
                    servicesGetById={this.props.servicesGetById} />
                  <div className="twelve-col">
                    <div className="deployment-flow__deploy">
                      <div className="deployment-flow__deploy-option">
                        <input className="deployment-flow__deploy-checkbox"
                          disabled={disabled || !this.state.cloud}
                          id="emails"
                          type="checkbox" />
                        <label className="deployment-flow__deploy-label"
                          htmlFor="emails">
                          Please email me updates regarding feature
                          announcements, performance suggestions, feedback
                          surveys and special offers.
                        </label>
                      </div>
                      <div className="deployment-flow__deploy-option">
                        <input className="deployment-flow__deploy-checkbox"
                          disabled={disabled || !this.state.cloud}
                          id="terms"
                          type="checkbox" />
                        <label className="deployment-flow__deploy-label"
                          htmlFor="terms">
                          I agree that my use of any services and related APIs
                          is subject to my compliance with the applicable&nbsp;
                          <a href="" target="_blank">Terms of service</a>.
                        </label>
                      </div>
                      <div className="deployment-flow__deploy-action">
                        <juju.components.GenericButton
                          action={() => {}}
                          disabled={disabled || !this.state.cloud}
                          type="positive"
                          title="Deploy" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </juju.components.Panel>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-cloud',
    'deployment-credential',
    'deployment-machines',
    'deployment-section',
    'deployment-services',
    'generic-button',
    'panel-component'
  ]
});
