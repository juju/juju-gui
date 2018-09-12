/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const StatusLabel = require('./label');

describe('StatusTable', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <StatusLabel
      status={options.status || 'pending'} />
  );

  it('renders', () => {
    const wrapper = renderComponent({ status: 'available' });
    expect(wrapper).toMatchSnapshot();
  });

  it('renders with a known status', () => {
    const wrapper = renderComponent({ status: 'ok' });
    assert.strictEqual(wrapper.prop('className').includes('status-label--ok'), true);
  });
});
