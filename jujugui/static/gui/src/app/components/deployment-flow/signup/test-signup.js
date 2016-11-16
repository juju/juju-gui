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
                action={instance._displayFlow}
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
                  action={instance._handleSignup}
                  type="inline-positive"
                  submit={true}
                  title="Lorem ipsum" />
              </form>
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
    output.props.children.props.children[0].props.children[2].props.children[1]
      .props.action();
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
