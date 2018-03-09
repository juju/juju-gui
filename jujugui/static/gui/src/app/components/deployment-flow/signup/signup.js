/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../../generic-button/generic-button');
const DeploymentPanel = require('../panel/panel');
const SvgIcon = require('../../svg-icon/svg-icon');

class DeploymentSignup extends React.Component {
  /**
    Set the cookie for hiding the sign-up page.

    @method _setBetaCookie
    @param {Boolean} permanent Whether the page must be permanently hidden.
  */
  _setBetaCookie(permanent) {
    const expiration = new Date();
    if (permanent) {
      expiration.setFullYear(2020);
    } else {
      expiration.setHours(expiration.getHours() + 3);
    }
    document.cookie = 'beta-signup-seen=true; expires='
      + expiration.toUTCString();
  }

  /**
    Handle navigating to the deployment flow.

    @method _displayFlow
  */
  _displayFlow() {
    // TODO: In the future the deployment flow must be opened in sandbox mode
    // at demo.jujucharms.com.
    this.props.changeState({
      gui: {
        deploy: 'flow'
      }
    });
    this._setBetaCookie(false);
  }

  /**
    Handle the email registration.

    @method _handleSignup
  */
  _handleSignup() {
    this._setBetaCookie(true);
    this.props.changeState({
      gui: {
        deploy: 'flow'
      }
    });
  }

  render() {
    return (
      <DeploymentPanel
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
                <GenericButton
                  action={this._displayFlow.bind(this)}
                  type="inline-neutral">
                  Deployment demo of Juju
                </GenericButton>
              </p>
            </div>
            <div className="prepend-one four-col last-col">
              <SvgIcon
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
                <a className="button--inline-positive"
                  href="https://jujucharms.com/beta"
                  onClick={this._handleSignup.bind(this)}
                  target="_blank">
                    Sign up for early access
                </a>
              </p>
            </div>
            <div className="six-col last-col">
              <ul className="inline-logos no-bullets">
                <li className="inline-logos__item">
                  <SvgIcon
                    className="inline-logos__image"
                    name="aws"
                    size="100%" />
                </li>
                <li className="inline-logos__item">
                  <SvgIcon
                    className="inline-logos__image"
                    name="google"
                    size="100%" />
                </li>
                <li className="inline-logos__item">
                  <SvgIcon
                    className="inline-logos__image"
                    name="azure"
                    size="100%" />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </DeploymentPanel>
    );
  }
};

DeploymentSignup.propTypes = {
  changeState: PropTypes.func.isRequired,
  exportEnvironmentFile: PropTypes.func.isRequired,
  modelName: PropTypes.string.isRequired,
  staticURL: PropTypes.string
};

module.exports = DeploymentSignup;
