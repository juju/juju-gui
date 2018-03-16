/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentVPC = require('./vpc');
const GenericInput = require('../../generic-input/generic-input');

describe('DeploymentVPC', function() {
  let setVPCId;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentVPC
      setVPCId={options.setVPCId || setVPCId} />
  );

  beforeEach(() => {
    setVPCId = sinon.stub();
  });

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
    const wrapper = renderComponent();
    const vpcLink =
    'http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/default-vpc.html';
    const expected = (
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
            onBlur={wrapper.find('GenericInput').prop('onBlur')}
            onKeyUp={wrapper.find('GenericInput').prop('onKeyUp')}
            ref="vpcId"
            required={false} />
          <label>
            <input
              checked={false}
              disabled={true}
              id="vpcIdForce"
              onChange={wrapper.find('input').prop('onChange')}
              onClick={wrapper.find('input').prop('onClick')}
              type="checkbox" />
            &nbsp;
            Always use this ID
          </label>
        </div>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('stores the VPC data', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    // Simulate returning a value from the id value field.
    instance.refs = {vpcId: {getValue: () => 'my-id'}};
    wrapper.find('GenericInput').props().onBlur();
    // The VPC data has been stored.
    checkSetVPCIdCalled(1, 'my-id', false);
  });

  it('forces the VPC data', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    const checkbox = wrapper.find('input');

    // Simulate forcing a value from the id value field.
    instance.refs = {vpcId: {getValue: () => 'forced-id'}};
    checkbox.props().onChange.call(instance, {target: {checked: true}});
    wrapper.find('GenericInput').props().onBlur();
    // The VPC data has been stored.
    checkSetVPCIdCalled(2, 'forced-id', true);
  });

  it('enables or disable the force check box', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    const input = wrapper.find('GenericInput');
    // Check that the force check box is initially disabled.
    assert.strictEqual(instance.state.forceEnabled, false, 'initial');
    // Simulate returning a value from the id value field.
    instance.refs = {vpcId: {getValue: () => 'my-id'}};
    input.props().onKeyUp();
    // The check box is now enabled.
    assert.strictEqual(instance.state.forceEnabled, true, 'enabled');
    // Simulate returning no value from the id value field.
    instance.refs = {vpcId: {getValue: () => ''}};
    input.props().onKeyUp();
    // The check box is now disabled again.
    assert.strictEqual(instance.state.forceEnabled, false, 'disabled again');
  });
});
