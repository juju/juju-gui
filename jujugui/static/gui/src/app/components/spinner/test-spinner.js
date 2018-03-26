/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Spinner = require('./spinner');

describe('Spinner', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <Spinner />
  );

  it('renders the spinner', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="spinner-container">
        <div className="spinner-loading">
          Loading...
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });
});
