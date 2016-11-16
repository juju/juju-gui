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

YUI.add('deployment-signup', function() {

  juju.components.DeploymentSignup = React.createClass({
    propTypes: {
      changeState: React.PropTypes.func.isRequired,
      exportEnvironmentFile: React.PropTypes.func.isRequired,
      modelName: React.PropTypes.string.isRequired
    },

    /**
      Handle navigating to the deployment flow.

      @method _displayFlow
    */
    _displayFlow: function() {
      // TODO: In the future the deployment flow must be opened in sandbox mode
      // at demo.jujucharms.com.
      this.props.changeState({
        sectionC: {
          component: 'deploy',
          metadata: {
            activeComponent: 'flow'
          }
        }
      });
    },

    /**
      Handle the email registration.

      @method _handleSignup
    */
    _handleSignup: function() {
      let expiration = new Date();
      expiration.setMonth(expiration.getMonth() + 1);
      document.cookie = 'beta-signup-seen=true; expires='
          + expiration.toUTCString();
      console.error('Not implemented.');
    },

    render: function() {
      return (
        <juju.components.DeploymentPanel
          changeState={this.props.changeState}
          title={this.props.modelName}>
          <div className="deployment-signup">
            <div className="six-col">
              <h2>Deploy your model using Juju</h2>
              <p>
                By deploying your model, all of your services will be deployed
                to the cloud provider of your choice, using the configuration
                values you provided.  In the next step, you will be able to
                sign up and choose your cloud provider.
              </p>
              <p>
                Continue to the&nbsp;
                <juju.components.GenericButton
                  action={this._displayFlow}
                  type="inline-neutral"
                  title="deployment demo of Juju" />
              </p>
            </div>
            <div className="twelve-col">
              <h2>Lorem ipsum dolor sit</h2>
              <p className="six-col">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed
                do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <ul>
                <li className="six-col">
                  Lorem ipsum
                </li>
                <li className="six-col last-col">
                  Onsectetur adipisicing elit
                </li>
                <li className="six-col">
                Sed do eiusmod
                </li>
                <li className="six-col last-col">
                Tempor incididunt ut
                </li>
                <li className="six-col">Labore et dolore magna aliqua</li>
              </ul>
              <form className="twelve-col">
                <juju.components.GenericInput
                  label="Lorem ipsum dolor"
                  required={true}
                  ref="email"
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }]}
                  value="" />
                  <juju.components.GenericButton
                    action={this._handleSignup}
                    type="inline-positive"
                    submit={true}
                    title="Lorem ipsum" />
                </form>
            </div>
          </div>
      </juju.components.DeploymentPanel>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'deployment-panel',
    'generic-button',
    'generic-input'
  ]
});
