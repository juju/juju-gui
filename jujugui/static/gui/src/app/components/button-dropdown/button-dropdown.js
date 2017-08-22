/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/**
  Creates a component that has an icon, which when clicked, opens a dropdown
  menu with list items.
*/
class ButtonDropdown extends React.Component {
  constructor() {
    super();
    this.state = {
      showDropdown: false
    };
  }

  /**
    Passed into the dropdown component to call when the user clicks outside
    of it. We use this trigger to close the dropdown.
    @param {Object} e The click event.
  */
  _handleDropdownClickOutside(e) {
    // If they click the button again we don't want it to clse the menu in the
    // clickoutside as the _toggleDropdown will handle that.
    if (!ReactDOM.findDOMNode(this).contains(e.target)) {
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
    Generates the drop down menu if the state has showDropdown true and the
    disableDropdown prop is not true.
    @return {Object} The dropdown React component.
  */
  _generateDropdownMenu() {
    if (!this.state.showDropdown || this.props.disableDropdown) {
      return null;
    }
    const props = this.props;
    return (
      <juju.components.DropdownMenu
        classes={props.classes}
        handleClickOutside={this._handleDropdownClickOutside.bind(this)}>
        {props.listItems}
      </juju.components.DropdownMenu>);
  }

  /**
    Generates the icon element or returns the one provided in the icon prop.
    @return {Object} The icon React component.
  */
  _generateIcon() {
    const icon = this.props.icon;
    if (typeof icon === 'string') {
      return (
        <juju.components.SvgIcon name={icon}
          className="button-dropdown__icon"
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
      'button-dropdown__button',
      this.props.classes, {
        'button-dropdown__show-menu': this.state.showDropdown,
        'button-dropdown__button-with-text': this.props.disableDropdown
      });
  }

  render() {
    return (
      <div className="button-dropdown">
        <span className={this._getClassNames()}
          onClick={this._toggleDropdown.bind(this)}
          role="button"
          tabIndex="0"
          aria-haspopup="true"
          aria-owns="headerDropdownMenu"
          aria-controls="headerDropdownMenu"
          aria-expanded="false">
          {this._generateIcon()}
          {this._generateTooltip()}
        </span>
        {this._generateDropdownMenu()}
      </div>);
  }
};

ButtonDropdown.propTypes = {
  classes: PropTypes.array,
  disableDropdown: PropTypes.bool,
  icon: PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.object
  ]).isRequired,
  listItems: PropTypes.array,
  tooltip: PropTypes.string
};

ButtonDropdown.defaultProps = {
  disableDropdown: false
};

YUI.add('button-dropdown', function() {
  juju.components.ButtonDropdown = ButtonDropdown;
}, '0.1.0', { requires: [
  'dropdown-menu',
  'svg-icon'
]});
