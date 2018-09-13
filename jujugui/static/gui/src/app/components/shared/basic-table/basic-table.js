/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const ExpandingRow = require('../expanding-row/expanding-row');

/** Basic table React component used to display data in a table structure. */
class BasicTable extends React.Component {
  constructor() {
    super();
    this.columnClasses = [
      'one-col',
      'two-col',
      'three-col',
      'four-col',
      'five-col',
      'six-col',
      'seven-col',
      'eight-col',
      'nine-col',
      'ten-col',
      'eleven-col',
      'twelve-col'
    ];
  }

  /**
    Show the entity details when clicked.

    @method _handleRowClick
    @param state {String} The new state to update to.
    @param evt {Object} The click event.
  */
  _handleRowClick(state, evt) {
    evt.preventDefault();
    this.props.changeState(state);
  }

  /**
    Generate a row anchor.
    @param clickState {Function} The method to call when the row is clicked.
    @returns {Object} The anchor element or null.
  */
  _generateAnchor(clickState) {
    if (!clickState) {
      return null;
    }
    return (
      <a className="basic-table__row-link"
        href={this.props.generatePath(clickState)}
        onClick={this._handleRowClick.bind(this, clickState)}></a>);
  }

  /**
    Generate a row.
    @param isHeader {Boolean} Whether this is a header row.
    @param row {Object} The row contents, key etc.
    @param index {Int} The positional index.
    @param rowCount {Int} The number of rows.
    @returns {Object} The row to render.
  */
  _generateRow(isHeader, row, index = 0, rowCount = 1) {
    let columnList;
    if (isHeader) {
      columnList = row;
    } else {
      columnList = row.columns;
    }
    const columnsNumber = columnList.length;
    const columns = columnList.map((column, i) => {
      let conditionalClasses = {'last-col': i + 1 === columnsNumber};
      // Map the column size to the appropriate CSS class.
      conditionalClasses[this.columnClasses[column.columnSize - 1]] = true;
      if (column.classes) {
        column.classes.forEach(className => {
          conditionalClasses[className] = true;
        });
      }
      const classes = classNames(
        conditionalClasses,
        isHeader ? this.props.headerColumnClasses :
          this.props.rowColumnClasses);
      let content = column.content;
      // if there is no content then add a space so that the column doesn't
      // collapse.
      if ((typeof(content) === 'string' && content.replace(/\s/g, '') === '') ||
        content === undefined || content === null) {
        content = (<span>&nbsp;</span>);
      }
      return (
        <div className={classes}
          key={i}>
          {content}
        </div>);
    });
    const defaultRowClasses = this.props.rowClasses || [];
    const rowClasses = row.classes || [];
    if (row.expandedContent) {
      const rowClickable = (
        row.rowClickable !== undefined ? row.rowClickable : !!row.expandedContent);
      let classes = {
        'basic-table__row': true,
        'basic-table__row--expandable': true,
        'basic-table__row--clickable': rowClickable,
        'first-row-class': true,
        'twelve-col': true
      };
      defaultRowClasses.concat(rowClasses).forEach(className => {
        classes[className] = true;
      });
      return (
        <ExpandingRow
          classes={classes}
          clickable={rowClickable}
          expanded={row.expandedContentExpanded}
          key={row.key}>
          <div>
            {columns}
          </div>
          <div>
            {row.expandedContent}
          </div>
        </ExpandingRow>);
    } else {
      const classes = classNames(
        'twelve-col',
        isHeader ? this.props.headerClasses : defaultRowClasses,
        rowClasses,
        {
          'basic-table__header': isHeader,
          'basic-table__row': !isHeader
        });
      return (
        <li className={classes}
          key={isHeader ? 'basic-table-header' : row.key}>
          {this._generateAnchor(row.clickState)}
          {columns}
        </li>);
    }
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
      'twelve-col',
      this.props.tableClasses);
    return (
      <ul className={classes}>
        {this._generateRow(true, this.props.headers)}
        {this._generateContent()}
      </ul>
    );
  }
};

BasicTable.propTypes = {
  changeState: PropTypes.func,
  // The filterPredicate function receives a row and must return a boolean.
  filterPredicate: PropTypes.func,
  generatePath: PropTypes.func,
  // The extra classes to apply to all header rows.
  headerClasses: PropTypes.array,
  // The extra classes to apply to all header columns.
  headerColumnClasses: PropTypes.array,
  headers: PropTypes.arrayOf(PropTypes.shape({
    content: PropTypes.node,
    // The number of columns (between 1 and 12).
    columnSize: PropTypes.number.isRequired,
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
    // The new state to update to when a row is clicked.
    clickState: PropTypes.object,
    columns: PropTypes.arrayOf(PropTypes.shape({
      content: PropTypes.node,
      // The number of columns (between 1 and 12).
      columnSize: PropTypes.number.isRequired,
      // The extra classes to apply to the column.
      classes: PropTypes.arrayOf(PropTypes.string)
    }).isRequired).isRequired,
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
