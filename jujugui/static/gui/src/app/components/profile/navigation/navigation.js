/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/** Navigation React component for use in the Profile component. */
class ProfileNavigation extends React.Component {

  constructor(props) {
    super(props);
  }

  _changeState(key) {
    this.props.changeState({
      // We're using a hash for the state for intra profile navigation because
      // of the ambiguous paths can not easily support yet another collision
      // case on top of model and entity names.
      hash: encodeURIComponent(key)
    });
  }

  render() {
    const links = [];
    this.props.sectionsMap.forEach((val, key) => {
      const classes = classNames(
        'profile-navigation__list-item', {
          'is-active': this.props.activeSection === key
        });
      links.push(
        <li
          className={classes}
          role="button"
          key={key}
          onClick={this._changeState.bind(this, key)}>
          {val.label}
        </li>);
    });

    return (
      <div className="profile-navigation">
        <ul>
          {links}
        </ul>
      </div>);
  }

};

ProfileNavigation.propTypes = {
  activeSection: React.PropTypes.string.isRequired,
  changeState: React.PropTypes.func.isRequired,
  sectionsMap: React.PropTypes.instanceOf(Map).isRequired
};

YUI.add('profile-navigation', function() {
  juju.components.ProfileNavigation = ProfileNavigation;
}, '', {
  requires: []
});
