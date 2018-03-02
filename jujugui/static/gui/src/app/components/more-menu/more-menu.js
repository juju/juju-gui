/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const ButtonDropdown = require('../button-dropdown/button-dropdown');

class MoreMenu extends React.Component {

  /**
    Call the supplied action when an item is clicked

    @method _handleItemClick
    @param {Function} action The action to call
  */
  _handleItemClick(action) {
    if (action) {
      action();
      this.refs.buttonDropdown._toggleDropdown();
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
      'more-menu__menu-item',
      'dropdown-menu__list-item',
      {
        'more-menu__menu-item--active':
          item.id && this.props.activeItem === item.id,
        'more-menu__menu-item--inactive': !item.action
      }
    );
  }

  /**
    Generate the menu items.
    @returns {Object} The item components.
  */
  _generateItems() {
    return this.props.items.map(item => {
      const content = item.action ? (
        <a className="dropdown-menu__list-item-link"
          role="button"
          onClick={this._handleItemClick.bind(this, item.action)}>
          {item.label}
        </a>) : item.label;
      return (
        <li className={this._generateItemClasses(item)}
          key={item.label}
          role="menuitem"
          tabIndex="0">
          {content}
        </li>);
    });
  }

  render() {
    return (
      <ButtonDropdown
        classes={['more-menu']}
        icon={this.props.icon || 'contextual-menu-16'}
        listItems={this._generateItems()}
        ref="buttonDropdown" />
    );
  }
};

MoreMenu.propTypes = {
  activeItem: PropTypes.string,
  icon: PropTypes.string,
  items: PropTypes.array.isRequired
};

module.exports = MoreMenu;
