/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const BasicTable = require('./basic-table');
const ExpandingRow = require('../expanding-row/expanding-row');

describe('BasicTable', function() {
  let headers, rows;

  const renderComponent = (options = {}) => enzyme.shallow(
    <BasicTable
      changeState={options.changeState || sinon.stub()}
      filterPredicate={options.filterPredicate || null}
      generatePath={options.generatePath || null}
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

  it('can render the table', function() {
    const wrapper = renderComponent();
    const expected = (
      <ul className="basic-table twelve-col">
        <li className="twelve-col  basic-table__header"
          key='basic-table-header'>
          <div className="three-col class1 class2"
            key="column-1">
            Column 1
          </div>
          <div className="last-col four-col"
            key="column-2">
            <span>Column 2</span>
          </div>
        </li>
        <li className="twelve-col   basic-table__row"
          key="row-one-key">
          <div className="three-col r1c1class1 r1c1class2"
            key="column-1">
            <span>row 1 column 1</span>
          </div>
          <div className="last-col three-col"
            key="column-2">
            row 1 column 2
          </div>
        </li>
        <li className="twelve-col   basic-table__row"
          key="row-two-key">
          <div className="last-col seven-col"
            key="column-1">
            row 2 column 1
          </div>
        </li>
        <li className="twelve-col   basic-table__row"
          key="row-three-key">
          <div className="three-col"
            key="column-1">
            row 3 column 1
          </div>
          <div className="three-col"
            key="column-1">
            <span>
              &nbsp;
            </span>
          </div>
          <div className="last-col six-col"
            key="column-1">
            0
          </div>
        </li>
      </ul>);
    assert.compareJSX(wrapper, expected);
  });

  it('can apply extra classes', function() {
    rows[1].classes = ['second-row-class'];
    const wrapper = renderComponent({
      headerClasses: ['header-class'],
      headerColumnClasses: ['header-column'],
      rowClasses: ['row-class'],
      rowColumnClasses: ['row-column'],
      rows: rows,
      tableClasses: ['table-class']
    });
    const expected = (
      <ul className="basic-table twelve-col table-class">
        <li className="twelve-col header-class  basic-table__header"
          key='basic-table-header'>
          <div className="three-col class1 class2 header-column"
            key="column-1">
            Column 1
          </div>
          <div className="last-col four-col header-column"
            key="column-2">
            <span>Column 2</span>
          </div>
        </li>
        <li className="twelve-col row-class  basic-table__row"
          key="row-one-key">
          <div className="three-col r1c1class1 r1c1class2 row-column"
            key="column-1">
            <span>row 1 column 1</span>
          </div>
          <div className="last-col three-col row-column"
            key="column-2">
            row 1 column 2
          </div>
        </li>
        <li className="twelve-col row-class second-row-class basic-table__row"
          key="row-two-key">
          <div className="last-col seven-col row-column"
            key="column-1">
            row 2 column 1
          </div>
        </li>
        <li className="twelve-col row-class  basic-table__row"
          key="row-three-key">
          <div className="three-col row-column"
            key="column-1">
            row 3 column 1
          </div>
          <div className="three-col row-column"
            key="column-1">
            <span>
              &nbsp;
            </span>
          </div>
          <div className="last-col six-col row-column"
            key="column-1">
            0
          </div>
        </li>
      </ul>);
    assert.compareJSX(wrapper, expected);
  });

  it('can sort the table', function() {
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
    const rowItems = wrapper.find('.basic-table__row');
    assert.equal(rowItems.at(0).key(), 'row-one-key');
    assert.equal(rowItems.at(1).key(), 'row-three-key');
    assert.equal(rowItems.at(2).key(), 'row-two-key');
  });

  it('can filter the table', function() {
    rows[0].extraData = 1;
    rows[1].extraData = 20;
    rows[2].extraData = 5;
    const wrapper = renderComponent({
      filterPredicate: row => row.extraData > 10,
      rows
    });
    const rowItems = wrapper.find('.basic-table__row');
    assert.equal(rowItems.length, 1);
    assert.equal(rowItems.at(0).key(), 'row-two-key');
  });

  it('displays row links', function() {
    rows[0].clickState = {another: 'state'};
    const generatePath = sinon.stub().returns('http://example.com');
    const wrapper = renderComponent({
      changeState: sinon.stub(),
      generatePath,
      rows
    });
    const rowItems = wrapper.find('.basic-table__row');
    const expected = (
      <li className="twelve-col   basic-table__row"
        key="row-one-key">
        <a className="basic-table__row-link"
          href="http://example.com"
          onClick={wrapper.find('.basic-table__row-link').prop('onClick')}></a>
        <div className="three-col r1c1class1 r1c1class2"
          key="column-1">
          <span>row 1 column 1</span>
        </div>
        <div className="last-col three-col"
          key="column-2">
          row 1 column 2
        </div>
      </li>);
    assert.compareJSX(rowItems.at(0), expected);
  });

  it('can navigate when a row is clicked', function() {
    rows[0].clickState = {another: 'state'};
    const changeState = sinon.stub();
    const preventDefault = sinon.stub();
    const generatePath = sinon.stub().returns('http://example.com');
    const wrapper = renderComponent({
      changeState,
      generatePath,
      rows
    });
    wrapper.find('.basic-table__row-link').simulate('click',
      {preventDefault: preventDefault});
    assert.equal(preventDefault.callCount, 1);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {another: 'state'});
  });

  it('can display rows with expandable content', function() {
    rows = [{
      classes: ['first-row-class'],
      columns: [{
        content: (<span>row 1 column 1</span>),
        columnSize: 3,
        classes: ['r1c1class1', 'r1c1class2']
      }, {
        content: 'row 1 column 2',
        columnSize: 3
      }],
      expandedContent: (<div>Expanded content!</div>),
      key: 'row-one-key'
    }];
    const wrapper = renderComponent({ rows });
    const expected = (
      <ul className="basic-table twelve-col">
        <li className="twelve-col  basic-table__header"
          key='basic-table-header'>
          <div className="three-col class1 class2"
            key="column-1">
            Column 1
          </div>
          <div className="last-col four-col"
            key="column-2">
            <span>Column 2</span>
          </div>
        </li>
        <ExpandingRow
          classes={{
            'basic-table__row': true,
            'basic-table__row--clickable': true,
            'basic-table__row--expandable': true,
            'first-row-class': true,
            'twelve-col': true
          }}
          clickable={true}
          expanded={undefined}
          key="row-one-key">
          <div>
            <div className="three-col r1c1class1 r1c1class2"
              key="column-1">
              <span>row 1 column 1</span>
            </div>
            <div className="last-col three-col"
              key="column-2">
              row 1 column 2
            </div>
          </div>
          <div>
            <div>Expanded content!</div>
          </div>
        </ExpandingRow>
      </ul>);
    assert.compareJSX(wrapper, expected);
  });

  it('can expand content using a prop', function() {
    rows = [{
      classes: ['first-row-class'],
      columns: [{
        content: (<span>row 1 column 1</span>),
        columnSize: 3,
        classes: ['r1c1class1', 'r1c1class2']
      }, {
        content: 'row 1 column 2',
        columnSize: 3
      }],
      expandedContent: (<div>Expanded content!</div>),
      expandedContentExpanded: true,
      key: 'row-one-key'
    }];
    const wrapper = renderComponent({ rows });
    assert.equal(wrapper.find('ExpandingRow').prop('expanded'), true);
  });

  it('can make a row not clickable', function() {
    rows = [{
      classes: ['first-row-class'],
      columns: [{
        content: (<span>row 1 column 1</span>),
        columnSize: 3,
        classes: ['r1c1class1', 'r1c1class2']
      }, {
        content: 'row 1 column 2',
        columnSize: 3
      }],
      expandedContent: (<div>Expanded content!</div>),
      key: 'row-one-key',
      rowClickable: false
    }];
    const wrapper = renderComponent({ rows });
    assert.equal(wrapper.find('ExpandingRow').prop('clickable'), false);
  });
});
