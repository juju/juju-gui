/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/**
  Provides a help menu to the header. The idea moving forward is to have a
  more complete 'built-in' small help system for tips.
*/
class HeaderHelp extends React.Component {
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
    Clicking the help menu will toggle whether it's visibility.
  */
  _toggleDropdown() {
    this.setState({showDropdown: !this.state.showDropdown});
  }

  /**
    Generate a link to issues based on whether the user is logged in
    and in gisf.
    @returns {Object} The React object for the issues link.
   */
  _generateIssuesLink() {
    let label = 'File Issue';
    let link = 'https://github.com/juju/juju-gui/issues';
    if (this.props.user) {
      label = 'Get Support';
      link = this.props.gisf ? 'https://jujucharms.com/support' :
        'https://jujucharms.com/docs/stable/about-juju';
    }
    return (
      <li className="dropdown-menu__list-item" role="menuitem" tabIndex="0">
        <a className="dropdown-menu__list-item-link"
          href={link} target="_blank">{label}</a>
      </li>);
  }

  /**
    Generate the documentation link.
    @returns {Object} The React object for the documentation link or undefined.
  */
  _generateDocsLink() {
    if (this.props.gisf) {
      return (
        <li className="dropdown-menu__list-item" role="menuitem" tabIndex="0">
          <a className="dropdown-menu__list-item-link"
            href="https://jujucharms.com/docs/stable/getting-started-jaas"
            target="_blank">
            View Documentation</a>
        </li>);
    }
  }

  /**
   Click the button, get the help.
    @param {Object} evt The event that triggered the function
  */
  _handleShortcutsLink(evt) {
    this._toggleDropdown();
    this.props.displayShortcutsModal();
  }

  /**
   Generate menu based on whether the button has been clicked.
   @returns {Object} The React object for the dropdown menu or empty string.
  */
  _generateHelpMenu() {
    if (this.state.showDropdown) {
      return (
        <juju.components.DropdownMenu
          classes={['header-help']}
          handleClickOutside={this._handleDropdownClickOutside.bind(this)}>
          {this._generateDocsLink()}
          {this._generateIssuesLink()}
          <li className="dropdown-menu__list-item" role="menuItem"
            tabIndex="0" onClick={this._handleShortcutsLink.bind(this)}>
            <span className="dropdown-menu__list-item-link">
                Keyboard shortcuts
              <span className="header-help__extra-info">
                  Shift + ?
              </span>
            </span>
          </li>
        </juju.components.DropdownMenu>
      );
    }
    return '';
  }

  /**
   Get class names based on whether the help menu is shown.
   If it is we want to hide the tooltip otherwise there's a black halo
   around the tooltip up arrow.
   @returns {String} The classes to add to the element.
  */
  _getClassNames() {
    return classNames(
      'header-menu__button', {
        'header-menu__show-menu': this.state.showDropdown
      });
  }

  render() {
    return (
      <div className="header-menu">
        <span className={this._getClassNames()}
          onClick={this._toggleDropdown.bind(this)}
          role="button"
          tabIndex="0"
          aria-haspopup="true"
          aria-owns="headerHelpMenu"
          aria-controls="headerHelpMenu"
          aria-expanded="false">
          <juju.components.SvgIcon name="help_16"
            className="header-menu__icon"
            size="16" />
          <span className="tooltip__tooltip--below">
            <span className="tooltip__inner tooltip__inner--up">
              Help
            </span>
          </span>
        </span>
        {this._generateHelpMenu()}
      </div>);
  }
};

HeaderHelp.propTypes = {
  appState: PropTypes.object.isRequired,
  displayShortcutsModal: PropTypes.func.isRequired,
  gisf: PropTypes.bool.isRequired,
  user: PropTypes.object
};

YUI.add('header-help', function() {
  juju.components.HeaderHelp = HeaderHelp;
}, '0.1.0', { requires: [
  'dropdown-menu',
  'svg-icon'
]});
