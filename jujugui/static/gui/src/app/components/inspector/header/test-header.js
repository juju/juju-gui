/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorHeader = require('./header');

const testUtils = require('react-dom/test-utils');

describe('InspectorHeader', function() {

  it('displays the provided title', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <InspectorHeader
        backCallback={sinon.stub()}
        title="Juju GUI" />);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.children[1].props.children, 'Juju GUI');
  });

  it('adds a class based on the provided type', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <InspectorHeader
        backCallback={sinon.stub()}
        title="Juju GUI"
        type="error" />);

    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.className,
      'inspector-header inspector-header--type-error');
  });

  it('does not add a type class if it is not provided', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <InspectorHeader
        backCallback={sinon.stub()}
        title="Juju GUI" />);

    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.className, 'inspector-header');
  });

  it('displays the provided icon', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <InspectorHeader
        backCallback={sinon.stub()}
        icon="icon.svg"
        title="Juju GUI" />);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.children[2].props.children.props.src, 'icon.svg');
  });

  it('calls supplied callable when clicked', function() {
    var callbackStub = sinon.stub();
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <InspectorHeader
        backCallback={callbackStub}
        title="Juju GUI" />);
    var output = shallowRenderer.getRenderOutput();
    output.props.onClick();
    assert.equal(callbackStub.callCount, 1);
  });
});
