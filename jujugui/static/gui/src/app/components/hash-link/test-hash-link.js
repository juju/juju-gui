/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const HashLink = require('./hash-link');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('HashLink', () => {

  it('can render', () => {
    const renderer = jsTestUtils.shallowRender(
      <HashLink
        changeState={sinon.stub()}
        hash="readme" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="hash-link"
        onClick={instance._handleClick}>
        <SvgIcon
          name="anchor_16"
          size="16" />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can change the has state', () => {
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <HashLink
        changeState={changeState}
        hash="readme" />, true);
    const output = renderer.getRenderOutput();
    output.props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      hash: 'readme'
    });
  });
});
