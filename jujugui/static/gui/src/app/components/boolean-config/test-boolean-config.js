/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const BooleanConfig = require('./boolean-config');

const jsTestUtils = require('../../utils/component-test-utils');

describe('BooleanConfig', function() {

  it('renders a checked input based on config prop', function() {
    const option = {
      key: 'testcheck',
      description: 'it is a test config option'
    };
    const output = jsTestUtils.shallowRender(
      <BooleanConfig
        config={true}
        label="Test"
        option={option} />
    );
    const input = output.props.children[0].props.children[1].props.children[0];
    const expected = (
      <div className="boolean-config">
        <div className="boolean-config--toggle-container">
          <div className="boolean-config--title">Test</div>
          <div className="boolean-config--toggle">
            <input
              disabled={false}
              type="checkbox"
              id={option.key}
              onClick={input.props.onClick}
              onChange={input.props.onChange}
              defaultChecked={true}
              className="boolean-config--input" />
            <label
              htmlFor={option.key}
              className="boolean-config--label">
              <div className="boolean-config--handle"></div>
            </label>
          </div>
        </div>
        <div className="boolean-config--description"
          dangerouslySetInnerHTML={{__html: option.description}}>
        </div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders an unchecked input based on config prop', function() {
    const option = {
      key: 'testcheck',
      description: 'it is a test config option'
    };
    const output = jsTestUtils.shallowRender(
      <BooleanConfig
        config={false}
        label="Test"
        option={option} />
    );
    const input = output.props.children[0].props.children[1].props.children[0];
    expect(output).toEqualJSX(
      <div className="boolean-config">
        <div className="boolean-config--toggle-container">
          <div className="boolean-config--title">Test</div>
          <div className="boolean-config--toggle">
            <input
              disabled={false}
              type="checkbox"
              id={option.key}
              onClick={input.props.onClick}
              onChange={input.props.onChange}
              defaultChecked={false}
              className="boolean-config--input" />
            <label
              htmlFor={option.key}
              className="boolean-config--label">
              <div className="boolean-config--handle"></div>
            </label>
          </div>
        </div>
        <div className="boolean-config--description"
          dangerouslySetInnerHTML={{__html: option.description}}>
        </div>
      </div>);
  });

  it('supports string boolean config props (true)', function() {
    const option = {
      key: 'testcheck',
      description: 'it is a test config option'
    };
    const output = jsTestUtils.shallowRender(
      <BooleanConfig
        config="True"
        label="Test"
        option={option} />
    );
    const input = output.props.children[0].props.children[1].props.children[0];
    expect(output).toEqualJSX(
      <div className="boolean-config">
        <div className="boolean-config--toggle-container">
          <div className="boolean-config--title">Test</div>
          <div className="boolean-config--toggle">
            <input
              disabled={false}
              type="checkbox"
              id={option.key}
              onClick={input.props.onClick}
              onChange={input.props.onChange}
              defaultChecked={true}
              className="boolean-config--input" />
            <label
              htmlFor={option.key}
              className="boolean-config--label boolean-config--label-changed">
              <div className="boolean-config--handle"></div>
            </label>
          </div>
        </div>
        <div className="boolean-config--description"
          dangerouslySetInnerHTML={{__html: option.description}}>
        </div>
      </div>);
  });

  it('supports string boolean config props (false)', function() {
    const option = {
      key: 'testcheck',
      description: 'it is a test config option'
    };
    const output = jsTestUtils.shallowRender(
      <BooleanConfig
        config="False"
        label="Test"
        option={option} />
    );
    const input = output.props.children[0].props.children[1].props.children[0];
    expect(output).toEqualJSX(
      <div className="boolean-config">
        <div className="boolean-config--toggle-container">
          <div className="boolean-config--title">Test</div>
          <div className="boolean-config--toggle">
            <input
              disabled={false}
              type="checkbox"
              id={option.key}
              onClick={input.props.onClick}
              onChange={input.props.onChange}
              defaultChecked={false}
              className="boolean-config--input" />
            <label
              htmlFor={option.key}
              className="boolean-config--label boolean-config--label-changed">
              <div className="boolean-config--handle"></div>
            </label>
          </div>
        </div>
        <div className="boolean-config--description"
          dangerouslySetInnerHTML={{__html: option.description}}>
        </div>
      </div>);
  });

  it('can call an onChange method if supplied', function() {
    const onChange = sinon.stub();
    const option = {
      key: 'testcheck',
      description: 'it is a test config option'
    };
    const output = jsTestUtils.shallowRender(
      <BooleanConfig
        config="False"
        label="Test"
        onChange={onChange}
        option={option} />
    );
    const input = output.props.children[0].props.children[1].props.children[0];
    input.props.onChange({
      target: {
        checked: true
      }
    });
    assert.equal(onChange.callCount, 1);
  });

  it('can be disabled', function() {
    const option = {
      key: 'testcheck',
      description: 'it is a test config option'
    };
    const output = jsTestUtils.shallowRender(
      <BooleanConfig
        config={true}
        disabled={true}
        label="Test"
        option={option} />
    );
    const input = output.props.children[0].props.children[1].props.children[0];
    const expected = (
      <input
        disabled={true}
        type="checkbox"
        id={option.key}
        onClick={input.props.onClick}
        onChange={input.props.onChange}
        defaultChecked={true}
        className="boolean-config--input" />);
    expect(input).toEqualJSX(expected);
  });
});
