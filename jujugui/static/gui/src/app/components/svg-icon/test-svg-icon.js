/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const SvgIcon = require('./svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('SvgIcon', function() {

  it('can render an icon', function() {
    var output = jsTestUtils.shallowRender(
      <SvgIcon
        name="icon-name"
        size="24" />);
    assert.deepEqual(output,
      <svg className="svg-icon" style={{width: '24px', height: '24px'}}
        viewBox='0 0 24 24'>
        <use xlinkHref="#icon-name" />
      </svg>);
  });

  it('can set a width and height', function() {
    var output = jsTestUtils.shallowRender(
      <SvgIcon
        height="44"
        name="icon-name"
        width="24" />);
    assert.deepEqual(output,
      <svg className="svg-icon" style={{width: '24px', height: '44px'}}
        viewBox='0 0 24 44'>
        <use xlinkHref="#icon-name" />
      </svg>);
  });

  it('can set a default width and height', function() {
    var output = jsTestUtils.shallowRender(
      <SvgIcon
        name="icon-name" />);
    assert.deepEqual(output,
      <svg className="svg-icon" style={{width: '16px', height: '16px'}}
        viewBox='0 0 16 16'>
        <use xlinkHref="#icon-name" />
      </svg>);
  });

  it('can set a class', function() {
    var output = jsTestUtils.shallowRender(
      <SvgIcon
        className="extra-class"
        name="icon-name"
        size="24" />);
    assert.deepEqual(output,
      <svg className="svg-icon extra-class" style={{width: '24px', height: '24px'}}
        viewBox='0 0 24 24'>
        <use xlinkHref="#icon-name" />
      </svg>);
  });
});
