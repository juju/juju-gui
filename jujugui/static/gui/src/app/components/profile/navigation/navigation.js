/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

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
        'p-list__item',
        {
          'is-active': this.props.activeSection === key
        },
        val.label.replace(/\s+/g, '-').toLowerCase()
      );
      links.push(
        <li
          className={classes}
          key={key}
          onClick={this._changeState.bind(this, key)}
          role="button">
          {val.label}
        </li>
      );
    });

    return (
      <div className="profile-navigation">
        <ul className="p-list">{links}</ul>
      </div>
    );
  }
}

ProfileNavigation.propTypes = {
  activeSection: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  sectionsMap: PropTypes.instanceOf(Map).isRequired
};

module.exports = ProfileNavigation;
