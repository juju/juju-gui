/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

class Profile extends React.Component {

  render() {
    return (
      <juju.components.Panel
        instanceName="profile"
        visible={true}>
      </juju.components.Panel>
    );
  }

};

Profile.propTypes = {};

YUI.add('profile', function() {
  juju.components.Profile = Profile;
}, '', {
  requires: []
});
