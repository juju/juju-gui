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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('DeploymentSignup', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-signup', function() { done(); });
  });

  it('can render', function() {
    const changeState = sinon.stub();
    const exportEnvironmentFile = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSignup
        changeState={changeState}
        exportEnvironmentFile={exportEnvironmentFile}
        modelName="Prawns on the barbie">
        <span>content</span>
      </juju.components.DeploymentSignup>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    const expected = (
      <juju.components.DeploymentPanel
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
                <juju.components.GenericButton
                  action={instance._displayFlow}
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
                  onClick={instance._handleSignup}>
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
      </juju.components.DeploymentPanel>);
    assert.deepEqual(output, expected);
  });

  it('can navigate to the flow view', function() {
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <juju.components.DeploymentSignup
        changeState={changeState}
        exportEnvironmentFile={sinon.stub()}
        modelName="Lamington">
        <span>content</span>
      </juju.components.DeploymentSignup>);
    output.props.children.props.children[0].props.children[1].props.children[3]
      .props.children[1].props.action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'deploy',
        metadata: {
          activeComponent: 'flow'
        }
      }
    });
  });

});
