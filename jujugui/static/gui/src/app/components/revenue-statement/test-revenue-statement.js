/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const RevenueStatement = require('./revenue-statement');

describe('Revenue statement', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <RevenueStatement />
  );

  it('can render', () => {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.revenue-statement__inner').length,
      1,
      'Revenue statement inner wrapper');
  });
});
