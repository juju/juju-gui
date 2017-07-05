/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/** Header React component for use in the Profile component. */
class ProfileHeader extends React.Component {

  render() {
    return (
      <div className="profile-header">
        <div className="profile-header__content"></div>
      </div>);
  }

};

ProfileHeader.propTypes = {};

YUI.add('profile-header', function() {
  juju.components.ProfileHeader = ProfileHeader;
}, '', {
  requires: []
});
