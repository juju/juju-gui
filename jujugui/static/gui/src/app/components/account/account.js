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
    displayName: 'Account',

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addAddress: React.PropTypes.func,
      addBillingAddress: React.PropTypes.func,
      addNotification: React.PropTypes.func.isRequired,
      createCardElement: React.PropTypes.func,
      createPaymentMethod: React.PropTypes.func,
      createToken: React.PropTypes.func,
      createUser: React.PropTypes.func,
      generateCloudCredentialName: React.PropTypes.func.isRequired,
      getCloudCredentialNames: React.PropTypes.func.isRequired,
      getCloudProviderDetails: React.PropTypes.func.isRequired,
      getCountries: React.PropTypes.func.isRequired,
      getUser: React.PropTypes.func,
      listClouds: React.PropTypes.func.isRequired,
      removeAddress: React.PropTypes.func,
      removeBillingAddress: React.PropTypes.func,
      removePaymentMethod: React.PropTypes.func,
      revokeCloudCredential: React.PropTypes.func.isRequired,
      sendAnalytics: React.PropTypes.func.isRequired,
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
          <juju.components.AccountPayment
            acl={this.props.acl}
            addAddress={this.props.addAddress}
            addBillingAddress={this.props.addBillingAddress}
            addNotification={this.props.addNotification}
            createCardElement={this.props.createCardElement}
            createPaymentMethod={this.props.createPaymentMethod}
            createToken={this.props.createToken}
            createUser={this.props.createUser}
            getCountries={this.props.getCountries}
            getUser={this.props.getUser}
            removeAddress={this.props.removeAddress}
            removeBillingAddress={this.props.removeBillingAddress}
            removePaymentMethod={this.props.removePaymentMethod}
            username={this.props.userInfo.profile}
            validateForm={this.props.validateForm} />);
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
                sendAnalytics={this.props.sendAnalytics}
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
    'account-payment',
    'panel-component',
    'user-profile-header'
  ]
});
