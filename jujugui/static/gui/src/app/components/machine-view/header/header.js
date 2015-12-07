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

YUI.add('machine-view-header', function() {

  juju.components.MachineViewHeader = React.createClass({
    propTypes: {
      menuItems: React.PropTypes.array,
      title: React.PropTypes.string.isRequired
    },

    /**
      Generate a menu for the supplied controls.

      @method _generateMenu
      @returns {Object} A more menu component
    */
    _generateMenu: function() {
      var menuItems = this.props.menuItems;
      if (!menuItems) {
        return;
      }
      return (
        <juju.components.MoreMenu
          items={menuItems} />);
    },

    render: function() {
      return (
        <div className="machine-view__header">
          {this.props.title}
          {this._generateMenu()}
        </div>
      );
    }
  });
}, '0.1.0', {
  requires: [
    'more-menu'
  ]
});
