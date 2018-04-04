/* Copyright (C) 2018 Canonical Ltd. */

'use strict';
const React = require('react');
const shapeup = require('shapeup');
const RevenueStatement = require('./revenue-statement');
const jsTestUtils = require('../../utils/component-test-utils');

describe('Revenue Statement', function() {
  function renderComponent(options = {}) {
    return jsTestUtils.shallowRender(<RevenueStatement />, true);
  }

  fit('can render', () => {
    renderComponent();
  });
});
