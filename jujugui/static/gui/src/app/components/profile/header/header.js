/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../../svg-icon/svg-icon');

/** Header React component for use in the Profile component. */
class ProfileHeader extends React.Component {
  /**
    Handle closing the profile.
  */
  _handleClose() {
    this.props.changeState({
      hash: null,
      profile: null
    });
  }

  render() {
    return (
      <div className="profile-header twelve-col">
        <div className="inner-wrapper">
          <div className="profile-header__close link"
            onClick={this._handleClose.bind(this)}
            role="button"
            tabIndex="0">
            <SvgIcon
              name="close_16"
              size="20" />
          </div>
          <span className={
            'profile-header__avatar profile-header__avatar--default'}>
            <span className="profile-header__avatar-overlay"></span>
          </span>
          <h1 className="profile-header__username">
            {this.props.username}
          </h1>
        </div>
      </div>);
  }

};

ProfileHeader.propTypes = {
  changeState: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired
};

module.exports = ProfileHeader;
