/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/** Navigation React component for use in the Profile component. */
class ProfileNavigation extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      activeSection: this.props.activeSection || 'models'
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({activeSection: nextProps.activeSection});
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.activeSection !== nextProps.activeSection;
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
    this.props.sectionsMap.forEach((label, key) => {
      const classes = classNames(
        'profile-navigation__list-item', {
          'is-active': this.state.activeSection === key
        });
      links.push(
        <li
          className={classes}
          role="button"
          key={key}
          onClick={this._changeState.bind(this, key)}>
          {label}
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
  activeSection: React.PropTypes.string,
  changeState: React.PropTypes.func.isRequired,
  sectionsMap: React.PropTypes.instanceOf(Map).isRequired
};

YUI.add('profile-navigation', function() {
  juju.components.ProfileNavigation = ProfileNavigation;
}, '', {
  requires: []
});
