/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

/** Basic table React component used to display data in a table structure. */
class BasicTableCell extends React.Component {
  render() {
    const className = classNames('basic-table__cell', this.props.classes);
    const isHeader = this.props.isHeader;
    let content = this.props.content;
    // if there is no content then add a space so that the column doesn't
    // collapse.
    if (
      (typeof content === 'string' && content.replace(/\s/g, '') === '') ||
      content === undefined ||
      content === null
    ) {
      content = <span>&nbsp;</span>;
    }
    if (isHeader) {
      return <th className={className}>{content}</th>;
    } else {
      return (
        <td className={className}>
          {this.props.link}
          {content}
        </td>
      );
    }
  }
}

BasicTableCell.propTypes = {
  classes: PropTypes.arrayOf(PropTypes.string),
  content: PropTypes.node,
  isHeader: PropTypes.bool,
  link: PropTypes.node
};

module.exports = BasicTableCell;
