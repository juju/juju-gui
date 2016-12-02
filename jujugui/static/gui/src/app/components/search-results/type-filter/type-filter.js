/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

YUI.add('search-results-type-filter', function(Y) {

  juju.components.SearchResultsTypeFilter = React.createClass({

    propTypes: {
      changeState: React.PropTypes.func.isRequired,
      currentType: React.PropTypes.string
    },

    /**
      Generate the base classes from the props.

      @method _generateClasses
      @param {Boolean} selected Whether the filter is selected.
      @returns {String} The collection of class names.
    */
    _generateClasses: function(selected) {
      return classNames(
        {selected: selected}
      );
    },

    /**
      Generate a list of filter items.

      @method _generateFilterItems
      @returns {Object} The components.
    */
    _generateFilterItems: function() {
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
    },

    /**
      Filter the search results by the provided type.

      @method _handleFilterClick
      @param {String} type The bound type.
    */
    _handleFilterClick: function(type) {
      this.props.changeState({
        search: {
          type: type
        }
      });
    },

    render: function() {
      return (
        <nav className="six-col list-block__type">
          <ul>
            {this._generateFilterItems()}
          </ul>
        </nav>
      );
    }
  });

}, '0.1.0', {requires: []});
