/* Copyright (c) 2017 Canonical Ltd */
'use strict';

const React = require('react');

const Lightbox = require('../lightbox/lightbox');
const SvgIcon = require('../svg-icon/svg-icon');
const Terminal = require('./terminal');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Terminal', () => {

  let addNotification;

  beforeEach(() => {
    addNotification = sinon.stub;
  });

  it('should display a button', () => {
    const renderer = jsTestUtils.shallowRender(
      <Terminal
        addNotification={addNotification}
        address={undefined}
        creds={undefined}
      />, true);
    const output = renderer.getRenderOutput();
    const classes = 'model-actions__import model-actions__button ' +
      'model-actions__button-disabled';
    const expected = (
      <span className={classes}
        onClick={undefined}
        role="button"
        tabIndex="0">
        <SvgIcon name="code-snippet_24"
          className="model-actions__icon"
          size="16" />
        <span className="tooltip__tooltip--below">
          <span className="tooltip__inner tooltip__inner--up">
            Juju shell
          </span>
        </span>
      </span>
    );
    expect(output).toEqualJSX(expected);
  });

  it('should only enable the button when an address is available', () => {
    const renderer = jsTestUtils.shallowRender(
      <Terminal
        addNotification={addNotification}
        address="http://1.2.3.4"
        creds={undefined}
      />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const classes = 'model-actions__import model-actions__button';
    const expected = (
      <span className={classes}
        onClick={instance.setOpened}
        role="button"
        tabIndex="0">
        <SvgIcon name="code-snippet_24"
          className="model-actions__icon"
          size="16" />
        <span className="tooltip__tooltip--below">
          <span className="tooltip__inner tooltip__inner--up">
            Juju shell
          </span>
        </span>
      </span>
    );
    expect(output).toEqualJSX(expected);
  });

  it('should open the Lightbox when button is clicked', () => {
    const renderer = jsTestUtils.shallowRender(
      <Terminal
        addNotification={addNotification}
        address="http://1.2.3.4"
        creds={undefined}
      />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    output.props.onClick();
    output = renderer.getRenderOutput();
    const expected = (
      <Lightbox close={instance.setOpened}>
        <div className="juju-shell__terminal-container"></div>
      </Lightbox>
    );
    expect(output).toEqualJSX(expected);
  });

  it('should start and stop a terminal session', () => {
    const renderer = jsTestUtils.shallowRender(
      <Terminal
        addNotification={addNotification}
        address="http://1.2.3.4"
        creds={undefined}
      />, true);
    const startTerm = sinon.stub();
    const stopTerm = sinon.stub();
    const instance = renderer.getMountedInstance();
    instance.startTerm = startTerm;
    instance.stopTerm = stopTerm;
    // Ensure that startTerm and stopTerm are called when state changes.
    instance.setOpened(true);
    instance.componentDidUpdate({}, {opened: false});
    assert.strictEqual(startTerm.callCount, 1);
    instance.setOpened(false);
    instance.componentDidUpdate({}, {opened: true});
    assert.strictEqual(stopTerm.callCount, 1);
  });
});
