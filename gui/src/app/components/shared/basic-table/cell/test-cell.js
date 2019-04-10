/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const BasicTableCell = require('./cell');

describe('BasicTableCell', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <BasicTableCell
      classes={options.classes}
      columnSize={options.columnSize || 5}
      content={options.content}
      isLastCol={options.isLastCol} />
  );

  it('can render', () => {
    const wrapper = renderComponent({
      content: (<span>Content!</span>)
    });
    expect(wrapper).toMatchSnapshot();
  });
});
