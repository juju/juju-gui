/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/**
  Generates a button dropdown component with help items.
*/
class HeaderHelp extends React.Component {

  /**
    Generate a link to issues based on whether the user is logged in and in gisf.
    @returns {Object} The React object for the issues link.
   */
  _generateIssuesLink() {
    let label = 'File Issue';
    let link = 'https://github.com/juju/juju-gui/issues';
    const props = this.props;
    if (props.user) {
      label = 'Get Support';
      link = props.gisf ? 'https://jujucharms.com/support' :
        'https://jujucharms.com/docs/stable/about-juju';
    }
    return (
      <li className="dropdown-menu__list-item" role="menuitem" tabIndex="0" key="issues">
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
        <li className="dropdown-menu__list-item" role="menuitem" tabIndex="0" key="docs">
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
    this.refs.buttonDropdown._toggleDropdown();
    this.props.displayShortcutsModal();
  }

  render() {
    return (
      <juju.components.ButtonDropdown
        classes={['header-help']}
        ref="buttonDropdown"
        icon="help_16"
        listItems={[
          this._generateDocsLink(),
          this._generateIssuesLink(),
          <li className="dropdown-menu__list-item" role="menuItem" key="shortcuts"
            tabIndex="0" onClick={this._handleShortcutsLink.bind(this)}>
            <span className="dropdown-menu__list-item-link">
                Keyboard shortcuts
              <span className="header-help__extra-info">
                  Shift + ?
              </span>
            </span>
          </li>
        ]}
        tooltip="help"
      />);
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
  'button-dropdown'
]});
