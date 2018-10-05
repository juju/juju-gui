/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const BasicTableRow = require('./row/row');

/** Basic table React component used to display data in a table structure. */
class BasicTable extends React.Component {
  /**
    Generate a row.
    @param isHeader {Boolean} Whether this is a header row.
    @param row {Object} The row contents, key etc.
    @param index {Int} The positional index.
    @param rowCount {Int} The number of rows.
    @returns {Object} The row to render.
  */
  _generateRow(isHeader, row, index = 0, rowCount = 1) {
    const key = isHeader ? 'basic-table-header' : row.key;
    let classes = (row.classes || []).concat(this.props.rowClasses);
    return (
      <BasicTableRow
        classes={classes}
        clickURL={row.clickURL}
        columns={row.columns}
        expandedContent={row.expandedContent}
        expandedContentExpanded={row.expandedContentExpanded}
        extraData={row.extraData}
        headerColumnClasses={this.props.headerColumnClasses}
        isHeader={isHeader}
        key={key}
        onClick={row.onClick}
        rowClickable={row.rowClickable}
        rowColumnClasses={this.props.rowColumnClasses}
        rowKey={key} />);
  }

  /**
    Generate the row content.
    @returns {Object} The rows to render.
  */
  _generateContent() {
    let rows = this.props.rows;
    if (this.props.filterPredicate) {
      rows = rows.filter(this.props.filterPredicate);
    }
    if (this.props.sort) {
      rows.sort(this.props.sort);
    }
    return rows.map((row, i) => this._generateRow(false, row, i, rows.length));
  }

  render() {
    const classes = classNames(
      'basic-table',
      this.props.tableClasses);
    return (
      <table
        className={classes}
        role="grid">
        <thead>
          {this._generateRow(true, {columns: this.props.headers})}
        </thead>
        <tbody>
          {this._generateContent()}
        </tbody>
      </table>
    );
  }
};

BasicTable.defaultProps = {
  headerClasses: [],
  rowClasses: []
};

BasicTable.propTypes = {
  // The filterPredicate function receives a row and must return a boolean.
  filterPredicate: PropTypes.func,
  // The extra classes to apply to all header rows.
  headerClasses: PropTypes.array,
  // The extra classes to apply to all header columns.
  headerColumnClasses: PropTypes.array,
  headers: PropTypes.arrayOf(PropTypes.shape({
    content: PropTypes.node,
    // The number of columns (between 1 and 12).
    columnSize: PropTypes.number,
    // The extra classes to apply to the column.
    classes: PropTypes.arrayOf(PropTypes.string)
  }).isRequired).isRequired,
  // The extra classes to apply to all non-header rows.
  rowClasses: PropTypes.array,
  // The extra classes to apply to all non-header columns.
  rowColumnClasses: PropTypes.array,
  rows: PropTypes.arrayOf(PropTypes.shape({
    // The extra classes to apply to an individual row.
    classes: PropTypes.array,
    // A function to call when a row is clicked.
    onClick: PropTypes.func,
    // A URL to navigate to when a row is clicked.
    clickURL: PropTypes.string,
    columns: PropTypes.arrayOf(PropTypes.shape({
      content: PropTypes.node,
      // The number of columns (between 1 and 12).
      columnSize: PropTypes.number,
      // The extra classes to apply to the column.
      classes: PropTypes.arrayOf(PropTypes.string)
    }).isRequired),
    // Content to be displayed when the row is toggled.
    expandedContent: PropTypes.any,
    // Set the expanded content state from outside the table.
    expandedContentExpanded: PropTypes.bool,
    // Extra data that can be used when ordering, sorting etc.
    extraData: PropTypes.any,
    // The row key, used for React indexing and sorting.
    key: PropTypes.string.isRequired,
    // Whether the row can be toggled by clicking on it. If this is not set the
    // value will be controlled by whether there is expandable content.
    rowClickable: PropTypes.bool
  }).isRequired).isRequired,
  // A method to sort the rows by. The row object is provided to the sort
  // method.
  sort: PropTypes.func,
  // The extra classes to apply to the main table node.
  tableClasses: PropTypes.array
};

module.exports = BasicTable;
