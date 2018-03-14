/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const Clipboard = require('clipboard');
const React = require('react');
const ReactDOM = require('react-dom');
const enzyme = require('enzyme');

const CopyToClipboard = require('./copy-to-clipboard');
const SvgIcon = require('../svg-icon/svg-icon');

const testUtils = require('react-dom/test-utils');

describe('CopyToClipboard', function() {

  const renderComponent = (options = {}) => {
    return enzyme.shallow(
      <CopyToClipboard
        className={options.className}
        value={options.value} />,
      // Don't call componentDidMount as it requires nodes that don't exist in
      // the shallow renderer.
      { disableLifecycleMethods: true });
  };

  it('renders with a default value', function() {
    const wrapper = renderComponent();
    var expected = (
      <div className="copy-to-clipboard">
        <input className="copy-to-clipboard__input"
          readOnly="true"
          ref="input"
          type="text"
          value="" />
        <button className="copy-to-clipboard__btn"
          ref="btn">
          <SvgIcon
            name="copy-to-clipboard-16"
            size="16" />
        </button>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('can render with a provided className', function() {
    const wrapper = renderComponent({ className: 'class-name' });
    assert.equal(wrapper.prop('className'), 'class-name');
    assert.equal(wrapper.find('input').prop('className'), 'class-name__input');
    assert.equal(wrapper.find('button').prop('className'), 'class-name__btn');
  });

  it('renders a user-provided value properly', function() {
    var value = 'foobar';
    const wrapper = renderComponent({ value });
    assert.equal(wrapper.find('input').prop('value'), value,
      'Value is not set properly for input');
  });

  // XXX: can't stub out internal methods.
  xit('initializes the Clipboard widget', function() {
    var component = testUtils.renderIntoDocument(
      <CopyToClipboard />);
    var node = ReactDOM.findDOMNode(component).querySelector('button');
    assert.deepEqual(Clipboard.getCall(0).args[0], node,
      'Clipboard was not initialized with expected node');
  });
});
