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

    /**
      Filter the search results by the provided type.

      @method _handleFilterClick
      @param {Sring} type The bound type.
    */
    _handleFilterClick: function(type) {
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            type: type
          }
        }
      });
    },

    render: function() {
      var currentType = this.props.currentType;
      return (
        <nav className="six-col list-block__type">
          <ul>
            <juju.components.SearchResultsTypeFilterItem
              key="all"
              label="All"
              selected={!currentType}
              action={this._handleFilterClick.bind(this, null)} />
            <juju.components.SearchResultsTypeFilterItem
              key="charms"
              label="Charms"
              selected={currentType === 'charm'}
              action={this._handleFilterClick.bind(this, 'charm')} />
            <juju.components.SearchResultsTypeFilterItem
              key="bundles"
              label="Bundles"
              selected={currentType === 'bundle'}
              action={this._handleFilterClick.bind(this, 'bundle')} />
          </ul>
        </nav>
      );
    }
  });

}, '0.1.0', {requires: [
  'search-results-type-filter-item'
]});
