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
      closeHandler: React.PropTypes.func,
      getModelUserInfo: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      this.xhrs = [];

      return {
        loadingUsers: false,
        usersWithAccess: []
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
          // TODO kadams54: figure out a better way to handle this.
          // TODO kadams54: test the error scenario
          console.error('cannot fetch model user info', error);
          return;
        }
        // TODO kadams54: transform into the expected user objects.
        const usersWithAccess = data;
        this.setState({usersWithAccess: usersWithAccess});
      });
    },

    /**
      Generate the list of users with access to the model.

      @method _generateUsersWithAccess
      @returns {Array} An array of markup objects for each user.
    */
    _generateUsersWithAccess: function() {
      // TODO kadams54: display a spinner instead when loading data.
      const users = this.state.usersWithAccess;
      if (!users.length) {
        return;
      }
      return users.map((user) => {
        const accessMarkup = user.access == 'admin' ? (
          <div className="sharing__user-access">
            {user.access}
          </div>
        ) : undefined;
        return (
          <div key={user.name} className="sharing__user">
            <div className="sharing__user-name">
              {user.name}
            </div>
            <div className="sharing__user-displayname">
              {user.displayName}
            </div>
            {accessMarkup}
          </div>
        );
      });
    },

    render: function() {
      const buttons = [{
        title: 'Done',
        action: this.props.closeHandler,
        type: 'positive'
      }];
      return (
        <juju.components.Popup
          className="sharing__popup"
          title="Share"
          buttons={buttons}>
          <div className="sharing__users">
            <h5 className="sharing__users-header">Users with access</h5>
            {this._generateUsersWithAccess()}
          </div>
        </juju.components.Popup>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'popup'
  ]
});
