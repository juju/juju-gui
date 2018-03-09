/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentVPC = require('./vpc');
const GenericInput = require('../../generic-input/generic-input');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('DeploymentVPC', function() {
  let setVPCId;

  beforeEach(() => {
    setVPCId = sinon.stub();
  });

  // Render the component and return the instance and the output.
  const render = () => {
    const renderer = jsTestUtils.shallowRender(
      <DeploymentVPC setVPCId={setVPCId} />, true);
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
      <div className="twelve-col no-margin-bottom">
        <p>Juju uses your default VPC – or you can specify one here.</p>
        <p>
          AWS accounts created since December 2013 have this –&nbsp;
          older accounts may not.&nbsp;
          <a className="link"
            href={vpcLink} target="_blank">Default VPC basics.</a>
        </p>
        <div className="six-col">
          <GenericInput
            key="vpcId"
            label="VPC ID"
            multiLine={false}
            onBlur={comp.instance._onInputBlur}
            onKeyUp={comp.instance._onInputKeyUp}
            ref="vpcId"
            required={false} />
          <label>
            <input
              checked={false}
              disabled={true}
              id="vpcIdForce"
              onChange={comp.instance._onCheckboxChange}
              onClick={comp.instance._onCheckboxClick}
              type="checkbox" />
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
    const children = comp.output.props.children;
    const input = children[2].props.children[0];
    // Simulate returning a value from the id value field.
    comp.instance.refs = {vpcId: {getValue: () => 'my-id'}};
    input.props.onBlur();
    // The VPC data has been stored.
    checkSetVPCIdCalled(1, 'my-id', false);
  });

  it('forces the VPC data', function() {
    const comp = render();
    const children = comp.output.props.children;
    const input = children[2].props.children[0];
    const checkbox = children[2].props.children[1].props.children[0];

    // Simulate forcing a value from the id value field.
    comp.instance.refs = {vpcId: {getValue: () => 'forced-id'}};
    checkbox.props.onChange.call(comp.instance, {target: {checked: true}});
    input.props.onBlur();
    // The VPC data has been stored.
    checkSetVPCIdCalled(2, 'forced-id', true);
  });

  it('enables or disable the force check box', function() {
    const comp = render();
    const children = comp.output.props.children;
    const instance = comp.instance;
    const input = children[2].props.children[0];
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
