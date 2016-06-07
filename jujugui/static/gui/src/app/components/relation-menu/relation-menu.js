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

YUI.add('relation-menu', function() {

  /**
    Get the real service name.

    @method _getRealServiceName
    @param {String} id The relation id.
    @param {Object} relation The relation.
    @returns {Object} The relation components to display.
  */
  function _getRealServiceName(id, relation) {
    var endpoint;
    if (id === relation.sourceId) {
      endpoint = relation.source;
    } else if (id === relation.targetId) {
      endpoint = relation.target;
    } else {
      // If it doesn't match any of the above it's a real relation id and we can
      // return that without modifying it.
      return id;
    }
    var type = id.split(':')[1];
    return endpoint.displayName
                   .replace(/^\(/, '')
                   .replace(/\)$/, '') + ':' + type;
  }

  /**
    Generate a list of bindings.

    @method _generateRelations
    @param {Array} relations A list of relations.
    @returns {Object} The relation components to display.
  */
  function _generateRelations(relations) {
    var components = [];
    relations.forEach((relation) => {
      var relationClasses = 'relation-container ' + (
        relation.hasRelationError() ? 'error' : 'running');
      var sourceClasses = 'inspect-relation endpoint ' + (
        relation.sourceHasError() ? 'error' : '');
      var targetClasses = 'inspect-relation endpoint ' + (
        relation.targetHasError() ? 'error' : '');
      components.push(
        <li className={relationClasses}
          data-relationid={relation.id}
          key={relation.id}>
          <span data-endpoint={relation.sourceId}
            className={sourceClasses}>
              {_getRealServiceName(relation.sourceId, relation)}
          </span>
          {' '}-{' '}
          <span data-endpoint={relation.targetId}
            className={targetClasses}>
            {_getRealServiceName(relation.targetId, relation)}
          </span>
          <span className="relation-remove link">
            <juju.components.SvgIcon name="delete_16"
              size="16" />
          </span>
        </li>);
    });
    return components;
  }

  var RelationMenu = function(props) {
    return (
      <div className="menu">
        <div className="triangle">&nbsp;</div>
        <ul>
          {_generateRelations(props.relations)}
        </ul>
      </div>
    );
  };

  RelationMenu.propTypes = {
    relations: React.PropTypes.array.isRequired
  };

  juju.components.RelationMenu = RelationMenu;

}, '0.1.0', { requires: [
  'svg-icon'
]});
