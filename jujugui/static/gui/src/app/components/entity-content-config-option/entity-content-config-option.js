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

YUI.add('entity-content-config-option', function() {

  juju.components.EntityContentConfigOption = React.createClass({

    /**
      Create the markup for default value.

      @method _generateDefault
      @param {String} defaultValue The option default.
      @return {Object} The generated markup.
    */
    _generateDefault: function(defaultValue) {
      if (defaultValue) {
        return <dd className="entity-content__config-default">
            {defaultValue}
          </dd>;
      }
      return;
    },

    render: function() {
      var name = this.props.name;
      return (
        <div className="entity-content__config-option">
          <dt id={'charm-config-' + name}
              className="entity-content__config-name">
            {name}
          </dt>
          <dd className="entity-content__config-description">
            <span className="entity-content__config-type">
              ({this.props.type})
            </span>
            {' '}
            {this.props.description}
          </dd>
          {this._generateDefault(this.props.default)}
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: []
});
