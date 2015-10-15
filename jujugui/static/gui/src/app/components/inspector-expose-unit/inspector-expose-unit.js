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

YUI.add('inspector-expose-unit', function() {

  juju.components.InspectorExposeUnit = React.createClass({

    render: function() {
      var unit = this.props.unit;
      return (
        <li className="inspector-expose__unit" tabIndex="0" role="button"
          data-id={unit.id}
          onClick={this.props.action}>
            <div className="inspector-expose__unit-detail">
                {unit.displayName}
            </div>
            <div className="inspector-expose__unit-detail">
                {unit.public_address || 'No public address'}
            </div>
        </li>
      );
    }

  });

}, '0.1.0', { requires: []});
