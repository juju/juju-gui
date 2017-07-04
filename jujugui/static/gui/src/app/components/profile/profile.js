/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

class Profile extends React.Component {

  render() {
    return (
      <juju.components.Panel
        instanceName="profile"
        visible={true}>
        <juju.components.ProfileHeader />
        <div className="inner-wrapper">
          <div className="three-col">
            <juju.components.ProfileNavigation />
          </div>
          <div className="six-col last-col"></div>
        </div>
      </juju.components.Panel>
    );
  }

};

Profile.propTypes = {};

YUI.add('profile', function() {
  juju.components.Profile = Profile;
}, '', {
  requires: [
    'profile-navigation',
    'profile-header'
  ]
});
