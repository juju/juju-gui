/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

YUI.add('sharing', function() {

  /**
    Modal component for viewing which users have access to the model, as well
    as sharing access with other users.
  */
  juju.components.Sharing = React.createClass({
    propTypes: {
      addNotification: React.PropTypes.func,
      closeHandler: React.PropTypes.func,
      getModelUserInfo: React.PropTypes.func.isRequired,
      humanizeTimestamp: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];

      return {
        loadingUsers: false,
        usersWithAccess: []
      };
    },

    getDefaultProps: function() {
      return {
        closeHandler: () => {
          console.log('No closeHandler specified.');
        },
        addNotification: () => {
          console.log('No addNotification specified.');
        }
      };
    },

    componentWillMount: function() {
      this._getModelUserInfo();
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    /**
      Fetch the a list, from the API, of user info for each user attached to
      the model.

      @method _getModelUserInfo
    */
    _getModelUserInfo: function() {
      this.setState({loadingUsers: true}, () => {
        const xhr = this.props.getModelUserInfo(this._getModelUserInfoCallback);
        this.xhrs.push(xhr);
      });
    },

    /**
      Handle the API-returned data about the model's users. When successful, it
      will update the component's internal state.

      @method _getModelUserCallback
    */
    _getModelUserInfoCallback: function(error, data) {
      this.setState({loadingUsers: false}, () => {
        if (error) {
          // Display the error message.
          this.props.addNotification({
            title: 'Unable to load users.',
            message: 'Unable to load user information for this model: ' + error,
            level: 'error'
          });
          // Go ahead and close the popup.
          this.props.closeHandler();
          return;
        }
        this.setState({usersWithAccess: data});
      });
    },

    /**
      Generate the list of users with access to the model.

      @method _generateUsersWithAccess
      @returns {Array} An array of markup objects for each user.
    */
    _generateUsersWithAccess: function() {
      if (this.state.loadingUsers) {
        return (
          <div className="sharing__loading">
            <juju.components.Spinner />
          </div>
        );
      }
      const users = this.state.usersWithAccess;
      if (!users.length) {
        return;
      }
      return users.map((user) => {
        if (user.err) {
          return (
            <div key={user.name} className="sharing__user">
              <div className="sharing__user-details">
                <div className="sharing__user-name">
                  {user.displayName}
                </div>
                <div className="sharing__user-display-name">
                  {user.err}
                </div>
              </div>
            </div>
          );
        }
        let lastConnection = 'never connected';
        if (user.lastConnection) {
          const humanTime = this.props.humanizeTimestamp(
            user.lastConnection);
          lastConnection = `last connection: ${humanTime}`;
        }
        return (
          <div key={user.name} className="sharing__user">
            <div className="sharing__user-details">
              <div className="sharing__user-name">
                {user.displayName}
              </div>
              <div className="sharing__user-display-name">
                {user.domain} user
              </div>
              <div className="sharing__user-last-connection">
                {lastConnection}
              </div>
            </div>
            <div className="sharing__user-access">
              {user.access}
            </div>
          </div>
        );
      });
    },

    render: function() {
      const buttons = [{
        title: 'Done',
        action: this.props.closeHandler,
        type: 'neutral'
      }];
      return (
        <juju.components.Popup
          className="sharing__popup"
          title="Shared with"
          buttons={buttons}>
          <div className="sharing__users-header">
              <div className="sharing__users-header-user">User</div>
              <div className="sharing__users-header-access">Access</div>
          </div>
          <div className="sharing__users">
            {this._generateUsersWithAccess()}
          </div>
        </juju.components.Popup>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'loading-spinner',
    'popup'
  ]
});
