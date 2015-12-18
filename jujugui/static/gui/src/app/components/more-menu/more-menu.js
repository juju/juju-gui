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

YUI.add('more-menu', function() {

  juju.components.MoreMenu = React.createClass({
    mixins: [OnClickOutside],
    propTypes: {
      activeItem: React.PropTypes.string,
      items: React.PropTypes.array.isRequired
    },

    /**
      Get the intial state of the more menu.

      @method getInitialState
      @returns {String} The intial state.
    */
    getInitialState: function() {
      return {menuOpen: false};
    },

    /**
      Close the more menu when there is a click outside of the component.
      Called by the OnClickOutside mixin.

      @method handleClickOutside
      @param {Object} e The click event
    */
    handleClickOutside: function(e) {
      this.setState({menuOpen: false});
    },

    /**
      Toggle the menu open or closed.

      @method _handleToggleMenu
    */
    _handleToggleMenu: function() {
      this.setState({menuOpen: !this.state.menuOpen});
    },

    /**
      Call the supplied action when an item is clicked

      @method _handleItemClick
      @param {Function} action The action to call
    */
    _handleItemClick: function(action) {
      if (action) {
        action();
        this.setState({menuOpen: false});
      }
    },

    /**
      Generate the classes for the menu item.

      @method _generateItemClasses
      @param {Object} item The menu item.
      @returns {String} The collection of class names.
    */
    _generateItemClasses: function(item) {
      return classNames(
        'more-menu__menu-item',
        {
          'more-menu__menu-item--active':
            item.id && this.props.activeItem === item.id,
          'more-menu__menu-item--inactive': !item.action
        }
      );
    },

    /**
      Generate the menu.

      @method _generateMenu
      @returns {Object} The menu components.
    */
    _generateMenu: function() {
      if (!this.state.menuOpen) {
        return;
      }
      var components = [];
      this.props.items.forEach((item) => {
        components.push(
          <li className={this._generateItemClasses(item)}
            key={item.label}
            onClick={this._handleItemClick.bind(this, item.action)}
            role="button"
            tabIndex="0">
            {item.label}
          </li>);
      });
      return (
        <ul className="more-menu__menu">
          {components}
        </ul>);
    },

    /**
      Generate the classes for the menu.

      @method _generateClasses
      @returns {Object} The collection of classes.
    */
    _generateClasses: function() {
      return classNames(
        'more-menu',
        {
          'more-menu--active': this.state.menuOpen
        }
      );
    },

    render: function() {
      return (
        <div className={this._generateClasses()}>
          <span className="more-menu__toggle"
            onClick={this._handleToggleMenu}
            role="button"
            tabIndex="0">
            <juju.components.SvgIcon
              name="contextual-menu-16"
              size="16" />
          </span>
          {this._generateMenu()}
        </div>
      );
    }
  });
}, '0.1.0', {
  requires: [
    'svg-icon'
  ]
});
