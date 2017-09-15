/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

class SearchResultsSelectFilter extends React.Component {
  /**
    Generate a list of items.

    @method _generateItems
    @returns {Object} The components.
  */
  _generateItems() {
    var components = [];
    this.props.items.forEach(function(item) {
      components.push(
        <option value={item.value}
          key={item.value}>
          {item.label}
        </option>);
    }, this);
    return components;
  }

  /**
    Change the state when the value changes.

    @method _handleChange
    @param {Object} e The change event.
  */
  _handleChange(e) {
    const search = {};
    search[this.props.filter] = e.currentTarget.value;
    this.props.changeState({
      search: search
    });
  }

  render() {
    var className = 'list-block__' + this.props.filter;
    return (
      <div className={className}>
        {this.props.label}:
        <select onChange={this._handleChange.bind(this)}
          defaultValue={this.props.currentValue}>
          {this._generateItems()}
        </select>
      </div>
    );
  }
};

SearchResultsSelectFilter.propTypes = {
  changeState: PropTypes.func.isRequired,
  currentValue: PropTypes.string,
  filter: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  label: PropTypes.string.isRequired
};

module.exports = SearchResultsSelectFilter;
