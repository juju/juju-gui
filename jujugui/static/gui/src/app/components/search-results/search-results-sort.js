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

YUI.add('search-results-sort', function(Y) {

  juju.components.SearchResultsSort = React.createClass({

    /**
      Generate a list of sort items.

      @method _generateSortItems
      @returns {Object} The components.
    */
    _generateSortItems: function() {
      var components = [];
      var items = [{
        label: 'Default',
        value: ''
      }, {
        label: 'Most popular',
        value: '-downloads'
      }, {
        label: 'Least popular',
        value: 'downloads'
      }, {
        label: 'Name (a-z)',
        value: 'name'
      }, {
        label: 'Name (z-a)',
        value: '-name'
      }, {
        label: 'Author (a-z)',
        value: 'owner'
      }, {
        label: 'Author (z-a)',
        value: '-owner'
      }];
      items.forEach(function(item) {
        components.push(
          <option value={item.value}
            key={item.value}>
            {item.label}
          </option>);
      }, this);
      return components;
    },

    /**
      Change the state when the sort changes.

      @method _handleSortChange
      @param {Object} e The change event.
    */
    _handleSortChange: function(e) {
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            sort: e.currentTarget.value
          }
        }
      });
    },

    render: function() {
      return (
        <div className="list-block__sort">
          Sort by:
          <select onChange={this._handleSortChange}
            defaultValue={this.props.currentSort}>
            {this._generateSortItems()}
          </select>
        </div>
      );
    }
  });

}, '0.1.0', {requires: []});
