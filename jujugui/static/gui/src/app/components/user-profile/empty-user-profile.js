/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const CreateModelButton = require('../create-model-button/create-model-button');

// This component handles the empty user profile.
class EmptyUserProfile extends React.Component {
  render() {
    const props = this.props;
    const basePath = `${props.staticURL}/static/gui/build/app`;
    const isCurrentUser = props.isCurrentUser;
    return (
      <div className="user-profile__empty twelve-col no-margin-bottom">
        <img alt="Empty profile"
          className="user-profile__empty-image"
          src=
            {`${basePath}/assets/images/non-sprites/empty_profile.png`} />
        <h2 className="user-profile__empty-title">
          {isCurrentUser ? 'Your' : 'This user\'s'} profile is currently empty
        </h2>
        <p className="user-profile__empty-text">
          {isCurrentUser ? 'Your' : 'This user\'s'} models, bundles, and
          charms will appear here when {isCurrentUser ? 'you' : 'they'} create
          them.
        </p>
        {isCurrentUser ? (
          <CreateModelButton
            changeState={props.changeState}
            switchModel={props.switchModel}
            title="Start building"
            type="inline-positive" />) : null}
      </div>
    );
  }
};

EmptyUserProfile.propTypes = {
  changeState: PropTypes.func.isRequired,
  isCurrentUser: PropTypes.bool,
  staticURL: PropTypes.string,
  switchModel: PropTypes.func.isRequired
};

EmptyUserProfile.defaultProps = {
  staticURL: ''
};

module.exports = EmptyUserProfile;
