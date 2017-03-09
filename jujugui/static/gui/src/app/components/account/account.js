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

YUI.add('account', function() {

  juju.components.Account = React.createClass({

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      getUser: React.PropTypes.func.isRequired,
      userInfo: React.PropTypes.object.isRequired
    },

    render: function() {
      const links = [{
        label: 'Primary account',
      }];
      return (
        <juju.components.Panel
          instanceName="account"
          visible={true}>
          <div className="twelve-col">
            <div className="inner-wrapper">
              <juju.components.UserProfileHeader
                avatar=""
                links={links}
                userInfo={this.props.userInfo} />
              <juju.components.AccountPaymentMethod
                acl={this.props.acl}
                addNotification={this.props.addNotification}
                getUser={this.props.getUser}
                username={this.props.userInfo.profile} />
            </div>
          </div>
        </juju.components.Panel>
      );
    }

  });

}, '', {
  requires: [
    'account-payment-method',
    'panel-component',
    'user-profile-header'
  ]
});
