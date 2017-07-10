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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

fdescribe('DeploymentSSHKey', function() {
  let setSSHKey;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-ssh-key', function() {
      done();
    });
  });

  beforeEach(() => {
    setSSHKey = sinon.stub();
  });

  // Render the component and return the instance and the output.
  const render = cloudType => {
    let cloud = null;
    if (cloudType) {
      cloud = {cloudType: cloudType};
    }
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSSHKey
        cloud={cloud}
        setSSHKey={setSSHKey}
      />, true);
    return {
      instance: renderer.getMountedInstance(),
      output: renderer.getRenderOutput()
    };
  };

  it('does not render without a cloud', function() {
    const comp = render(null);
    assert.strictEqual(comp.output, null);
  });

  it('renders with a cloud', function() {
    const comp = render('aws');
    const expectedOutput = (
      <div className="deployment-ssh-key">
        <p>
          Keys will allow you SSH access to the machines
          provisioned by Juju for this model.
        </p>
        {false}
        {false}
        <div className="twelve-col no-margin-bottom">
          <div className="three-col no-margin-bottom">
            <juju.components.InsetSelect
              disabled={false}
              ref="sshSource"
              label="Source"
              onChange={comp.instance._handleSourceChange.bind(comp.instance)}
              options={[
                {
                  label: 'GitHub',
                  value: 'github'
                },
                {
                  label: 'Manual',
                  value: 'manual'
                }
              ]} />
          </div>
          <div className="three-col last-col no-margin-bottom">
            <juju.components.GenericInput
              ref="githubUsername"
              autocomplete
              key="githubUsername"
              label="GitHub username"
              onKeyUp={comp.instance._onGithubUsernameInputKey.bind(comp.instance)}
              type="text"
              validate={undefined} />
          </div>
          <div className="right">
            <juju.components.GenericButton
              action={comp.instance._onSSHKeyInputKey.bind(comp.instance)}
              disabled
              title="Add Keys"
              type="positive" />
          </div>
        </div>
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

  it('renders with azure', function() {
    const comp = render('azure');
    const expectedOutput = (
      <div className="deployment-ssh-key">
        <p>
          Keys will allow you SSH access to the machines provisioned on Azure.
        </p>
        {false}
        {false}
        <div className="twelve-col no-margin-bottom">
          <div className="three-col no-margin-bottom">
            <juju.components.InsetSelect
              ref="sshSource"
              label="Source"
              onChange={comp.instance._handleSourceChange.bind(comp.instance)}
              options={[
                {
                  label: 'GitHub',
                  value: 'github'
                },
                {
                  label: 'Manual',
                  value: 'manual'
                }
              ]} />
          </div>
          <div className="three-col last-col no-margin-bottom">
            <juju.components.GenericInput
              ref="githubUsername"
              autocomplete
              label="GitHub username"
              onKeyUp={comp.instance._onGithubUsernameInputKey.bind(comp.instance)}
              required
              type="text"
              validate={[
                {
                  error: 'This field is required.',
                  regex: {}
                }
              ]} />
          </div>
          <div className="right">
            <juju.components.GenericButton
              action={comp.instance._onSSHKeyInputKey.bind(comp.instance)}
              disabled
              title="Add Keys"
              type="positive" />
          </div>
        </div>
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

  it('stores the SSH key', function() {
    const comp = render('gce');
    const button = comp.output.props.children[3].props.children[2].props.children;
    // Simulate returning a value from a click.
    comp.instance.refs = {sshKey: {getValue: () => 'my SSH key'}};
    button.props.onClick();
    // The SSH key has been stored.
    assert.strictEqual(setSSHKey.callCount, 1);
    const args = setSSHKey.args[0];
    assert.strictEqual(args.length, 1);
    assert.equal(args[0], 'my SSH key');
  });

});
