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
      changeState: React.PropTypes.func.isRequired
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
      return {cloud: null};
    },

    /**
      Store the selected cloud in state.

      @method _setCloud
    */
    _setCloud: function(cloud) {
      this.setState({cloud: cloud});
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
      /* eslint-disable max-len */
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
                    clouds={this.CLOUDS} />
                  <juju.components.DeploymentSection
                    completed={false}
                    disabled={!this.state.cloud}
                    showCheck={false}
                    title="Machines to be deployed">
                    <div className="deployment-flow__machines">
                      <p className="deployment-flow__machines-message">
                        These machines will be provisioned on Google Cloud
                        Platform. You will incur a charge from your cloud
                        provider.
                      </p>
                      <div className="deployment-flow__row-header twelve-col">
                        <div className="eight-col">
                          Machine
                        </div>
                        <div className="three-col">
                          Provider
                        </div>
                        <div className="one-col last-col">
                          Quantity
                        </div>
                      </div>
                      <div className="deployment-flow__row twelve-col">
                        <div className="eight-col">
                          Trusty, 1x1GHz, 1.70GB, 8.00GB
                        </div>
                        <div className="three-col">
                          Google
                        </div>
                        <div className="one-col last-col">
                          4
                        </div>
                      </div>
                      <div className="deployment-flow__row twelve-col">
                        <div className="eight-col">
                          Trusty, 1x1GHz, 1.70GB, 8.00GB
                        </div>
                        <div className="three-col">
                          Google
                        </div>
                        <div className="one-col last-col">
                          3
                        </div>
                      </div>
                    </div>
                  </juju.components.DeploymentSection>
                  <juju.components.DeploymentSection
                    completed={false}
                    disabled={!this.state.cloud}
                    showCheck={true}
                    title="Services to be deployed">
                    <div className="deployment-flow__services">
                      <div className="deployment-flow__services-budget">
                        <h4>
                          Choose your budget
                        </h4>
                        <div className="deployment-flow__services-budget-form twelve-col">
                          <div className="four-col">
                            <juju.components.InsetSelect
                              disabled={disabled}
                              label="Budget"
                              options={[{
                                label: 'test budget',
                                value: 'test-budget'
                              }]} />
                          </div>
                          <div className="three-col">
                            <span className="deployment-flow__services-budget-increase link">
                              Increase budget
                            </span>
                          </div>
                        </div>
                        <div className="deployment-flow__services-budget-chart twelve-col">
                          <div className="deployment-flow__services-budget-chart-limit">
                          </div>
                          <div className="deployment-flow__services-budget-chart-new">
                          </div>
                        </div>
                        <div className="three-col">
                          <span className="deployment-flow__services-budget-indicator deployment-flow__services-budget-indicator--new">
                          </span>
                          New allocations: <strong>$550</strong>
                        </div>
                        <div className="three-col">
                          <span className="deployment-flow__services-budget-indicator deployment-flow__services-budget-indicator--existing">
                          </span>
                          Existing allocations: <strong>$0</strong>
                        </div>
                        <div className="three-col">
                          <span className="deployment-flow__services-budget-indicator deployment-flow__services-budget-indicator--limit">
                          </span>
                          Budget limit: <strong>$1000</strong>
                        </div>
                      </div>
                      <div className="deployment-flow__services-plans twelve-col">
                        <div className="deployment-flow__services-plans-show-changelog">
                          <juju.components.GenericButton
                            action={() => {}}
                            type="neutral"
                            title="Show change log" />
                        </div>
                        <h4>
                          Confirm services and plans
                        </h4>
                        <div className="deployment-flow__row-header twelve-col">
                          <div className="three-col">
                            Name
                          </div>
                          <div className="two-col">
                            Units
                          </div>
                          <div className="three-col">
                            Details
                          </div>
                          <div className="four-col last-col">
                            Allocation
                          </div>
                        </div>
                        <div className="deployment-flow__row deployment-flow__services-service twelve-col">
                          <div className="three-col">
                            <img className="deployment-flow__services-charm-icon"
                              src="https://api.staging.jujucharms.com/charmstore/v4/trusty/landscape-server-14/icon.svg" />
                            Landscape
                          </div>
                          <div className="two-col">
                            4
                          </div>
                          <div className="three-col">
                            You need to choose a plan.
                          </div>
                          <div className="two-col">
                          </div>
                          <div className="two-col last-col">
                            <div className="deployment-flow__services-service-edit">
                              <juju.components.GenericButton
                                action={() => {}}
                                disabled={disabled}
                                type="neutral"
                                title="Edit" />
                            </div>
                          </div>
                        </div>
                        <div className="deployment-flow__row deployment-flow__services-service twelve-col">
                          <div className="three-col">
                            <img className="deployment-flow__services-charm-icon"
                              src="https://api.staging.jujucharms.com/charmstore/v4/trusty/mediawiki-5/icon.svg" />
                            Mediawiki
                          </div>
                          <div className="two-col">
                            3
                          </div>
                          <div className="three-col">
                            -
                          </div>
                          <div className="two-col">
                          </div>
                          <div className="two-col last-col">
                          </div>
                        </div>
                        <div className="prepend-seven">
                          Maximum monthly spend:&nbsp;
                          <span className="deployment-flow__services-plans-max">
                            $100
                          </span>
                        </div>
                      </div>
                    </div>
                  </juju.components.DeploymentSection>
                  <div className="twelve-col">
                    <div className="deployment-flow__deploy">
                      <div className="deployment-flow__deploy-option">
                        <input className="deployment-flow__deploy-checkbox"
                          disabled={disabled || !this.state.cloud}
                          id="emails"
                          type="checkbox" />
                        <label className="deployment-flow__deploy-label"
                          htmlFor="emails">
                          Please email me updates regarding feature announcements,
                          performance suggestions, feedback surveys and special
                          offers.
                        </label>
                      </div>
                      <div className="deployment-flow__deploy-option">
                        <input className="deployment-flow__deploy-checkbox"
                          disabled={disabled || !this.state.cloud}
                          id="terms"
                          type="checkbox" />
                        <label className="deployment-flow__deploy-label"
                          htmlFor="terms">
                          I agree that my use of any services and related APIs is
                          subject to my compliance with the applicable&nbsp;
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
      /* eslint-disable max-len */
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-cloud',
    'deployment-credential',
    'deployment-section',
    'inset-select',
    'generic-button',
    'panel-component',
    'svg-icon'
  ]
});
