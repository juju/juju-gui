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

  it('can render when last col', () => {
    const wrapper = renderComponent({
      isLastCol: true
    });
    assert.equal(wrapper.prop('className').includes('last-col'), true);
  });
});
