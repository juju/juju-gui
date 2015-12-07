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
      Handle navigating to a service when it is clicked.

      @method _handleServiceClick
    */
    _handleServiceClick: function() {
      this.props.changeState({
        sectionA: {
          component: 'inspector',
          metadata: {
            id: this.props.relation.far.service,
            activeComponent: undefined
          }}});
    },

    /**
      Get the correct icon for the status.

      @method _getIcon
      @param {Boolean} pending The pending status.
      @returns {String} The sprite name for the icon.
    */
    _getIcon: function(pending) {
      return pending ? 'uncommitted' : 'unit-running';
    },

    render: function() {
      var relation = this.props.relation;
      return (
        <li className="inspector-relations-item">
          <span className="inspector-relations-item__service"
            role="button" tabIndex="0"
            onClick={this._handleServiceClick}>
            <span className="inspector-relations-item__status">
              <juju.components.SvgIcon name={this._getIcon(relation.pending)}
                size="16" />
            </span>
            {relation.far.serviceName}
          </span>
          <span className="inspector-relations-item__details">
            <p className="inspector-relations-item__property">
              Interface: {relation.interface}
            </p>
            <p className="inspector-relations-item__property">
              Name: {relation.near.name}
            </p>
            <p className="inspector-relations-item__property">
              Role: {relation.near.role || 'None'}
            </p>
            <p className="inspector-relations-item__property">
              Scope: {relation.scope}
            </p>
          </span>
        </li>
      );
    }

  });

}, '0.1.0', { requires: [
  'svg-icon'
]});
