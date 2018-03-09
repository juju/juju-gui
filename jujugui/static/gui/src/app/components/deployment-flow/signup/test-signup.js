/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentSignup = require('./signup');
const GenericButton = require('../../generic-button/generic-button');
const DeploymentPanel = require('../panel/panel');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('DeploymentSignup', function() {

  it('can render', function() {
    const changeState = sinon.stub();
    const exportEnvironmentFile = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <DeploymentSignup
        changeState={changeState}
        exportEnvironmentFile={exportEnvironmentFile}
        modelName="Prawns on the barbie">
        <span>content</span>
      </DeploymentSignup>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    const expected = (
      <DeploymentPanel
        changeState={changeState}
        title="Prawns on the barbie">
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
                  action={instance._displayFlow}
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
                  onClick={instance._handleSignup}
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
      </DeploymentPanel>);
    expect(output).toEqualJSX(expected);
  });

  it('can navigate to the flow view', function() {
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <DeploymentSignup
        changeState={changeState}
        exportEnvironmentFile={sinon.stub()}
        modelName="Lamington">
        <span>content</span>
      </DeploymentSignup>);
    output.props.children.props.children[0].props.children[1].props.children[3]
      .props.children[1].props.action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        deploy: 'flow'
      }
    });
  });

});
