/* Copyright (C) 2019 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

require('./_series-list.scss');

class SeriesList extends React.Component {
  /**
    Generate the series items.
    @returns {Object} The list JSX.
  */
  _generateItems() {
    return this.props.items.map(series => {
      const isKubernetes = series === 'kubernetes';
      const className = classNames(
        'p-inline-list__item',
        'series-list__item',
        {'series-list__item--kubernetes': isKubernetes}
      );
      return (
        <li
          className={className}
          key={series}>
          {series}
        </li>);
    });
  }

  render() {
    return (
      <ul className="series-list p-inline-list u-no-margin--bottom">
        {this._generateItems()}
      </ul>
    );
  }
};

SeriesList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
};

module.exports = SeriesList;
