/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentLogin = require('./login');
const DeploymentSection = require('../section/section');
const SvgIcon = require('../../svg-icon/svg-icon');
const USSOLoginLink = require('../../usso-login-link/usso-login-link');

describe('DeploymentLogin', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentLogin
      addNotification={options.addNotification || sinon.stub()}
      callback={options.callback || sinon.stub()}
      gisf={options.gisf === undefined ? true : options.gisf}
      isDirectDeploy={
        options.isDirectDeploy === undefined ? false : options.isDirectDeploy}
      loginToController={options.loginToController || sinon.stub()}
      showLoginLinks={
        options.showLoginLinks === undefined ? true : options.showLoginLinks} />
  );

  it('can render', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="deployment-login__content twelve-col">
        <p className="deployment-login__intro">
          You will need to sign in with an Ubuntu One account to deploy
          your model with Juju-as-a-Service.
        </p>
        <div className="deployment-login__features">
          <div className="six-col">
            <div className="deployment-login__feature">
              <SvgIcon
                className="deployment-login__tick"
                name="task-done_16"
                size="16" />
              Deploy to all major clouds directly from your browser.
            </div>
            <div className="deployment-login__feature">
              <SvgIcon
                className="deployment-login__tick"
                name="task-done_16"
                size="16" />
              Identity management across all models.
            </div>
          </div>
          <div className="six-col last-col">
            <div className="deployment-login__feature">
              <SvgIcon
                className="deployment-login__tick"
                name="task-done_16"
                size="16" />
              Hosted and managed juju controllers.
            </div>
            <div className="deployment-login__feature">
              <SvgIcon
                className="deployment-login__tick"
                name="task-done_16"
                size="16" />
              Reusable shareable models with unlimited users.
            </div>
          </div>
        </div>
        <div className="deployment-login__login">
          <USSOLoginLink
            addNotification={sinon.stub()}
            callback={sinon.stub()}
            displayType="button"
            gisf={true}
            loginToController={sinon.stub()}>
            Login
          </USSOLoginLink>
        </div>
        <div className="deployment-login__signup">
          Do not have an account?
          <USSOLoginLink
            addNotification={sinon.stub()}
            callback={sinon.stub()}
            displayType="text"
            gisf={true}
            loginToController={sinon.stub()}>
            Sign up
          </USSOLoginLink>
        </div>
      </div>);
    assert.compareJSX(wrapper.find('.deployment-login__content'), expected);
  });

  it('can render for the direct deploy flow', function() {
    const wrapper = renderComponent({ isDirectDeploy: true });
    const expected = (
      <div className="deployment-login__login">
        <DeploymentSection
          instance="deployment-login-signup">
          <span className="deployment-login-signup__message">
              Sign up to start deploying to your favourite cloud
          </span>
          <USSOLoginLink
            addNotification={sinon.stub()}
            callback={sinon.stub()}
            displayType="button"
            gisf={true}
            loginToController={sinon.stub()}>
            Sign up
          </USSOLoginLink>
          or&nbsp;
          <USSOLoginLink
            addNotification={sinon.stub()}
            callback={sinon.stub()}
            displayType="text"
            gisf={true}
            loginToController={sinon.stub()}>
            log in
          </USSOLoginLink>
          to get started with&nbsp;
          <a href="http://jujucharms.com/jaas">
            JAAS
          </a>
        </DeploymentSection>
        <DeploymentSection
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
              <SvgIcon
                height={53}
                name="aws-light"
                width={140} />
            </div>
            <div className="deployment-login-features__logo">
              <SvgIcon
                height={39}
                name="google-light"
                width={435} />
            </div>
            <div className="deployment-login-features__logo">
              <SvgIcon
                height={24}
                name="azure"
                width={204} />
            </div>
          </div>
          <div className="deployment-login-features__items twelve-col">
            <div className="six-col no-margin-bottom">
              <h5 className="deployment-login-features__items-heading">
                <SvgIcon
                  className="deployment-login__tick"
                  name="task-done_16"
                  size="16" />
                Hosted Juju controllers
              </h5>
              <ul className="deployment-login-features__items-list">
                <li>Managed by Canonical, the company behind Ubuntu</li>
                <li>Highly-available, secure, multi-region infrastructure</li>
                <li>24/7 monitoring and alerting</li>
              </ul>
              <h5 className="deployment-login-features__items-heading">
                <SvgIcon
                  className="deployment-login__tick"
                  name="task-done_16"
                  size="16" />
                Share and collaborate
              </h5>
              <ul className="deployment-login-features__items-list">
                <li>Identity management across all models</li>
                <li>Read only mode available</li>
              </ul>
              <h5 className="deployment-login-features__items-heading">
                <SvgIcon
                  className="deployment-login__tick"
                  name="task-done_16"
                  size="16" />
                Deploy to public clouds
              </h5>
              <ul className="deployment-login-features__items-list">
                <li>Use your existing credentials to deploy to any cloud</li>
              </ul>
            </div>
            <div className="six-col last-col no-margin-bottom">
              <h5 className="deployment-login-features__items-heading">
                <SvgIcon
                  className="deployment-login__tick"
                  name="task-done_16"
                  size="16" />
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
                <SvgIcon
                  className="deployment-login__tick"
                  name="task-done_16"
                  size="16" />
                One view of all clouds and models
              </h5>
              <ul className="deployment-login-features__items-list">
                <li>All models shared and owned by you in one place</li>
                <li>Monitor the status of your models at a glance</li>
              </ul>
            </div>
          </div>
        </DeploymentSection>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('does not display the login links when requested', function() {
    const wrapper = renderComponent({
      isDirectDeploy: true,
      showLoginLinks: false
    });
    assert.equal(wrapper.find('USSOLoginLink').length, 0);
  });
});
