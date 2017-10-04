/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const Clipboard = require('clipboard');
const React = require('react');
const ReactDOM = require('react-dom');

const CopyToClipboard = require('./copy-to-clipboard');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('CopyToClipboard', function() {
  it('renders with a default value', function() {
    var output = jsTestUtils.shallowRender(
      <CopyToClipboard />);
    var className = output.props.className;
    var expected = (
      <div className={className}>
        <input className={className + '__input'}
          ref="input"
          readOnly="true"
          type="text"
          value=""/>
        <button className={className + '__btn'}
          ref="btn">
          <SvgIcon
            name="copy-to-clipboard-16"
            size="16"/>
        </button>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders a user-provided value properly', function() {
    var value = 'foobar';
    var output = testUtils.renderIntoDocument(
      <CopyToClipboard value={value}/>);
    assert.equal(output.refs.input.value, value,
      'Value is not set properly for input');
  });

  // XXX: can't stub out internal methods.
  xit('initializes the Clipboard widget', function() {
    var component = testUtils.renderIntoDocument(
      <CopyToClipboard/>);
    var node = ReactDOM.findDOMNode(component).querySelector('button');
    assert.deepEqual(Clipboard.getCall(0).args[0], node,
      'Clipboard was not initialized with expected node');
  });
});
