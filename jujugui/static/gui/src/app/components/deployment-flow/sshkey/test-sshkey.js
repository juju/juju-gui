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

describe('DeploymentSSHKey', function() {
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
      <div>
        <p>
          Optionally provide a SSH key (e.g. ~/.ssh/id_rsa.pub) to allow
          accessing machines provisioned on this model via "juju ssh".
          <br/> SSH keys can be added at any time using "juju add-ssh-key" or
          "juju import-ssh-key".
        </p>
        <juju.components.GenericInput
          label="SSH key"
          key="sshKey"
          ref="sshKey"
          multiLine={true}
          onBlur={comp.instance._onSSHKeyInputBlur}
          required={false}
          validate={undefined}
        />
      </div>
    );
    assert.deepEqual(comp.output, expectedOutput);
  });

  it('renders with azure', function() {
    const comp = render('azure');
    const expectedOutput = (
      <div>
        <p>
          Provide the SSH key (e.g. ~/.ssh/id_rsa.pub) that will be used to
          provision machines on Azure.
          <br/> Additional keys can be added at any time using
          "juju add-ssh-key" or "juju import-ssh-key".
        </p>
        <juju.components.GenericInput
          label="SSH key"
          key="sshKey"
          ref="sshKey"
          multiLine={true}
          onBlur={comp.instance._onSSHKeyInputBlur}
          required={true}
          validate={[{
            regex: /\S+/,
            error: 'This field is required.'
          }]}
        />
      </div>
    );
    assert.deepEqual(comp.output, expectedOutput);
  });

  it('stores the SSH key', function() {
    const comp = render('gce');
    const input = comp.output.props.children[1];
    // Simulate returning a value from a blur event.
    comp.instance.refs = {sshKey: {getValue: () => 'my SSH key'}};
    input.props.onBlur();
    // The SSH key has been stored.
    assert.strictEqual(setSSHKey.callCount, 1);
    const args = setSSHKey.args[0];
    assert.strictEqual(args.length, 1);
    assert.equal(args[0], 'my SSH key');
  });

});
