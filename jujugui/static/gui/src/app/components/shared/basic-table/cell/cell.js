/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');


const COLUMN_CLASSES = [
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

/** Basic table React component used to display data in a table structure. */
class BasicTableCell extends React.Component {
  render() {
    const { classes } = this.props;
    let conditionalClasses = {'last-col': this.props.isLastCol};
    // Map the column size to the appropriate CSS class.
    conditionalClasses[COLUMN_CLASSES[this.props.columnSize - 1]] = true;
    if (classes) {
      classes.forEach(className => {
        conditionalClasses[className] = true;
      });
    }
    const className = classNames(conditionalClasses);
    let content = this.props.content;
    // if there is no content then add a space so that the column doesn't
    // collapse.
    if ((typeof(content) === 'string' && content.replace(/\s/g, '') === '') ||
      content === undefined || content === null) {
      content = (<span>&nbsp;</span>);
    }
    return (
      <div className={className}>
        {content}
      </div>);
  }
};

BasicTableCell.propTypes = {
  classes: PropTypes.arrayOf(PropTypes.string),
  columnSize: PropTypes.number.isRequired,
  content: PropTypes.node,
  isLastCol: PropTypes.bool
};

module.exports = BasicTableCell;
