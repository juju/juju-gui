/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

class SearchResultsTypeFilter extends React.Component {
  /**
    Generate the base classes from the props.

    @method _generateClasses
    @param {Boolean} selected Whether the filter is selected.
    @returns {String} The collection of class names.
  */
  _generateClasses(selected) {
    return classNames(
      {selected: selected}
    );
  }

  /**
    Generate a list of filter items.

    @method _generateFilterItems
    @returns {Object} The components.
  */
  _generateFilterItems() {
    var components = [];
    var currentType = this.props.currentType;
    var items = [{
      label: 'All',
      selected: !currentType,
      action: null
    }, {
      label: 'Charms',
      selected: currentType === 'charm',
      action: 'charm'
    }, {
      label: 'Bundles',
      selected: currentType === 'bundle',
      action: 'bundle'
    }];
    items.forEach(function(item) {
      components.push(
        <li className={this._generateClasses(item.selected)}
          onClick={this._handleFilterClick.bind(this, item.action)}
          key={item.label}
          tabIndex="0" role="button">
          {item.label}
        </li>);
    }, this);
    return components;
  }

  /**
    Filter the search results by the provided type.

    @method _handleFilterClick
    @param {String} type The bound type.
  */
  _handleFilterClick(type) {
    this.props.changeState({
      search: {
        type: type
      }
    });
  }

  render() {
    return (
      <nav className="six-col list-block__type">
        <ul>
          {this._generateFilterItems()}
        </ul>
      </nav>
    );
  }
};

SearchResultsTypeFilter.propTypes = {
  changeState: PropTypes.func.isRequired,
  currentType: PropTypes.string
};

module.exports = SearchResultsTypeFilter;
