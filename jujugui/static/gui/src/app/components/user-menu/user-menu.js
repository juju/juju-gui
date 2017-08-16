/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/**
  Provides a user menu to the header - shows Profile, Account and Logout links.
  If user is not logged in the user icon is replaced with a login button.
*/
class UserMenu extends React.Component {
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
    // clickoutside as the _toggleHelpMenu will handle that.
    if (!ReactDOM.findDOMNode(this).contains(e.target)) {
      this.setState({showDropdown: false});
    }
  }

  /**
    Clicking the help menu will toggle whether it's visibility.
  */
  _toggleDropdown() {
    this.setState({showDropdown: !this.state.showDropdown});
  }

  _handleProfileClick() {
    this.props.navigateUserProfile();
    this._toggleDropdown();
  }

  _handleAccountClick() {
    this.props.navigateUserAccount();
    this._toggleDropdown();
  }

  /**
    Generate menu based on whether the button has been clicked.
  */
  _generateUserMenu() {
    if (!this.state.showDropdown) {
      return '';
    }
    const logoutLink = this.props.LogoutLink;
    return (
      <juju.components.DropdownMenu
        handleClickOutside={this._handleDropdownClickOutside.bind(this)}>
        <li className="dropdown-menu__list-item"
          role="menuitem" tabIndex="0">
          <a className="dropdown-menu__list-item-link"
            role="button"
            onClick={this._handleProfileClick.bind(this)}>Profile</a>
        </li>
        <li className="dropdown-menu__list-item"
          role="menuitem" tabIndex="0">
          <a className="dropdown-menu__list-item-link"
            role="button"
            onClick={this._handleAccountClick.bind(this)}>Account</a>
        </li>
        <li className="dropdown-menu__list-item"
          role="menuitem" tabIndex="0">
          {logoutLink}
        </li>
      </juju.components.DropdownMenu>
    );
  }

  /**
    Get class names based on whether the menu is shown.

    @method _getClassNames
  */
  _getClassNames(isLogin) {
    return classNames(
      'header-menu__button',
      {
        'header-menu__button-with-text': isLogin,
        'header-menu__show-menu': this.state.showDropdown
      });
  }

  render() {
    const controllerAPI = this.props.controllerAPI;
    const loginEle = this.props.USSOLoginLink;
    const showLogin = controllerAPI && !controllerAPI.userIsAuthenticated;
    let buttonContent;
    let menu;

    if (showLogin) {
      buttonContent = loginEle;
    } else {
      buttonContent = (<juju.components.SvgIcon name="user_16"
        className="header-menu__icon"
        size="16" />);
      menu = this._generateUserMenu();
    }
    return (
      <div className="header-menu">
        <span className={this._getClassNames(showLogin)}
          onClick={this._toggleDropdown.bind(this)}
          role="button"
          tabIndex="0"
          aria-haspopup="true"
          aria-owns="userMenu"
          aria-controls="userMenu"
          aria-expanded="false">
          {buttonContent}
        </span>
        {menu}
      </div>
    );
  }
};

UserMenu.propTypes = {
  LogoutLink: PropTypes.object,
  USSOLoginLink: PropTypes.object,
  controllerAPI: PropTypes.object,
  navigateUserAccount: PropTypes.func.isRequired,
  navigateUserProfile: PropTypes.func.isRequired
};

YUI.add('user-menu', function() {
  juju.components.UserMenu = UserMenu;
}, '0.1.0', { requires: [
  'dropdown-menu',
  'svg-icon'
]});
