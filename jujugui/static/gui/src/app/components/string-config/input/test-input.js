/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const StringConfigInput = require('./input');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('StringConfigInput', function() {

  it('can render', function() {
    const renderer = jsTestUtils.shallowRender(
      <StringConfigInput
        config="config value"
        disabled={false}
        setValue={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    var expected = (
      <div className="string-config-input"
        contentEditable={true}
        dangerouslySetInnerHTML={{__html: 'config value'}}
        onBlur={instance._updateValue}
        onInput={instance._updateValue}
        ref="editableInput">
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can update the value', function() {
    const setValue = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <StringConfigInput
        config="config value"
        disabled={false}
        setValue={setValue} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    instance.refs = {
      editableInput: {
        innerText: 'new value'
      }
    };
    output.props.onInput({
      currentTarget: {
        innerText: 'new value'
      }
    });
    assert.equal(setValue.callCount, 1);
    assert.equal(setValue.args[0][0], 'new value');
  });

  it('does not update if the values are the same', function() {
    const setValue = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <StringConfigInput
        config="config value"
        disabled={false}
        setValue={setValue} />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    instance.refs = {
      editableInput: {
        innerText: 'new value'
      }
    };
    output.props.onInput({
      currentTarget: {
        innerText: 'new value'
      }
    });
    output = renderer.getRenderOutput();
    var expected = (
      <div className="string-config-input"
        contentEditable={true}
        dangerouslySetInnerHTML={{__html: 'config value'}}
        onBlur={instance._updateValue}
        onInput={instance._updateValue}
        ref="editableInput">
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('updates if the values are the different', function() {
    const setValue = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <StringConfigInput
        config="config value"
        disabled={false}
        setValue={setValue} />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    instance.refs = {
      editableInput: {
        innerText: 'new value'
      }
    };
    output.props.onInput({
      currentTarget: {
        innerText: 'another value'
      }
    });
    output = renderer.getRenderOutput();
    var expected = (
      <div className="string-config-input"
        contentEditable={true}
        dangerouslySetInnerHTML={{__html: 'another value'}}
        onBlur={instance._updateValue}
        onInput={instance._updateValue}
        ref="editableInput">
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
