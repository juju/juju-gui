/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

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
          <juju.components.CreateModelButton
            changeState={props.changeState}
            clearPostDeployment={this.props.clearPostDeployment}
            switchModel={props.switchModel}
            title="Start building"
            type="inline-positive" />) : null}
      </div>
    );
  }
};

EmptyUserProfile.propTypes = {
  changeState: PropTypes.func.isRequired,
  clearPostDeployment: PropTypes.func.isRequired,
  isCurrentUser: PropTypes.bool,
  staticURL: PropTypes.string,
  switchModel: PropTypes.func.isRequired
};

EmptyUserProfile.defaultProps = {
  staticURL: ''
};

YUI.add('empty-user-profile', function() {
  juju.components.EmptyUserProfile = EmptyUserProfile;
}, '', {
  requires: [
    'create-model-button'
  ]
});
