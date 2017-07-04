/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

class ProfileHeader extends React.Component {

  render() {
    return (
      <div className="profile-header">
        <div className="content"></div>
      </div>);
  }

};

ProfileHeader.propTypes = {};

YUI.add('profile-header', function() {
  juju.components.ProfileHeader = ProfileHeader;
}, '', {
  requires: []
});
