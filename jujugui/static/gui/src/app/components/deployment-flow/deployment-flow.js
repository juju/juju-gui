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
                  <div className="deployment-flow__section twelve-col">
                    <div className="deployment-flow__clouds">
                      <h3 className="deployment-flow__section-title">
                        <juju.components.SvgIcon
                          className="deployment-flow__section-title-checkmark"
                          name="complete"
                          size="24" />
                        Choose cloud to deploy to
                      </h3>
                      <ul className="deployment-flow__clouds-list">
                        <li className="deployment-flow__clouds-cloud four-col">
                          <span className="deployment-flow__clouds-cloud-logo">
                            <juju.components.SvgIcon
                              height={33}
                              name="google"
                              width={256} />
                          </span>
                        </li>
                        <li className="deployment-flow__clouds-cloud four-col">
                          <span className="deployment-flow__clouds-cloud-logo">
                            <juju.components.SvgIcon
                              height={48}
                              name="azure"
                              width={120} />
                          </span>
                        </li>
                        <li className="deployment-flow__clouds-cloud four-col last-col">
                          <span className="deployment-flow__clouds-cloud-logo">
                            <juju.components.SvgIcon
                              height={48}
                              name="aws"
                              width={120} />
                          </span>
                        </li>
                        <li className="deployment-flow__clouds-cloud four-col">
                          <span className="deployment-flow__clouds-cloud-logo">
                            Local
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="deployment-flow__section twelve-col">
                    <div className="deployment-flow__credentials">
                      <div className="deployment-flow__top-action">
                        <juju.components.GenericButton
                          action={() => {}}
                          type="neutral"
                          title="Add credential" />
                      </div>
                      <h3 className="deployment-flow__section-title">
                        Choose credential
                      </h3>
                      <form className="deployment-flow__credentials-form">
                        <div className="four-col">
                          <label className="deployment-flow__label"
                            htmlFor="creds">
                            Credential
                          </label>
                          <select id="creds">
                            <option>test-cred</option>
                          </select>
                        </div>
                        <div className="four-col">
                          <label className="deployment-flow__label"
                            htmlFor="region">
                            Region
                          </label>
                          <select id="region">
                            <option>test-region</option>
                          </select>
                        </div>
                      </form>
                    </div>
                  </div>
                  <div className="deployment-flow__section twelve-col">
                    <div className="deployment-flow__machines">
                      <h3 className="deployment-flow__section-title">
                        Machines to be deployed
                      </h3>
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
                  </div>
                  <div className="deployment-flow__section twelve-col">
                    <div className="deployment-flow__services">
                      <h3 className="deployment-flow__section-title">
                        <juju.components.SvgIcon
                          name="complete"
                          size="24" />
                        Services to be deployed
                      </h3>
                      <div className="deployment-flow__services-budget">
                        <h4>
                          Choose your budget
                        </h4>
                        <div className="deployment-flow__services-budget-form twelve-col">
                          <div className="four-col">
                            <label className="deployment-flow__label">
                              Budget
                            </label>
                            <select>
                              <option>test-budget</option>
                            </select>
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
                        <div className="deployment-flow__top-action">
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
                  </div>
                  <div className="deployment-flow__section deployment-flow__section--clear twelve-col">
                    <div className="deployment-flow__deploy">
                      <div className="deployment-flow__deploy-option">
                        <input className="deployment-flow__deploy-checkbox"
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
    'generic-button',
    'panel-component',
    'svg-icon'
  ]
});
