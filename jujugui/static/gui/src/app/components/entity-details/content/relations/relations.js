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

YUI.add('entity-content-relations', function() {

  juju.components.EntityContentRelations = React.createClass({
    /* Define and validate the properites available on this component. */
    propTypes: {
      changeState: React.PropTypes.func.isRequired,
      relations: React.PropTypes.object.isRequired
    },

    /**
      Handle clicks on tags.

      @method _handleTagClick
      @param {String} type The requirement type.
      @param {String} name The requirement interface.
    */
    _handleRelationClick: function(type, name) {
      var metadata = {
        activeComponent: 'search-results',
        search: null
      };
      metadata[type] = name;
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: metadata
        }
      });
    },
    /**
      Generate the list of relations.

      @method _generateRelations
      @return {Object} The relation markup.
    */
    _generateRelations: function() {
      var components = [];
      var relations = this.props.relations;
      var requires = [];
      if (relations.requires) {
        requires = Object.keys(relations.requires).map(function(key) {
          return relations.requires[key];
        });
      }
      var provides = [];
      if (relations.provides) {
        provides = Object.keys(relations.provides).map(function(key) {
          return relations.provides[key];
        });
      }
      var relationsList = provides.concat(requires);
      relationsList.forEach(function(relation) {
        var type = this.role === 'requirer' ? 'requires' : 'provides';
        components.push(
          <li className="link section__list-item"
            role="button"
            tabIndex="0"
            onClick={this._handleRelationClick.bind(
              this, type, relation.interface)}
            key={relation.name}>
            {relation.name}: {relation.interface}
          </li>
        );
      }, this);
      return components;
    },

    render: function() {
      return (
        <div className="section entity-relations" id="relations">
          <h3 className="section__title">
            Relations
          </h3>
          <ul className="section__list" ref="list">
            {this._generateRelations()}
          </ul>
        </div>
      );
    }
  });

}, '0.1.0', {requires: []});
