/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

class ProfileNavigation extends React.Component {

  constructor() {
    super();
    this.state = {
      activeSection: 'models'
    };
  }

  _changeState(label) {
    this.props.changeState({
      // We're using a hash for the state for intra profile navigation because
      // of the ambiguous paths can not easily support yet another collision
      // case on top of model and entity names.
      hash: encodeURIComponent(label.toLowerCase())
    });
  }

  render() {
    const links = ['Models', 'Bundles', 'Charms', 'Cloud Credentials']
      .map(label =>
        <li
          className={this.state.activeSection === label.toLowerCase() ? 'active' : ''} // eslint-disable-line
          key={label}
          onClick={this._changeState.bind(this, label)}>
          {label}
        </li>);
    return (
      <div className="profile-navigation">
        <ul>
          {links}
        </ul>
      </div>);
  }

};

ProfileNavigation.propTypes = {
  changeState: React.PropTypes.func.isRequired
};

YUI.add('profile-navigation', function() {
  juju.components.ProfileNavigation = ProfileNavigation;
}, '', {
  requires: []
});
