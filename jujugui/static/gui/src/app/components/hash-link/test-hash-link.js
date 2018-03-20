/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const HashLink = require('./hash-link');
const SvgIcon = require('../svg-icon/svg-icon');

describe('HashLink', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <HashLink
      changeState={options.changeState || sinon.stub()}
      hash={options.hash || 'readme'} />
  );

  it('can render', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="hash-link"
        onClick={wrapper.prop('onClick')}>
        <SvgIcon
          name="anchor_16"
          size="16" />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can change the hash state', () => {
    const changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper.props().onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      hash: 'readme'
    });
  });
});
