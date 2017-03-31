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

describe('DeploymentVPC', function() {
  let setVPCId;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-vpc', function() {
      done();
    });
  });

  beforeEach(() => {
    setVPCId = sinon.stub();
  });

  // Render the component and return the instance and the output.
  const render = () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentVPC setVPCId={setVPCId}/>, true);
    return {
      instance: renderer.getMountedInstance(),
      output: renderer.getRenderOutput()
    };
  };

  it('renders to show the VPC widgets', function() {
    const comp = render('aws');
    const expectedOutput = (
      <div>
        <p>
          Optionally use a specific AWS VPC ID. When not specified, Juju
          requires a default VPC or EC2-Classic features to be available for
          the account/region.
        </p>
        <juju.components.GenericInput
          label="VPC id"
          key="vpcId"
          ref="vpcId"
          multiLine={false}
          onBlur={comp.instance._onInputBlur}
          required={false}
        />
      </div>
    );
    assert.deepEqual(comp.output, expectedOutput);
  });

  it('stores the VPC value', function() {
    const comp = render();
    const input = comp.output.props.children[1];
    // Simulate returning a value from a blur event.
    comp.instance.refs = {vpcId: {getValue: () => 'my VPC id'}};
    input.props.onBlur();
    // The VPC id value has been stored.
    assert.strictEqual(setVPCId.callCount, 1);
    const args = setVPCId.args[0];
    assert.strictEqual(args.length, 1);
    assert.equal(args[0], 'my VPC id');
  });

});
