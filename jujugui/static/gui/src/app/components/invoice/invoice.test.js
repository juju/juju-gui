/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Invoice = require('./revenue-statement');

describe('Invoice', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <Invoice />
  );

  it('can render', () => {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.revenue-statement__inner').length,
      1, 
      'Revenue statement inner wrapper');
  });
});
