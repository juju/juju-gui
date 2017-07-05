/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/** Profile React component used to display user details. */
class Profile extends React.Component {

  render() {
    const sectionsMap = Profile.sectionsMap;
    let section = sectionsMap.get(this.props.activeSection);
    let mapEntry;
    if (section === undefined) {
      // Grab the first element in the sectionsMap if the provided
      // activeSection does not exist.
      mapEntry = sectionsMap.entries().next().value;
      // The value of the Map entry.
      section = mapEntry[1];
    }

    return (
      <juju.components.Panel
        instanceName="profile"
        visible={true}>
        <juju.components.ProfileHeader />
        <div className="inner-wrapper">
          <div className="three-col">
            <juju.components.ProfileNavigation
              // Use supplied activeSection or the key from the first map entry.
              activeSection={this.props.activeSection || mapEntry[0]}
              changeState={this.props.changeState}
              sectionsMap={sectionsMap}/>
          </div>
          <div className="six-col last-col">
            {section.component}
          </div>
        </div>
      </juju.components.Panel>
    );
  }

};

Profile.sectionsMap = new Map([
  ['models', {
    label: 'Models',
    component: 'Models'
  }],
  ['charms', {
    label: 'Charms',
    component: 'Charms'
  }],
  ['bundles', {
    label: 'Bundles',
    component: 'Bundles'
  }],
  ['credentials', {
    label: 'Cloud Credentials',
    component: 'Cloud Credentials'
  }]
]);

Profile.propTypes = {
  activeSection: React.PropTypes.string,
  changeState: React.PropTypes.func.isRequired
};

YUI.add('profile', function() {
  juju.components.Profile = Profile;
}, '', {
  requires: [
    'panel-component',
    'profile-navigation',
    'profile-header'
  ]
});
