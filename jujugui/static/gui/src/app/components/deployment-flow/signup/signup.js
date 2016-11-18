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
      modelName: React.PropTypes.string.isRequired,
      staticURL: React.PropTypes.string
    },

    /**
      Set the cookie for hiding the sign-up page.

      @method _setBetaCookie
      @param {Boolean} permanent Whether the page must be permanently hidden.
    */
    _setBetaCookie: function(permanent) {
      const expiration = new Date();
      if (permanent) {
        expiration.setFullYear(2020);
      } else {
        expiration.setHours(expiration.getHours() + 3);
      }
      document.cookie = 'beta-signup-seen=true; expires='
        + expiration.toUTCString();
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
      this._setBetaCookie(false);
    },

    /**
      Handle the email registration.

      @method _handleSignup
    */
    _handleSignup: function() {
      this._setBetaCookie(true);
      this.props.changeState({
        sectionC: {
          component: 'deploy',
          metadata: {
            activeComponent: 'flow'
          }
        }
      });
    },

    render: function() {
      return (
        <juju.components.DeploymentPanel
          changeState={this.props.changeState}
          title={this.props.modelName}>
          <div className="deployment-signup">
            <div className="row border-bottom">
              <h2>Install Juju to deploy locally</h2>
              <div className="six-col">
                <p className="intro">
                  Local deployment uses LXD containers, allowing you to
                  recreate your production environment on your own machine.
                  This minimises portability issues when deploying to a public
                  cloud, OpenStack or bare metal.
                </p>
                <p className="intro">To deploy locally:</p>
                <ol className="deployment-signup__numbered-list">
                  <li className="deployment-signup__numbered-list-item">
                    Download your model
                  </li>
                  <li className="deployment-signup__numbered-list-item">
                    <a href="https://jujucharms.com/docs">
                      Install Juju&nbsp;&rsaquo;
                    </a>
                  </li>
                  <li className="deployment-signup__numbered-list-item">
                    Add your model to deploy
                  </li>
                </ol>
                <p>
                  Continue to the&nbsp;
                  <juju.components.GenericButton
                    action={this._displayFlow}
                    type="inline-neutral"
                    title="Deployment demo of Juju" />
                </p>
              </div>
              <div className="prepend-one four-col last-col">
                <juju.components.SvgIcon
                  className="juju-logo"
                  name="juju-logo"
                  size="100%" />
              </div>
            </div>
            <div className="row">
              <h2>A new way to deploy</h2>
              <div className="six-col">
                <p>
                  Coming soon: deploy from hosted Juju direct to public clouds.
                  For early access to this feature, sign up for the beta.
                </p>
                <ul>
                  <li>
                    Deploy to all major public clouds directly from your browser
                  </li>
                  <li>
                    Hosted and managed Juju controllers
                  </li>
                  <li>
                    Identity management across all models
                  </li>
                  <li>
                    Reusable shareable models with unlimited users
                  </li>
                </ul>
                <p>
                  <a href="https://jujucharms.com/beta"
                    target="_blank"
                    className="button--inline-positive"
                    onClick={this._handleSignup}>
                      Sign up for early access
                  </a>
                </p>
              </div>
              <div className="six-col last-col">
                <ul className="inline-logos no-bullets">
                  <li className="inline-logos__item">
                    <juju.components.SvgIcon
                      className="inline-logos__image"
                      name="aws"
                      size="100%" />
                  </li>
                  <li className="inline-logos__item">
                    <juju.components.SvgIcon
                      className="inline-logos__image"
                      name="google"
                      size="100%" />
                  </li>
                  <li className="inline-logos__item">
                    <juju.components.SvgIcon
                      className="inline-logos__image"
                      name="azure"
                      size="100%" />
                  </li>
                </ul>
              </div>
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
