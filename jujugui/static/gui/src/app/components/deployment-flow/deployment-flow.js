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
                        <juju.components.SvgIcon name="incomplete"
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
                  <div className="deployment-flow__section">
                    <div className="deployment-flow__credentials">
                    </div>
                  </div>
                  <div className="deployment-flow__section">
                    <div className="deployment-flow__machines">
                    </div>
                  </div>
                  <div className="deployment-flow__section">
                    <div className="deployment-flow__services">
                    </div>
                  </div>
                  <div className="deployment-flow__section">
                    <div className="deployment-flow__payment">
                    </div>
                  </div>
                  <div className="deployment-flow__section">
                    <div className="deployment-flow__deploy">
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
    'panel-component'
  ]
});
