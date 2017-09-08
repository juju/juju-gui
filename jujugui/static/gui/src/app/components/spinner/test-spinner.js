/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Spinner = require('./spinner');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Spinner', function() {
  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('loading-spinner', function() { done(); });
  });

  it('renders the spinner', function() {
    var output = jsTestUtils.shallowRender(
      <Spinner/>);
    expect(output).toEqualJSX(
      <div className="spinner-container">
        <div className="spinner-loading">
          Loading...
        </div>
      </div>);
  });
});
