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

YUI.add('search-results-type-filter-item', function(Y) {

  juju.components.SearchResultsTypeFilterItem = React.createClass({

    /**
      Generate the base classes from the props.

      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      return classNames(
        {selected: this.props.selected}
      );
    },

    render: function() {
      return (
        <li className={this._generateClasses()}
            onClick={this.props.action}
            tabIndex="0" role="button">
          {this.props.label}
        </li>
      );
    }
  });

}, '0.1.0', {requires: []});
