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

YUI.add('inspector-relations', function() {

  juju.components.InspectorRelations = React.createClass({

    /**
      Generate the relation list of components.

      @method _generateRelations
      @returns {Object} The relation components.
    */
    _generateRelations: function() {
      var relations = this.props.serviceRelations;
      var components = [];
      if (relations.length === 0) {
        return (
          <div className="inspector-relations__message">
            No relations for this service.
          </div>);
      }
      relations.forEach(function(relation, index) {
        components.push(
        <juju.components.InspectorRelationsItem
          index={index}
          key={relation.id}
          relation={relation}
          changeState={this.props.changeState} />);
      }, this);
      return components;
    },

    render: function() {
      return (
        <div className="inspector-relations">
          <ul className="inspector-relations__list">
            {this._generateRelations()}
          </ul>
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'inspector-relations-item'
]});
