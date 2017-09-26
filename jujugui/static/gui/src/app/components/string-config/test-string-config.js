/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const StringConfig = require('./string-config');
const StringConfigInput = require('./input/input');

const jsTestUtils = require('../../utils/component-test-utils');

describe('StringConfig', function() {
  let option;

  beforeEach(() => {
    option = {
      key: 'testconfig',
      type: 'text',
      description: 'test config for strings'
    };
  });

  it('renders a string config', function() {
    var config = 'the value';
    const renderer = jsTestUtils.shallowRender(
      <StringConfig
        config={config}
        option={option} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    var typeString = ` (${option.type})`;
    var expected = (
      <div className="string-config">
        <span className="string-config__label">{option.key}{typeString}</span>
        <div className="string-config--value">
          <StringConfigInput
            config={config}
            disabled={false}
            ref="editableInput"
            setValue={instance._setValue} />
        </div>
        <span className="string-config--description"
          dangerouslySetInnerHTML={{__html: option.description}}>
        </span>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can handle a string config without a config value', function() {
    const renderer = jsTestUtils.shallowRender(
      <StringConfig
        config={undefined}
        option={option} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="string-config--value">
        <StringConfigInput
          config={undefined}
          disabled={false}
          ref="editableInput"
          setValue={instance._setValue} />
      </div>);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('does not show a type if none is provided', function() {
    var option = {
      key: 'testconfig',
      description: 'test config for strings'
    };
    var output = jsTestUtils.shallowRender(
      <StringConfig
        config="initial"
        option={option} />);
    assert.deepEqual(
      output.props.children[0].props.children, ['testconfig', '']);
  });

  it('can be disabled', function() {
    var config = 'the value';
    const renderer = jsTestUtils.shallowRender(
      <StringConfig
        config={config}
        disabled={true}
        option={option} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    var expected = (
      <div className="string-config--value string-config--disabled">
        <StringConfigInput
          config={config}
          disabled={true}
          ref="editableInput"
          setValue={instance._setValue} />
      </div>);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('can display a changed value', function() {
    const renderer = jsTestUtils.shallowRender(
      <StringConfig
        config="the value"
        option={option} />, true);
    const instance = renderer.getMountedInstance();
    instance._setValue('different value');
    const output = renderer.getRenderOutput();
    assert.equal(
      output.props.children[1].props.className,
      'string-config--value string-config--changed');
  });

  it('correctly compares existing numbers', function() {
    const renderer = jsTestUtils.shallowRender(
      <StringConfig
        config={123}
        option={option} />, true);
    const instance = renderer.getMountedInstance();
    instance._setValue('123');
    const output = renderer.getRenderOutput();
    assert.equal(
      output.props.children[1].props.className,
      'string-config--value');
  });
});
