/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.
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

YUI.add('inspector-relations-item', function() {

  juju.components.InspectorRelationsItem = React.createClass({

    /**
      Handle navigating to a relation details when it is clicked.

      @method _handleRelationClick
    */
    _handleRelationClick: function() {
      // Cast to string to pass state null check
      var index = this.props.index + '';
      this.props.changeState({
        sectionA: {
          component: 'inspector',
          metadata: {
            activeComponent: 'relation',
            unit: index
          }
        }
      });
    },

    render: function() {
      var relation = this.props.relation;
      if (relation.far) {
        return (
          <li className="inspector-relations-item">
            <span className="inspector-relations-item__service"
              onClick={this._handleRelationClick}
              tabIndex="0" role="button">
              {relation.far.serviceName}:{relation.far.name}
            </span>
          </li>
        );
      }
    }
  });

}, '0.1.0', { requires: [
  'svg-icon'
]});
