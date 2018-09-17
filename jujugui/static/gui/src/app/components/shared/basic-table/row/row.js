/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const BasicTableCell = require('../cell/cell');
const ExpandingRow = require('../../expanding-row/expanding-row');

/** Basic table React component used to display data in a table structure. */
class BasicTableRow extends React.Component {

  /**
    Show the entity details when clicked.

    @method _handleRowClick
    @param onClick {Function} The function to call when a row is clicked.
    @param evt {Object} The click event.
  */
  _handleRowClick(onClick, evt) {
    evt.preventDefault();
    onClick && onClick();
  }

  /**
    Generate a row anchor.
    @param onClick {Function} The method to call when the row is clicked.
    @param clickURL {String} A URL to use for the anchor href.
    @returns {Object} The anchor element or null.
  */
  _generateAnchor(onClick, clickURL) {
    if (!onClick && !clickURL) {
      return null;
    }
    return (
      <a className="basic-table__row-link"
        href={clickURL}
        onClick={onClick && this._handleRowClick.bind(this, onClick)}></a>);
  }

  /**
    Generate a table cell.
    @param column {Objec} A column as described in the columns prop type.
    @param index {Integer} The column position.
    @returns {Object} The anchor element or null.
  */
  _generateCell(column, index) {
    const { isHeader } = this.props;
    const conditionalClasses = isHeader ? this.props.headerColumnClasses :
      this.props.rowColumnClasses;
    const classes = (column.classes || []).concat(conditionalClasses);
    return (
      <BasicTableCell
        classes={classes}
        columnSize={column.columnSize}
        content={column.content}
        isLastCol={index + 1 === this.props.columns.length}
        key={index} />);
  }

  render() {
    const { expandedContent, isHeader } = this.props;
    const columns = this.props.columns.map((column, i) => this._generateCell(column, i));
    if (expandedContent) {
      const rowClickable = (
        this.props.rowClickable !== undefined ? this.props.rowClickable : !!expandedContent);
      let classes = {
        'basic-table__row': true,
        'basic-table__row--expandable': true,
        'basic-table__row--clickable': rowClickable,
        'first-row-class': true,
        'twelve-col': true
      };
      this.props.classes.forEach(className => {
        classes[className] = true;
      });
      return (
        <ExpandingRow
          classes={classes}
          clickable={rowClickable}
          expanded={this.props.expandedContentExpanded}>
          <div>
            {columns}
          </div>
          <div>
            {expandedContent}
          </div>
        </ExpandingRow>);
    } else {
      const classes = classNames(
        'twelve-col',
        this.props.classes,
        {
          'basic-table__header': isHeader,
          'basic-table__row': !isHeader
        });
      return (
        <li className={classes}>
          {this._generateAnchor(this.props.onClick, this.props.clickURL)}
          {columns}
        </li>);
    }
  }
};

BasicTableRow.defaultProps = {
  classes: []
};

BasicTableRow.propTypes = {
  // The extra classes to apply to an individual row.
  classes: PropTypes.array,
  // A function to call when a row is clicked.
  clickURL: PropTypes.string,
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
  // The extra classes to apply to all header columns.
  headerColumnClasses: PropTypes.array,
  // Whether this is a header row.
  isHeader: PropTypes.bool,
  // A URL to navigate to when a row is clicked.
  onClick: PropTypes.func,
  // Whether the row can be toggled by clicking on it. If this is not set the
  // value will be controlled by whether there is expandable content.
  rowClickable: PropTypes.bool,
  // The extra classes to apply to all non-header columns.
  rowColumnClasses: PropTypes.array,
  // The row key, used for React indexing and sorting.
  rowKey: PropTypes.string.isRequired
};

module.exports = BasicTableRow;
