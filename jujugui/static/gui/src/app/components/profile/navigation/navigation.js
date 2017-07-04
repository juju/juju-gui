/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

class ProfileNavigation extends React.Component {

  render() {
    return (<div className="profile-navigation"></div>);
  }

};

ProfileNavigation.propTypes = {};

YUI.add('profile-navigation', function() {
  juju.components.ProfileNavigation = ProfileNavigation;
}, '', {
  requires: []
});
