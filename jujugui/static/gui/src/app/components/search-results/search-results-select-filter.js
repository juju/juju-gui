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

YUI.add('search-results-select-filter', function(Y) {

  juju.components.SearchResultsSelectFilter = React.createClass({

    propTypes: {
      changeState: React.PropTypes.func.isRequired,
      currentValue: React.PropTypes.string.isRequired,
      filter: React.PropTypes.string.isRequired,
      items: React.PropTypes.array.isRequired,
      label: React.PropTypes.string.isRequired
    },

    /**
      Generate a list of items.

      @method _generateItems
      @returns {Object} The components.
    */
    _generateItems: function() {
      var components = [];
      this.props.items.forEach(function(item) {
        components.push(
          <option value={item.value}
            key={item.value}>
            {item.label}
          </option>);
      }, this);
      return components;
    },

    /**
      Change the state when the value changes.

      @method _handleChange
      @param {Object} e The change event.
    */
    _handleChange: function(e) {
      var metadata = {
        activeComponent: 'search-results',
      };
      metadata[this.props.filter] = e.currentTarget.value;
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: metadata
        }
      });
    },

    render: function() {
      var className = 'list-block__' + this.props.filter;
      return (
        <div className={className}>
          {this.props.label}:
          <select onChange={this._handleChange}
            defaultValue={this.props.currentValue}>
            {this._generateItems()}
          </select>
        </div>
      );
    }
  });

}, '0.1.0', {requires: []});
