/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const SvgIcon = require('./svg-icon');

describe('SvgIcon', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <SvgIcon
      className={options.className}
      height={options.height}
      name={options.name || 'icon-name'}
      size={options.size}
      width={options.width} />
  );

  it('can render an icon', function() {
    const wrapper = renderComponent({size: 24});
    expect(wrapper).toMatchSnapshot();
  });

  it('can set a width and height', function() {
    const wrapper = renderComponent({
      height: 44,
      width: 24
    });
    assert.deepEqual(wrapper.prop('style'), {width: '24px', height: '44px'});
    assert.equal(wrapper.prop('viewBox'), '0 0 24 44');
  });

  it('can set a default width and height', function() {
    const wrapper = renderComponent();
    assert.deepEqual(wrapper.prop('style'), {width: '16px', height: '16px'});
    assert.equal(wrapper.prop('viewBox'), '0 0 16 16');
  });

  it('can set a class', function() {
    const wrapper = renderComponent({className: 'extra-class'});
    assert.equal(wrapper.prop('className').includes('extra-class'), true);
  });
});
