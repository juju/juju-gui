/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

class ProfileNavigation extends React.Component {

  constructor() {
    super();
    this.state = {
      activeSection: 'Models'
    };
  }

  render() {
    const links = ['Models', 'Bundles', 'Charms', 'Cloud Credentials']
      .map(label => <li className={this.state.activeSection === label ? 'active' : ''}>{label}</li>); // eslint-disable-line
    return (
      <div className="profile-navigation">
        <ul>
          {links}
        </ul>
      </div>);
  }

};

ProfileNavigation.propTypes = {};

YUI.add('profile-navigation', function() {
  juju.components.ProfileNavigation = ProfileNavigation;
}, '', {
  requires: []
});
