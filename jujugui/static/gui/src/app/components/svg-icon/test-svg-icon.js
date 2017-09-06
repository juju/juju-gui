/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const SvgIcon = require('./svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('SvgIcon', function() {

  it('can render an icon', function() {
    var output = jsTestUtils.shallowRender(
      <SvgIcon
        size="24"
        name="icon-name" />);
    assert.deepEqual(output,
      <svg className="svg-icon" viewBox='0 0 24 24'
        style={{width: '24px', height: '24px'}}>
        <use xlinkHref="#icon-name"/>
      </svg>);
  });

  it('can set a width and height', function() {
    var output = jsTestUtils.shallowRender(
      <SvgIcon
        width="24"
        height="44"
        name="icon-name" />);
    assert.deepEqual(output,
      <svg className="svg-icon" viewBox='0 0 24 44'
        style={{width: '24px', height: '44px'}}>
        <use xlinkHref="#icon-name"/>
      </svg>);
  });

  it('can set a default width and height', function() {
    var output = jsTestUtils.shallowRender(
      <SvgIcon
        name="icon-name" />);
    assert.deepEqual(output,
      <svg className="svg-icon" viewBox='0 0 16 16'
        style={{width: '16px', height: '16px'}}>
        <use xlinkHref="#icon-name"/>
      </svg>);
  });

  it('can set a class', function() {
    var output = jsTestUtils.shallowRender(
      <SvgIcon
        size="24"
        className="extra-class"
        name="icon-name" />);
    assert.deepEqual(output,
      <svg className="svg-icon extra-class" viewBox='0 0 24 24'
        style={{width: '24px', height: '24px'}}>
        <use xlinkHref="#icon-name"/>
      </svg>);
  });
});
