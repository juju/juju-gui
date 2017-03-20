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
      generateCloudCredentialName: React.PropTypes.func.isRequired,
      getCloudCredentialNames: React.PropTypes.func.isRequired,
      getCloudProviderDetails: React.PropTypes.func.isRequired,
      getUser: React.PropTypes.func,
      listClouds: React.PropTypes.func.isRequired,
      revokeCloudCredential: React.PropTypes.func.isRequired,
      showPay: React.PropTypes.bool,
      updateCloudCredential: React.PropTypes.func.isRequired,
      user: React.PropTypes.string.isRequired,
      userInfo: React.PropTypes.object.isRequired,
      validateForm: React.PropTypes.func.isRequired
    },

    /**
      Generate the payment details section.

      @method _generatePaymentDetails
    */
    _generatePaymentDetails: function() {
      if (this.props.showPay) {
        return (
          <juju.components.AccountPaymentMethod
            acl={this.props.acl}
            addNotification={this.props.addNotification}
            getUser={this.props.getUser}
            username={this.props.userInfo.profile} />);
      } else {
        return null;
      }
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
              <juju.components.AccountCredentials
                acl={this.props.acl}
                addNotification={this.props.addNotification}
                generateCloudCredentialName={
                  this.props.generateCloudCredentialName}
                getCloudCredentialNames={this.props.getCloudCredentialNames}
                getCloudProviderDetails={this.props.getCloudProviderDetails}
                listClouds={this.props.listClouds}
                revokeCloudCredential={this.props.revokeCloudCredential}
                updateCloudCredential={this.props.updateCloudCredential}
                username={this.props.user}
                validateForm={this.props.validateForm} />
              {this._generatePaymentDetails()}
            </div>
          </div>
        </juju.components.Panel>
      );
    }

  });

}, '', {
  requires: [
    'account-credentials',
    'account-payment-method',
    'panel-component',
    'user-profile-header'
  ]
});
