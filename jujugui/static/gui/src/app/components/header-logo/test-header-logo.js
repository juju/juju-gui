/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const HeaderLogo = require('./header-logo');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('HeaderLogo', function() {

  it('renders for gisf', () => {
    const showProfile = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <HeaderLogo
        gisf={true}
        homePath="/"
        showProfile={showProfile} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <a href="/" onClick={showProfile} role="button" title="Home">
        <SvgIcon className="svg-icon"
          height="35"
          name="juju-logo" width="90" />
      </a>);
    expect(output).toEqualJSX(expected);
  });

  it('renders for gijoe', () => {
    const showProfile = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <HeaderLogo
        gisf={false}
        homePath="/u/hatch"
        showProfile={showProfile} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <a href="/u/hatch" onClick={showProfile} role="button" title="Home">
        <SvgIcon className="svg-icon"
          height="35"
          name="juju-logo" width="90" />
      </a>);
    expect(output).toEqualJSX(expected);
  });

  it('calls showProfile on click in gijoe', () => {
    const showProfile = sinon.stub();
    const preventDefault = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <HeaderLogo
        gisf={false}
        homePath="/u/hatch"
        showProfile={showProfile} />, true);
    const output = renderer.getRenderOutput();
    // Call the click handler
    output.props.onClick({preventDefault});
    assert.equal(preventDefault.callCount, 1);
    assert.equal(showProfile.callCount, 1);
  });

  it('does not call showProfile on click in gisf', () => {
    const showProfile = sinon.stub();
    const preventDefault = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <HeaderLogo
        gisf={true}
        homePath="/u/hatch"
        showProfile={showProfile} />, true);
    const output = renderer.getRenderOutput();
    // Call the click handler
    output.props.onClick({preventDefault});
    assert.equal(preventDefault.callCount, 0);
    assert.equal(showProfile.callCount, 0);
  });
});
