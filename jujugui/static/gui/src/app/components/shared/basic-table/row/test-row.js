/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const BasicTableRow = require('./row');

describe('BasicTableRow', () => {
  let columns;

  const renderComponent = (options = {}) =>
    enzyme.shallow(
      <BasicTableRow
        classes={options.classes}
        clickURL={options.clickURL}
        columns={options.columns || columns}
        expandedContent={options.expandedContent}
        expandedContentExpanded={options.expandedContentExpanded}
        extraData={options.extraData}
        headerColumnClasses={options.headerColumnClasses}
        isHeader={options.isHeader}
        onClick={options.onClick}
        rowClickable={options.rowClickable}
        rowColumnClasses={options.rowColumnClasses}
        rowKey={options.rowKey || 'row-one-key'}
      />
    );

  beforeEach(() => {
    columns = [
      {
        content: <span>row 1 column 1</span>,
        columnSize: 3,
        classes: ['r1c1class1', 'r1c1class2']
      },
      {
        content: 'row 1 column 2',
        columnSize: 3
      }
    ];
  });

  it('can render', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can apply extra classes', () => {
    const wrapper = renderComponent({
      classes: ['row-class']
    });
    assert.equal(wrapper.prop('className').includes('row-class'), true);
  });

  it('can pass extra classes to cells', () => {
    const wrapper = renderComponent({
      rowColumnClasses: ['extra-cell-class']
    });
    assert.deepEqual(
      wrapper
        .find('BasicTableCell')
        .at(0)
        .prop('classes'),
      ['r1c1class1', 'r1c1class2', 'extra-cell-class']
    );
  });

  it('can pass extra classes to header cells', () => {
    const wrapper = renderComponent({
      headerColumnClasses: ['extra-header-class'],
      isHeader: true
    });
    assert.deepEqual(
      wrapper
        .find('BasicTableCell')
        .at(0)
        .prop('classes'),
      ['r1c1class1', 'r1c1class2', 'extra-header-class']
    );
  });

  it('can display rows with expandable content', () => {
    const wrapper = renderComponent({
      expandedContent: <div>Expanded content!</div>,
      expandedContentExpanded: true
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('can make a row not clickable', () => {
    const wrapper = renderComponent({
      expandedContent: <div>Expanded content!</div>,
      rowClickable: false
    });
    assert.equal(wrapper.prop('onClick'), null);
  });
});
