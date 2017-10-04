/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../../generic-button/generic-button');

class UserProfileHeader extends React.Component {
  /**
    Generate the login button if it should be shown.

    @method _generateLogin
    @returns {Object} The login component.
  */
  _generateLogin() {
    const props = this.props;
    if (props.userInfo.external) {
      return;
    }
    return (
      <GenericButton
        type="inline-neutral"
        action={props.interactiveLogin}>
        Log in to the charm store
      </GenericButton>);
  }

  /**
    Generate the provided avatar or a default.

    @method _generateAvatar
    @returns {Object} The avatar component.
  */
  _generateAvatar() {
    var className = 'user-profile-header__avatar';
    if (!this.props.avatar) {
      return (
        <span className={className + ' ' + className + '--default'}>
          <span className="avatar-overlay"></span>
        </span>);
    }
    return (
      <img alt={this.props.userInfo.profile}
        className={className}
        src={this.props.avatar} />);
  }

  /**
    Generate the list of links.

    @method _generateLinks
    @returns {Object} The avatar component.
  */
  _generateLinks() {
    var links = [];
    this.props.links.forEach((link) => {
      var action = link.action;
      var type = link.type;
      var classes = {
        'user-profile-header__link--is-link': !!action
      };
      if (type) {
        classes['user-profile-header__link--' + type] = true;
      }
      var className = classNames('user-profile-header__link', classes);
      if (action) {
        links.push(
          <li className={className}
            key={link.label}
            onClick={action}
            role="button"
            tabIndex="0">
            {link.label}
          </li>);
      } else {
        links.push(
          <li className={className}
            key={link.label}>
            {link.label}
          </li>);
      }
    });
    return (
      <ul className="user-profile-header__links">
        {links}
      </ul>);
  }

  render () {
    return (
      <div className="user-profile-header twelve-col">
        {this._generateLogin()}
        {this._generateAvatar()}
        <h1 className="user-profile-header__username">
          {this.props.userInfo.profile}
        </h1>
        {this._generateLinks()}
      </div>);
  }
};

UserProfileHeader.propTypes = {
  avatar: PropTypes.string.isRequired,
  interactiveLogin: PropTypes.func,
  links: PropTypes.array.isRequired,
  // userInfo must have the following attributes:
  // - external: the external user name to use for retrieving data, for
  //   instance, from the charm store. Might be null if the user is being
  //   displayed for the current user and they are not authenticated to
  //   the charm store;
  // - isCurrent: whether the profile is being displayed for the currently
  //   authenticated user;
  // - profile: the user name for whom profile details must be displayed.
  userInfo: PropTypes.object.isRequired
};

module.exports = UserProfileHeader;
