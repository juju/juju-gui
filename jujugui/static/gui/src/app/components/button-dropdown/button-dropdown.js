/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const ReactDOM = require('react-dom');
const shapeup = require('shapeup');

const SvgIcon = require('../svg-icon/svg-icon');
const DropdownMenu = require('../dropdown-menu/dropdown-menu');

/**
  Creates a component that has an icon, which when clicked, opens a dropdown
  menu with list items.
*/
class ButtonDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDropdown: false
    };
  }

  /**
    Passed into the dropdown component to call when the user clicks outside
    of it. We use this trigger to close the dropdown.
    @param {Object} evt The click event.
  */
  _handleDropdownClickOutside(evt) {
    // If they click the button again we don't want it to close the menu in the
    // clickoutside as the _toggleDropdown will handle that.
    if (!ReactDOM.findDOMNode(this).contains(evt.target)) {
      this.setState({showDropdown: false});
    }
  }

  /**
    Toggles the dropdown visibility.
  */
  _toggleDropdown() {
    this.setState({showDropdown: !this.state.showDropdown});
  }

  /**
    Call the supplied action when an item is clicked
    @param {Function} action The action to call
  */
  _handleItemClick(action) {
    if (action) {
      action();
      this._toggleDropdown();
    }
  }

  /**
    Generate the classes for the menu item.
    @param {Object} item The menu item.
    @returns {String} The collection of class names.
  */
  _generateItemClasses(item) {
    return classNames(
      'dropdown-menu__list-item',
      {
        'dropdown-menu__list-item--active':
          item.id && this.props.activeItem === item.id,
        'dropdown-menu__list-item--inactive': !item.action && !item.element
      }
    );
  }

  /**
    Generate the menu items.
    @returns {Object} The item components.
  */
  _generateItems() {
    return this.props.listItems.map((item, i) => {
      let content;
      if (item.element) {
        content = item.element;
      } else if (item.action) {
        content = (
          <a className="dropdown-menu__list-item-link"
            onClick={this._handleItemClick.bind(this, item.action)}
            role="button">
            {item.label}
          </a>);
      } else {
        content = item.label;
      }
      return (
        <li className={this._generateItemClasses(item)}
          key={item.id || item.label || ('item-' + i)}
          role="menuitem"
          tabIndex="0">
          {content}
        </li>);
    });
  }

  /**
    Generates the drop down menu if the state has showDropdown true and the
    disableDropdown prop is not true.
    @return {Object} The dropdown React component.
  */
  _generateDropdownMenu() {
    if (!this.state.showDropdown || this.props.disableDropdown) {
      return null;
    }
    return (
      <DropdownMenu
        handleClickOutside={this._handleDropdownClickOutside.bind(this)}>
        {this._generateItems()}
      </DropdownMenu>);
  }

  /**
    Generates the icon element or returns the one provided in the icon prop.
    @return {Object} The icon React component.
  */
  _generateIcon() {
    const icon = this.props.icon;
    if (typeof icon === 'string') {
      return (
        <SvgIcon className="button-dropdown__icon"
          name={icon}
          size="16" />);
    }
    return icon;
  }

  /**
    Generates the tooltip element if one is provided in the prop.
    @return {Object} The tooltip React component.
  */
  _generateTooltip() {
    const tooltip = this.props.tooltip;
    if (tooltip) {
      return (
        <span className="tooltip__tooltip--below">
          <span className="tooltip__inner tooltip__inner--up">
            {tooltip}
          </span>
        </span>
      );
    }
    return null;
  }

  /**
   Get class names based on whether the dropdown is shown.
   If it is we want to hide the tooltip otherwise there's a black halo
   around the tooltip up arrow.
   @returns {String} The classes to add to the element.
  */
  _getClassNames() {
    return classNames(
      'button-dropdown__button', {
        'button-dropdown__show-menu': this.state.showDropdown,
        'button-dropdown__button-with-text': this.props.disableDropdown
      });
  }

  render() {
    const classes = classNames(
      'button-dropdown',
      this.props.classes
    );
    return (
      <div className={classes}>
        <span aria-controls="headerDropdownMenu"
          aria-expanded="false"
          aria-haspopup="true"
          aria-owns="headerDropdownMenu"
          className={this._getClassNames()}
          onClick={this._toggleDropdown.bind(this)}
          role="button"
          tabIndex="0">
          {this._generateIcon()}
          {this._generateTooltip()}
        </span>
        {this._generateDropdownMenu()}
      </div>);
  }
};

ButtonDropdown.propTypes = {
  activeItem: PropTypes.string,
  classes: PropTypes.array,
  disableDropdown: PropTypes.bool,
  icon: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  // The listItems prop isn't required because this component is also used to
  // display just the 'login' link. At which point the drop down is disabled
  // and there are no list items.
  listItems: PropTypes.arrayOf(shapeup.shape({
    action: PropTypes.func,
    element: PropTypes.object,
    id: PropTypes.string,
    label: PropTypes.string
  })),
  tooltip: PropTypes.string
};

ButtonDropdown.defaultProps = {
  disableDropdown: false,
  icon: 'contextual-menu-16'
};

module.exports = ButtonDropdown;
