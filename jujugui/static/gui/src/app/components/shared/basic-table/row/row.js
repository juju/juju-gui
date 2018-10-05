/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const BasicTableCell = require('../cell/cell');

/** Basic table React component used to display data in a table structure. */
class BasicTableRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false
    };
  }

  componentDidMount() {
    const {expandedContentExpanded} = this.props;
    if (expandedContentExpanded !== undefined) {
      this.setState({expanded: expandedContentExpanded});
    }
  }

  componentDidUpdate(prevProps) {
    const {expandedContentExpanded} = this.props;
    if (expandedContentExpanded !== undefined &&
      expandedContentExpanded !== this.state.expanded) {
      this.setState({expanded: expandedContentExpanded});
    }
  }

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
    Toggle the expanded state.
  */
  _toggleExpanded() {
    this.setState({expanded: !this.state.expanded});
  }

  /**
    Generate a row anchor.
    @returns {Object} The anchor element or null.
  */
  _generateAnchor() {
    if (this.props.expandedContent) {
      return;
    }
    const {onClick, clickURL} = this.props;
    if (!onClick && !clickURL) {
      return null;
    }
    return (
      <a
        className="basic-table__row-link"
        href={clickURL}
        onClick={onClick && this._handleRowClick.bind(this, onClick)} />
    );
  }

  /**
    Generate a table cell.
    @param column {Objec} A column as described in the columns prop type.
    @param index {Integer} The column position.
    @returns {Object} The anchor element or null.
  */
  _generateCell(column, index) {
    const {isHeader} = this.props;
    const conditionalClasses = isHeader
      ? this.props.headerColumnClasses
      : this.props.rowColumnClasses;
    const classes = (column.classes || []).concat(conditionalClasses);
    return (
      <BasicTableCell
        classes={classes}
        columnSize={column.columnSize}
        content={column.content}
        isHeader={isHeader}
        key={index} />
    );
  }

  /**
    Genrate the row content;
    @returns {Object} The columns or expanded content.
  */
  _generateContent() {
    const {expandedContent} = this.props;
    if (this.state.expanded && expandedContent) {
      return expandedContent;
    }
    return this.props.columns.map((column, i) => this._generateCell(column, i));
  }

  /**
    Figure out if the row can be clicked upon.
    @returns {Boolean} Whether the column can back clicked on.
  */
  _isRowClickable() {
    const {rowClickable} = this.props;
    return rowClickable !== undefined ? rowClickable : !!this.props.expandedContent;
  }

  render() {
    const {expandedContent, isHeader} = this.props;
    const classes = classNames(this.props.classes, {
      'basic-table__header': isHeader,
      'basic-table__row': !isHeader,
      'basic-table__row--expandable': !!expandedContent,
      'basic-table__row--clickable': this._isRowClickable(),
      'is-expanded': this.state.expanded
    });
    const onClick = this._isRowClickable() ? this._toggleExpanded.bind(this) : null;
    return (
      <tr
className={classes}
        onClick={onClick}
        role="button"
        tabIndex="0">
        {this._generateAnchor()}
        {this._generateContent()}
      </tr>
    );
  }
}

BasicTableRow.defaultProps = {
  classes: []
};

BasicTableRow.propTypes = {
  // The extra classes to apply to an individual row.
  classes: PropTypes.array,
  // A function to call when a row is clicked.
  clickURL: PropTypes.string,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      content: PropTypes.node,
      // The number of columns (between 1 and 12).
      columnSize: PropTypes.number,
      // The extra classes to apply to the column.
      classes: PropTypes.arrayOf(PropTypes.string)
    }).isRequired
  ).isRequired,
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
