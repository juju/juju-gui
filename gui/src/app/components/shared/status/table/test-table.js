/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const StatusTable = require('./table');

describe('StatusTable', () => {
  let headers, rows;

  const renderComponent = (options = {}) => enzyme.shallow(
    <StatusTable
      headers={options.headers || headers}
      rows={options.rows || rows}
      statusFilter={options.statusFilter} />
  );

  beforeEach(() => {
    headers = [{
      columnSize: 2,
      content: 'Application'
    }];
    rows = [{
      columns: [{
        columnSize: 2,
        content: 'apache2'
      }],
      key: 'apache2'
    }];
  });

  it('renders', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });
});
