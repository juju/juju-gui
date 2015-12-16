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
      title: React.PropTypes.string.isRequired,
      toggle: React.PropTypes.object
    },

    /**
      Generate a menu for the supplied controls.

      @method _generateControl
      @returns {Object} A more menu component
    */
    _generateControl: function() {
      var menuItems = this.props.menuItems;
      var toggle = this.props.toggle;
      if (menuItems) {
        return (
          <juju.components.MoreMenu
            items={menuItems} />);
      } else if (toggle) {
        var icon = toggle.toggleOn ? 'close_16' : 'add-light-16';
        var type = toggle.toggleOn ? 'grey' : 'confirm';
        return (
          <juju.components.GenericButton
            action={toggle.action}
            disabled={toggle.disabled}
            type={type}
            icon={icon} />);
      }
    },

    render: function() {
      return (
        <div className="machine-view__header">
          {this.props.title}
          {this._generateControl()}
        </div>
      );
    }
  });
}, '0.1.0', {
  requires: [
    'more-menu',
    'generic-button'
  ]
});
