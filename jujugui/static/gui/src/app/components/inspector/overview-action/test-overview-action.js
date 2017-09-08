/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const OverviewAction = require('./overview-action');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('OverviewAction', function() {

  it('calls the callable provided when clicked', function() {
    var callbackStub = sinon.stub();
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <OverviewAction
        action={callbackStub}
        title="spinach" />);
    var output = shallowRenderer.getRenderOutput();
    output.props.onClick();
    assert.equal(callbackStub.callCount, 1);
  });

  it('displays the provided title', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <OverviewAction
        action={sinon.stub()}
        title="My action" />);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.children[1].props.children, 'My action');
  });

  it('sets the provided icon', function() {
    var output = jsTestUtils.shallowRender(
      <OverviewAction
        action={sinon.stub()}
        icon="action-icon"
        title="spinach" />);
    assert.deepEqual(output.props.children[0],
      <span className="overview-action__icon">
        <SvgIcon name="action-icon"
          size="16" />
      </span>);
  });

  it('sets the link', function() {
    var linkAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <OverviewAction
        action={sinon.stub()}
        linkAction={linkAction}
        linkTitle="Juju Charms"
        title="spinach" />);
    var link = output.props.children[2];
    assert.deepEqual(link,
      <span className="overview-action__link"
        onClick={link.props.onClick}>
          Juju Charms
      </span>);
  });

  it('calls the supplied action when the link is clicked', function() {
    var linkAction = sinon.stub();
    var stopPropagation = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <OverviewAction
        action={sinon.stub()}
        linkAction={linkAction}
        linkTitle="Juju Charms"
        title="spinach" />);
    output.props.children[2].props.onClick({
      stopPropagation: stopPropagation
    });
    assert.equal(linkAction.callCount, 1);
    assert.equal(stopPropagation.callCount, 1);
  });

  it('hides the link if it is not provided', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <OverviewAction
        action={sinon.stub()}
        title="spinach" />);
    var output = shallowRenderer.getRenderOutput();
    assert.isTrue(output.props.children[2].props.className.indexOf(
      'hidden') > -1);
  });

  it('sets the value', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <OverviewAction
        action={sinon.stub()}
        title="spinach"
        value="5" />);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.children[3].props.children, '5');
  });

  it('sets the value type class', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <OverviewAction
        action={sinon.stub()}
        title="spinach"
        value="5"
        valueType="pending" />);
    var output = shallowRenderer.getRenderOutput();
    assert.isTrue(output.props.children[3].props.className.indexOf(
      'overview-action__value--type-pending') > -1);
  });

  it('hides the value if it is not provided', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <OverviewAction
        action={sinon.stub()}
        title="spinach" />);
    var output = shallowRenderer.getRenderOutput();
    assert.isTrue(output.props.children[3].props.className.indexOf(
      'hidden') > -1);
  });
});
