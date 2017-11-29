/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorHeader = require('./header');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('InspectorHeader', function() {

  it('displays the provided title', function() {
    const output = jsTestUtils.shallowRender(
      <InspectorHeader
        backCallback={sinon.stub()}
        title="Juju GUI"
        changeState={sinon.stub()}
      />);
    assert.equal(output.props.children[1].props.children, 'Juju GUI');
  });

  it('adds a class based on the provided type', function() {
    const output = jsTestUtils.shallowRender(
      <InspectorHeader
        backCallback={sinon.stub()}
        title="Juju GUI"
        type="error"
        changeState={sinon.stub()}
      />);
    assert.equal(output.props.className,
      'inspector-header inspector-header--type-error');
  });

  it('does not add a type class if it is not provided', function() {
    const output = jsTestUtils.shallowRender(
      <InspectorHeader
        backCallback={sinon.stub()}
        title="Juju GUI"
        changeState={sinon.stub()}
      />);
    assert.equal(output.props.className, 'inspector-header');
  });

  it('displays the provided icon', function() {
    const output = jsTestUtils.shallowRender(
      <InspectorHeader
        backCallback={sinon.stub()}
        icon="icon.svg"
        title="Juju GUI"
        changeState={sinon.stub()}
      />);
    assert.equal(output.props.children[2].props.children.props.src, 'icon.svg');
  });

  it('calls supplied callable when clicked', function() {
    var callbackStub = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <InspectorHeader
        backCallback={callbackStub}
        title="Juju GUI"
        changeState={sinon.stub()}
      />);
    output.props.onClick();
    assert.equal(callbackStub.callCount, 1);
  });
});
