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

  // Check that the setVPCId function has been called for the expected number
  // of times and, the last time, with the expected id value and force flag.
  const checkSetVPCIdCalled = (expectedTimes, expectedId, expectedForce) => {
    assert.strictEqual(setVPCId.callCount, expectedTimes, 'call count');
    const args = setVPCId.args[expectedTimes-1];
    assert.strictEqual(args.length, 2, 'args');
    assert.strictEqual(args[0], expectedId, 'id');
    assert.strictEqual(args[1], expectedForce, 'force');
  };

  it('renders to show the VPC widgets', function() {
    const comp = render('aws');
    const vpcLink =
    'http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/default-vpc.html';
    const expectedOutput = (
      <div className="twelve-col">
        <p>Juju uses your default VPC – or you can specify one here.</p>
        <p>AWS accounts created since December 2013 have this –&nbsp;
          older accounts may not.&nbsp;
          <a className="link"
            target="_blank" href={vpcLink}>Default VPC basics.</a>
        </p>
        <div className="six-col">
          <juju.components.GenericInput
            label="VPC ID"
            key="vpcId"
            ref="vpcId"
            multiLine={false}
            onBlur={comp.instance._onInputBlur}
            onKeyUp={comp.instance._onInputKeyUp}
            required={false}
          />
          <label>
            <input
              type="checkbox"
              id="vpcIdForce"
              onChange={comp.instance._onCheckboxChange}
              onClick={comp.instance._onCheckboxClick}
              checked={false}
              disabled={false}
            />
            &nbsp;
            Always use this ID
          </label>
        </div>
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

  it('stores the VPC data', function() {
    const comp = render();
    const children = comp.output.props.children.props.children;
    const input = children[2].props.children;
    // Simulate returning a value from the id value field.
    comp.instance.refs = {vpcId: {getValue: () => 'my-id'}};
    input.props.onBlur();
    // The VPC data has been stored.
    checkSetVPCIdCalled(1, 'my-id', false);
  });

  it('forces the VPC data', function() {
    const comp = render();
    const children = comp.output.props.children.props.children;
    const input = children[2].props.children;
    const checkbox = children[3].props.children;
    // Simulate forcing a value from the id value field.
    comp.instance.refs = {vpcId: {getValue: () => 'forced-id'}};
    checkbox.props.onChange({target: {checked: true}});
    input.props.onBlur();
    // The VPC data has been stored.
    checkSetVPCIdCalled(2, 'forced-id', true);
  });

  it('enables or disable the force check box', function() {
    const comp = render();
    const children = comp.output.props.children;
    const instance = comp.instance;
    const input = children[2].props.children;
    // Check that the force check box is initially disabled.
    assert.strictEqual(instance.state.forceEnabled, false, 'initial');
    // Simulate returning a value from the id value field.
    instance.refs = {vpcId: {getValue: () => 'my-id'}};
    input.props.onKeyUp();
    // The check box is now enabled.
    assert.strictEqual(instance.state.forceEnabled, true, 'enabled');
    // Simulate returning no value from the id value field.
    instance.refs = {vpcId: {getValue: () => ''}};
    input.props.onKeyUp();
    // The check box is now disabled again.
    assert.strictEqual(instance.state.forceEnabled, false, 'disabled again');
  });
});
