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
    @param row {Object} The row contents, key etc.
    @returns {Object} The row to render.
  */
  _generateRow(isHeader, row) {
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
      const classes = classNames(conditionalClasses);
      return (
        <div className={classes}
          key={i}>
          {column.content}
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
        key={isHeader ? 'basic-table-header' : row.key}>
        {columns}
      </li>);
  }

  /**
    Generate the row content.
    @returns {Object} The rows to render.
  */
  _generateContent() {
    let rows = this.props.rows;
    if (this.props.sort) {
      rows.sort(this.props.sort);
    }
    return rows.map(row => {
      return this._generateRow(false, row);
    });
  }

  render() {
    return (
      <ul className="basic-table twelve-col">
        {this._generateRow(true, this.props.headers)}
        {this._generateContent()}
      </ul>
    );
  }
};

BasicTable.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.shape({
    content: PropTypes.node.isRequired,
    // The number of columns (between 1 and 12).
    columnSize: PropTypes.number.isRequired,
    // The extra classes to apply to the column.
    classes: PropTypes.arrayOf(PropTypes.string)
  }).isRequired).isRequired,
  rows: PropTypes.arrayOf(PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.shape({
      content: PropTypes.node,
      // The number of columns (between 1 and 12).
      columnSize: PropTypes.number.isRequired,
      // The extra classes to apply to the column.
      classes: PropTypes.arrayOf(PropTypes.string)
    }).isRequired).isRequired,
    // The row key, used for React indexing and sorting.
    key: PropTypes.string.isRequired
  }).isRequired).isRequired,
  // A method to sort the rows by. The row object is provided to the sort
  // method.
  sort: PropTypes.func
};

YUI.add('basic-table', function() {
  juju.components.BasicTable = BasicTable;
}, '', {
  requires: [
  ]
});
