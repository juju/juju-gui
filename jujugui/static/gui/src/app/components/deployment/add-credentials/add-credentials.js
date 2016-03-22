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
      changeState: React.PropTypes.func.isRequired
    },

    /**
      Handling clicking on a cloud option.

      @method _handleCloudClick
    */
    _handleAddCredentials: function(id) {
      this.props.changeState({
        sectionC: {
          component: 'deploy',
          metadata: {
            activeComponent: 'summary'
          }
        }
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

    render: function() {
      var buttons = [{
        action: this._handleChangeCloud,
        title: 'Change cloud',
        type: 'inline-neutral'
      }, {
        title: 'Add credentials',
        action: this._handleAddCredentials,
        type: 'inline-positive'
      }];
      return (
        <div className="deployment-panel__child">
          <juju.components.DeploymentPanelContent
            title="Configure Amazon Web Services">
            <form>
              <input className="deployment-add-credentials__input"
                  placeholder="Credential name"
                 type="text" />
              <input className="deployment-add-credentials__input"
                  placeholder="Specify region"
                 type="text" />
              <h3 className="deployment-add-credentials__title twelve-col">
                Enter credentials
              </h3>
              <p className="deployment-add-credentials__p">
                Locate your cloud credentials here:<br />
                <a className="deployment-add-credentials__link"
                  href={'https://console.aws.amazon.com/iam/home?region=' +
                    'eu-west-1#security_credential'}
                  target="_blank">
                  https://console.aws.amazon.com/iam/home?region=eu-west-1#
                  security_credential
                </a>
              </p>
              <input className="deployment-add-credentials__input"
                  placeholder="Access-key"
                 type="text" />
              <input className="deployment-add-credentials__input"
                  placeholder="Secret-key"
                 type="text" />
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
  'svg-icon'
]});
