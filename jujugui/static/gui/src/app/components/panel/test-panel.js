/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Panel = require('./panel');

const jsTestUtils = require('../../utils/component-test-utils');

describe('PanelComponent', function() {

  it('generates a visible panel when visible flag is provided', function() {
    var instanceName = 'custom-instance-name';
    var renderer = jsTestUtils.shallowRender(
      <Panel
        instanceName={instanceName}
        visible={true} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="panel-component custom-instance-name"
        onClick={instance._handleClick}
        ref="content"
        tabIndex="0">
        <div className="panel-component__inner"
          onClick={instance._stopBubble}>
          {undefined}
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('generates a hidden panel if visible flag is falsey', function() {
    var instanceName = 'custom-instance-name';
    var renderer = jsTestUtils.shallowRender(
      <Panel
        instanceName={instanceName}
        visible={false} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="panel-component custom-instance-name hidden"
        onClick={instance._handleClick}
        ref="content"
        tabIndex="0">
        <div className="panel-component__inner"
          onClick={instance._stopBubble}>
          {undefined}
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('renders provided children components', function() {
    var instanceName = 'custom-instance-name';
    var renderer = jsTestUtils.shallowRender(
      <Panel
        instanceName={instanceName}
        visible={true}>
        <div>child</div>
      </Panel>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    const expected = (
      <div className="panel-component custom-instance-name"
        onClick={instance._handleClick}
        ref="content"
        tabIndex="0">
        <div className="panel-component__inner"
          onClick={instance._stopBubble}>
          <div>child</div>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can call a function on click if provided', function() {
    var instanceName = 'custom-instance-name';
    var clickAction = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <Panel
        clickAction={clickAction}
        instanceName={instanceName}
        visible={true} />, true);
    var instance = renderer.getMountedInstance();
    instance._handleClick();
    assert.equal(clickAction.callCount, 1);
  });

  it('does not bubble clicks from the children', function() {
    var instanceName = 'custom-instance-name';
    var clickAction = sinon.stub();
    var stopPropagation = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <Panel
        clickAction={clickAction}
        instanceName={instanceName}
        visible={true} />, true);
    var output = renderer.getRenderOutput();
    output.props.children.props.onClick({stopPropagation: stopPropagation});
    assert.equal(stopPropagation.callCount, 1);
    assert.equal(clickAction.callCount, 0);
  });

  it('sets the keyboard focus when it loads', function() {
    var focus = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <Panel
        instanceName="my-panel"
        visible={true} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {content: {focus: focus}};
    instance.componentDidMount();
    assert.equal(focus.callCount, 1);
  });

  it('can not set the keyboard focus on load', function() {
    var focus = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <Panel
        focus={false}
        instanceName="my-panel"
        visible={true} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {content: {focus: focus}};
    instance.componentDidMount();
    assert.equal(focus.callCount, 0);
  });
});
