/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const GenericButton = require('./generic-button');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('GenericButton', function() {

  it('calls the callable provided when clicked', function() {
    var callbackStub = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <GenericButton
        action={callbackStub} />);
    output.props.onClick({
      stopPropagation: sinon.stub()
    });
    assert.equal(callbackStub.callCount, 1);
  });

  it('does not call the callable if clicked when disabled', function() {
    var callbackStub = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <GenericButton
        action={callbackStub}
        disabled={true} />);
    output.props.onClick({
      stopPropagation: sinon.stub()
    });
    assert.equal(callbackStub.callCount, 0);
  });

  it('does not submit when disabled', function() {
    var preventDefault = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <GenericButton
        disabled={true}
        submit={true} />);
    output.props.onClick({
      preventDefault: preventDefault,
      stopPropagation: sinon.stub()
    });
    assert.equal(preventDefault.callCount, 1);
  });

  it('does not call the callable if not provided', function() {
    // This is checking that code is not executed and so there are no side
    // effects to check. No syntax error is considered a success.
    var output = jsTestUtils.shallowRender(
      <GenericButton />);
    output.props.onClick({
      stopPropagation: sinon.stub()
    });
  });

  it('stop the event propogating when clicked', function() {
    var callbackStub = sinon.stub();
    var stopPropagation = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <GenericButton
        action={callbackStub} />);
    output.props.onClick({
      stopPropagation: stopPropagation
    });
    assert.equal(stopPropagation.callCount, 1);
  });

  it('displays the provided title and tooltip', function() {
    var output = jsTestUtils.shallowRender(
      <GenericButton
        tooltip="My tooltip">
        My action
      </GenericButton>);
    const expected = (
      <button className="button--neutral"
        onClick={output.props.onClick}
        title="My tooltip"
        type="button">
        My action
      </button>);
    expect(output).toEqualJSX(expected);
  });

  it('displays a provided icon', function() {
    var output = jsTestUtils.shallowRender(
      <GenericButton>
        <SvgIcon name="plus_1"
          size="16" />
      </GenericButton>);
    const expected = (
      <button className="button--neutral"
        onClick={output.props.onClick}
        title={undefined}
        type="button">
        <SvgIcon name="plus_1"
          size="16" />
      </button>);
    expect(output).toEqualJSX(expected);
  });

  it('displays provided children', function() {
    var output = jsTestUtils.shallowRender(
      <GenericButton>
        Hello, world.
      </GenericButton>
    );
    const expected = (
      <button className="button--neutral"
        onClick={output.props.onClick}
        title={undefined}
        type="button">
        Hello, world.
      </button>);
    expect(output).toEqualJSX(expected);
  });

  it('sets the type class', function() {
    var output = jsTestUtils.shallowRender(
      <GenericButton
        type="neutral">
        My action
      </GenericButton>);
    const expected = (
      <button className="button--neutral"
        onClick={output.props.onClick}
        title={undefined}
        type="button">
        My action
      </button>);
    expect(output).toEqualJSX(expected);
  });

  it('sets the disabled class if disabled', function() {
    var output = jsTestUtils.shallowRender(
      <GenericButton
        disabled={true}>
        My action
      </GenericButton>);
    const expected = (
      <button className="button--neutral button--disabled"
        onClick={output.props.onClick}
        title={undefined}
        type="button">
        My action
      </button>);
    expect(output).toEqualJSX(expected);
  });

  it('sets the extra classes if provided', function() {
    var output = jsTestUtils.shallowRender(
      <GenericButton
        extraClasses="button--large">
        My action
      </GenericButton>);
    const expected = (
      <button className="button--neutral button--large"
        onClick={output.props.onClick}
        title={undefined}
        type="button">
        My action
      </button>);
    expect(output).toEqualJSX(expected);
  });
});
