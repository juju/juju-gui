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
      conditionalClasses[this.columnClasses[parseInt(column.size) - 1]] = true;
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
  // The columns array should contain objects in the following format:
  // [{
  //  title: 'Column title',
  //  size: 3, // The width of the column (between 1 and 12).
  //  classes: ['class1', 'class2', ...]
  // }, ...]
  columns: PropTypes.array.isRequired,
  // The rows property should contain an array of arrays containing the
  // column content. e.g.
  // [
  //  ['row 1 column 1', 'row 1 column 2', ...],
  //  ['row 2 column 1', 'row 2 column 2', ...],
  //  ...
  // ]
  rows: PropTypes.array.isRequired
};

YUI.add('basic-table', function() {
  juju.components.BasicTable = BasicTable;
}, '', {
  requires: [
  ]
});
