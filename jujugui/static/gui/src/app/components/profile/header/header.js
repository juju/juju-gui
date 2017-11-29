/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

/** Header React component for use in the Profile component. */
class ProfileHeader extends React.Component {

  render() {
    return (
      <div className="profile-header twelve-col">
        <div className="inner-wrapper">
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
  username: PropTypes.string.isRequired
};

module.exports = ProfileHeader;
