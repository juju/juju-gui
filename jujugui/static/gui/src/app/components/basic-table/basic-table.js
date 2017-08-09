/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

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
    Generate a row.
    @param isHeader {Boolean} Whether this is a header row.
    @param columnContents {Array} The list of column content. This can be
    strings or JSX etc.
    @param index {Int} The row index (used for unique keys).
    @returns {Object} The row to render.
  */
  _generateRow(isHeader, columnContents, index) {
    const columnsNumber = this.props.columns.length;
    const columns = this.props.columns.map((column, i) => {
      let conditionalClasses = {'last-col': i + 1 === columnsNumber};
      // Map the column size to the appropriate CSS class.
      conditionalClasses[this.columnClasses[column.size - 1]] = true;
      if (column.classes) {
        column.classes.forEach(className => {
          conditionalClasses[className] = true;
        });
      }
      const classes = classNames(conditionalClasses);
      let content;
      if (isHeader) {
        content = column.title;
      } else {
        content = columnContents[i] || '';
      }
      return (
        <div className={classes}
          key={i}>
          {content}
        </div>);
    });
    const classes = classNames(
      'twelve-col',
      {
        'basic-table__header': isHeader,
        'basic-table__row': !isHeader
      });
    return (
      <li className={classes}
        key={index || 0}>
        {columns}
      </li>);
  }

  /**
    Generate the row content.
    @returns {Object} The rows to render.
  */
  _generateContent() {
    return this.props.rows.map((row, i) => {
      return this._generateRow(false, row, i+1);
    });
  }

  render() {
    return (
      <ul className="basic-table twelve-col">
        {this._generateRow(true)}
        {this._generateContent()}
      </ul>
    );
  }
};

BasicTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    // The width of the column.
    size: PropTypes.number.isRequired,
    // The extra classes to apply to the column.
    classes: PropTypes.arrayOf(PropTypes.string)
  })).isRequired,
  rows: PropTypes.arrayOf(PropTypes.node).isRequired
};

YUI.add('basic-table', function() {
  juju.components.BasicTable = BasicTable;
}, '', {
  requires: [
  ]
});
