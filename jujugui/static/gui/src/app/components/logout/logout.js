/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

class Logout extends React.Component {
  /**
    Generate the classes based on the props.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    return classNames(
      'logout-link',
      'dropdown-menu__list-item-link',
      {
        'logout-link--hidden': !this.props.visible
      }
    );
  }

  _handleClick() {
    const props = this.props;
    if (props.doCharmstoreLogout()) {
      props.locationAssign(props.logoutUrl);
    }
  }

  render() {
    const props = this.props;
    let logoutUrl = props.logoutUrl;
    let target = '_self';
    if (props.doCharmstoreLogout()) {
      logoutUrl = props.charmstoreLogoutUrl;
      target = '_blank';
    }

    return (
      <a className={this._generateClasses()}
        href={logoutUrl}
        onClick={this._handleClick.bind(this)}
        target={target}>
        Logout
      </a>
    );
  }
};

Logout.propTypes = {
  charmstoreLogoutUrl: PropTypes.string.isRequired,
  doCharmstoreLogout: PropTypes.func.isRequired,
  locationAssign: PropTypes.func.isRequired,
  logoutUrl: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired
};

module.exports = Logout;
