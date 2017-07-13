/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

class DeploymentLogin extends React.Component {
  /**
   Generate the tick icon.

   @return {Object} The tick markup.
  */
  _generateTick() {
    return (
      <juju.components.SvgIcon
        className="deployment-login__tick"
        name="task-done_16"
        size="16" />);
  }

  /**
   Generate the login for the non direct deploy flow.

   @return {Object} The login markup.
  */
  _generateLogin() {
    return (
      <juju.components.DeploymentSection
        instance="deployment-login"
        showCheck={true}
        title="You're almost ready to deploy!">
        <div className="twelve-col">
          <p className="deployment-login__intro">
            You will need to sign in with an Ubuntu One account to deploy
            your model with Juju-as-a-Service.
          </p>
          <div className="deployment-login__features">
            <div className="six-col">
              <div className="deployment-login__feature">
                {this._generateTick()}
                Deploy to all major clouds directly from your browser.
              </div>
              <div className="deployment-login__feature">
                {this._generateTick()}
                Identity management across all models.
              </div>
            </div>
            <div className="six-col last-col">
              <div className="deployment-login__feature">
                {this._generateTick()}
                Hosted and managed juju controllers.
              </div>
              <div className="deployment-login__feature">
                {this._generateTick()}
                Reusable shareable models with unlimited users.
              </div>
            </div>
          </div>
          <div className="deployment-login__login">
            <juju.components.USSOLoginLink
              gisf={this.props.gisf}
              callback={this.props.callback}
              displayType="button"
              loginToController={this.props.loginToController}>
              Login
            </juju.components.USSOLoginLink>
          </div>
          <div className="deployment-login__signup">
            Do not have an account?
            <juju.components.USSOLoginLink
              gisf={this.props.gisf}
              callback={this.props.callback}
              displayType="text"
              loginToController={this.props.loginToController}>
              Sign up
            </juju.components.USSOLoginLink>
          </div>
        </div>
      </juju.components.DeploymentSection>);
  }

  /**
   Generate the login for the direct deploy flow.

   @return {Object} The login markup.
  */
  _generateDirectDeployLogin() {
    const awsScale = 1.3;
    const gceScale = 1.7;
    const azureScale = 1;
    return (
      <div>
        <juju.components.DeploymentSection
          instance="deployment-login-signup">
          <span className="deployment-login-signup__message">
              Sign up to start deploying to your favourite cloud
          </span>
          <juju.components.USSOLoginLink
            gisf={this.props.gisf}
            callback={this.props.callback}
            displayType="button"
            loginToController={this.props.loginToController}>
            Sign up
          </juju.components.USSOLoginLink>
          or&nbsp;
          <juju.components.USSOLoginLink
            gisf={this.props.gisf}
            callback={this.props.callback}
            displayType="text"
            loginToController={this.props.loginToController}>
            log in
          </juju.components.USSOLoginLink>
          to get started with&nbsp;
          <a href="http://jujucharms.com/jaas">
            JAAS
          </a>
        </juju.components.DeploymentSection>
        <juju.components.DeploymentSection
          instance="deployment-login-features">
          <div className="six-col">
            <h3>JAAS gives you Juju, as a service</h3>
            <p>
              JAAS is the best way to quickly model and deploy your cloud-based
              applications. Concentrate on your software and the solutions with
              a fully managed Juju infrastructure.
            </p>
            <p>
              <a className="deployment-login-features__link"
                href="http://jujucharms.com/jaas"
                target="_blank">
                Learn more about JAAS &rsaquo;
              </a>
            </p>
          </div>
          <div className="six-col last-col">
            <div className="deployment-login-features__logo">
              <juju.components.SvgIcon
                height={Math.round(48 * awsScale)}
                name="aws-light"
                width={Math.round(120 * awsScale)} />
            </div>
            <div className="deployment-login-features__logo">
              <juju.components.SvgIcon
                height={Math.round(23 * gceScale)}
                name="google-light"
                width={Math.round(256 * gceScale)} />
            </div>
            <div className="deployment-login-features__logo">
              <juju.components.SvgIcon
                height={Math.round(24 * azureScale)}
                name="azure"
                width={Math.round(204 * azureScale)} />
            </div>
          </div>
          <div className="deployment-login-features__items twelve-col">
            <div className="six-col no-margin-bottom">
              <h5 className="deployment-login-features__items-heading">
                {this._generateTick()}
                Hosted Juju controllers
              </h5>
              <ul className="deployment-login-features__items-list">
                <li>Managed by Canonical, the company behind Ubuntu</li>
                <li>Highly-available, secure, multi-region infrastructure</li>
                <li>24/7 monitoring and alerting</li>
              </ul>
              <h5 className="deployment-login-features__items-heading">
                {this._generateTick()}
                Share and collaborate
              </h5>
              <ul className="deployment-login-features__items-list">
                <li>Identity management across all models</li>
                <li>Read only mode available</li>
              </ul>
              <h5 className="deployment-login-features__items-heading">
                {this._generateTick()}
                Deploy to public clouds
              </h5>
              <ul className="deployment-login-features__items-list">
                <li>Use your existing credentials to deploy to any cloud</li>
              </ul>
            </div>
            <div className="six-col last-col no-margin-bottom">
              <h5 className="deployment-login-features__items-heading">
                {this._generateTick()}
                Pre-configured open source software
              </h5>
              <ul className="deployment-login-features__items-list">
                <li>
                  All the ops knowledge required to automate the behaviour of
                  your application
                </li>
                <li>Reusable and repeatable workloads</li>
                <li>Portable solutions across clouds</li>
              </ul>
              <h5 className="deployment-login-features__items-heading">
                {this._generateTick()}
                One view of all clouds and models
              </h5>
              <ul className="deployment-login-features__items-list">
                <li>All models shared and owned by you in one place</li>
                <li>Monitor the status of your models at a glance</li>
              </ul>
            </div>
          </div>
        </juju.components.DeploymentSection>
      </div>);
  }

  render() {
    if (this.props.isDirectDeploy) {
      return this._generateDirectDeployLogin();
    } else {
      return this._generateLogin();
    }
  }
};

DeploymentLogin.propTypes = {
  callback: React.PropTypes.func.isRequired,
  gisf: React.PropTypes.bool,
  isDirectDeploy: React.PropTypes.bool,
  loginToController: React.PropTypes.func.isRequired
};

YUI.add('deployment-login', function() {
  juju.components.DeploymentLogin = DeploymentLogin;
}, '0.1.0', {
  requires: [
    'deployment-section',
    'svg-icon',
    'usso-login-link'
  ]
});
