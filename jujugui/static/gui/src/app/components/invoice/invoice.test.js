/* Copyright (C) 2018 Canonical Ltd. */

'use strict';
const React = require('react');
const Invoice = require('./invoice');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Invoice', function() {

  function renderComponent(options={}) {
    return jsTestUtils.shallowRender(
      <Invoice />, true);
  }

  it('can render', () => {
    renderComponent();
  });
});
