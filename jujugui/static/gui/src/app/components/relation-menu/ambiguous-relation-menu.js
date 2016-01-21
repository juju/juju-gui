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

YUI.add('ambiguous-relation-menu', function() {

  /**
    Generate a list of bindings.

    @method _generateRelations
    @param {Array} endpoints A list of endpoints.
    @returns {Object} The endpoint components to display.
  */
  function _generateRelations(endpoints) {
    var components = [];
    endpoints.forEach((endpoint) => {
      var start = endpoint[0];
      var end = endpoint[1];
      components.push(
        <li
            data-startservice={start.service}
            data-startname={start.name}
            data-endservice={end.service}
            data-endname={end.name}
            key={start.name + end.name}>
            {start.displayName}:{start.name} &rarr; {end.displayName}:{end.name}
        </li>);
    });
    return components;
  }

  juju.components.AmbiguousRelationMenu = function(props) {
    return (
      <div className="menu">
        <ul>
          {_generateRelations(props.endpoints)}
        </ul>
        <div className="cancel link" role="button" tabIndex="0">
          <juju.components.SvgIcon name="close_16"
            size="16" />
        </div>
      </div>
    );
  };

}, '0.1.0', { requires: [
  'svg-icon'
]});
