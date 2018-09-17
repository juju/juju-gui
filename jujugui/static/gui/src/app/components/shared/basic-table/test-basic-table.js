/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const BasicTable = require('./basic-table');

describe('BasicTable', () => {
  let headers, rows;

  const renderComponent = (options = {}) => enzyme.shallow(
    <BasicTable
      filterPredicate={options.filterPredicate || null}
      headerClasses={options.headerClasses || null}
      headerColumnClasses={options.headerColumnClasses || null}
      headers={options.headers || headers}
      rowClasses={options.rowClasses || null}
      rowColumnClasses={options.rowColumnClasses || null}
      rows={options.rows || rows}
      sort={options.sort || null}
      tableClasses={options.tableClasses || null} />
  );

  beforeEach(() => {
    headers = [{
      content: 'Column 1',
      columnSize: 3,
      classes: ['class1', 'class2']
    }, {
      content: (<span>Column 2</span>),
      columnSize: 4
    }];
    rows = [{
      columns: [{
        content: (<span>row 1 column 1</span>),
        columnSize: 3,
        classes: ['r1c1class1', 'r1c1class2']
      }, {
        content: 'row 1 column 2',
        columnSize: 3
      }],
      key: 'row-one-key'
    }, {
      columns: [{
        content: 'row 2 column 1',
        columnSize: 7
      }],
      key: 'row-two-key'
    }, {
      columns: [{
        content: 'row 3 column 1',
        columnSize: 3
      }, {
        columnSize: 3
      }, {
        content: 0,
        columnSize: 6
      }],
      key: 'row-three-key'
    }];
  });

  it('can render the table', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can apply extra classes', () => {
    rows[1].classes = ['second-row-class'];
    const wrapper = renderComponent({
      headerClasses: ['header-class'],
      headerColumnClasses: ['header-column'],
      rowClasses: ['row-class'],
      rowColumnClasses: ['row-column'],
      tableClasses: ['table-class']
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('can sort the table', () => {
    const sort = (a, b) => {
      if (a.key < b.key) {
        return -1;
      }
      if (a.key > b.key) {
        return 1;
      }
      return 0;
    };
    const wrapper = renderComponent({ sort });
    const rowItems = wrapper.find('BasicTableRow');
    assert.equal(rowItems.at(0).key(), 'basic-table-header');
    assert.equal(rowItems.at(1).key(), 'row-one-key');
    assert.equal(rowItems.at(2).key(), 'row-three-key');
    assert.equal(rowItems.at(3).key(), 'row-two-key');
  });

  it('can filter the table', () => {
    rows[0].extraData = 1;
    rows[1].extraData = 20;
    rows[2].extraData = 5;
    const wrapper = renderComponent({
      filterPredicate: row => row.extraData > 10
    });
    const rowItems = wrapper.find('BasicTableRow');
    assert.equal(rowItems.length, 2);
    assert.equal(rowItems.at(0).key(), 'basic-table-header');
    assert.equal(rowItems.at(1).key(), 'row-two-key');
  });
});
