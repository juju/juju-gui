/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const enhanceWithClickOutside = require('../../init/react-click-outside');

const SvgIcon = require('../svg-icon/svg-icon');

class MoreMenu extends React.Component {
  constructor() {
    super();
    this.state = {menuOpen: false};
  }

  /**
    Close the more menu when there is a click outside of the component.
    Called by the component wrapper.

    @method handleClickOutside
    @param {Object} e The click event
  */
  handleClickOutside(e) {
    this.setState({menuOpen: false});
  }

  /**
    Toggle the menu open or closed.

    @method _handleToggleMenu
  */
  _handleToggleMenu() {
    this.setState({menuOpen: !this.state.menuOpen});
  }

  /**
    Call the supplied action when an item is clicked

    @method _handleItemClick
    @param {Function} action The action to call
  */
  _handleItemClick(action) {
    if (action) {
      action();
      this.setState({menuOpen: false});
    }
  }

  /**
    Generate the classes for the menu item.

    @method _generateItemClasses
    @param {Object} item The menu item.
    @returns {String} The collection of class names.
  */
  _generateItemClasses(item) {
    return classNames(
      'more-menu__menu-item', {
        'more-menu__menu-item--active':
          item.id && this.props.activeItem === item.id,
        'more-menu__menu-item--inactive': !item.action
      }
    );
  }

  /**
    Generate the menu.

    @method _generateMenu
    @returns {Object} The menu components.
  */
  _generateMenu() {
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
  }

  /**
    Generate the classes for the menu.

    @method _generateClasses
    @returns {Object} The collection of classes.
  */
  _generateClasses() {
    return classNames(
      'more-menu', {
        'more-menu--active': this.state.menuOpen
      }
    );
  }

  render() {
    return (
      <div className={this._generateClasses()}>
        <span className="more-menu__toggle"
          onClick={this._handleToggleMenu.bind(this)}
          role="button"
          tabIndex="0">
          <SvgIcon
            name="contextual-menu-16"
            size="16" />
        </span>
        {this._generateMenu()}
      </div>
    );
  }
};

MoreMenu.propTypes = {
  activeItem: PropTypes.string,
  items: PropTypes.array.isRequired
};

module.exports = enhanceWithClickOutside(MoreMenu);
