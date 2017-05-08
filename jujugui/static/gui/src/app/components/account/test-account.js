/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('Account', () => {
  let acl;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('account', () => { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', () => {
    const userInfo = {profile: 'spinach'};
    const getUser = sinon.stub();
    const addNotification = sinon.stub();
    const controllerIsReady = sinon.stub();
    const generateCloudCredentialName = sinon.stub();
    const getCloudCredentialNames = sinon.stub();
    const getCloudProviderDetails = sinon.stub();
    const listClouds = sinon.stub();
    const revokeCloudCredential = sinon.stub();
    const updateCloudCredential = sinon.stub();
    const validateForm = sinon.stub();
    const sendAnalytics = sinon.stub();
    const removePaymentMethod = sinon.stub();
    const createPaymentMethod= sinon.stub();
    const createToken = sinon.stub();
    const getCountries = sinon.stub();
    const createUser = sinon.stub();
    const createCardElement = sinon.stub();
    const addAddress = sinon.stub();
    const addBillingAddress = sinon.stub();
    const removeAddress = sinon.stub();
    const removeBillingAddress = sinon.stub();
    const updateAddress = sinon.stub();
    const updateBillingAddress = sinon.stub();
    const updatePaymentMethod = sinon.stub();
    const getReceipt = sinon.stub();
    const getCharges = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.Account
        acl={acl}
        addAddress={addAddress}
        addBillingAddress={addBillingAddress}
        addNotification={addNotification}
        controllerIsReady={controllerIsReady}
        createCardElement={createCardElement}
        createPaymentMethod={createPaymentMethod}
        createToken={createToken}
        createUser={createUser}
        generateCloudCredentialName={generateCloudCredentialName}
        getCharges={getCharges}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudProviderDetails={getCloudProviderDetails}
        getCountries={getCountries}
        getReceipt={getReceipt}
        getUser={getUser}
        listClouds={listClouds}
        removeAddress={removeAddress}
        removeBillingAddress={removeBillingAddress}
        removePaymentMethod={removePaymentMethod}
        revokeCloudCredential={revokeCloudCredential}
        updateAddress={updateAddress}
        updateBillingAddress={updateBillingAddress}
        updateCloudCredential={updateCloudCredential}
        updatePaymentMethod={updatePaymentMethod}
        sendAnalytics={sendAnalytics}
        showPay={true}
        user="spinach@external"
        userInfo={userInfo}
        validateForm={validateForm} />, true);
    const output = component.getRenderOutput();
    const links = [{
      label: 'Primary account'
    }];
    const expected = (
      <juju.components.Panel
        instanceName="account"
        visible={true}>
        <div className="twelve-col">
          <div className="inner-wrapper">
            <juju.components.UserProfileHeader
              avatar=""
              links={links}
              userInfo={userInfo} />
            <juju.components.AccountCredentials
              acl={acl}
              addNotification={addNotification}
              controllerIsReady={controllerIsReady}
              generateCloudCredentialName={generateCloudCredentialName}
              getCloudCredentialNames={getCloudCredentialNames}
              getCloudProviderDetails={getCloudProviderDetails}
              listClouds={listClouds}
              revokeCloudCredential={revokeCloudCredential}
              sendAnalytics={sendAnalytics}
              updateCloudCredential={updateCloudCredential}
              username="spinach@external"
              validateForm={validateForm} />
            <juju.components.AccountPayment
              acl={acl}
              addAddress={addAddress}
              addBillingAddress={addBillingAddress}
              addNotification={addNotification}
              createCardElement={createCardElement}
              createPaymentMethod={createPaymentMethod}
              createToken={createToken}
              createUser={createPaymentMethod}
              getCharges={getCharges}
              getCountries={getCountries}
              getReceipt={getReceipt}
              getUser={getUser}
              removeAddress={removeAddress}
              removeBillingAddress={removeBillingAddress}
              removePaymentMethod={removePaymentMethod}
              updateAddress={updateAddress}
              updateBillingAddress={updateBillingAddress}
              updatePaymentMethod={updatePaymentMethod}
              username="spinach"
              validateForm={validateForm} />
          </div>
        </div>
      </juju.components.Panel>);
    expect(output).toEqualJSX(expected);
  });

  it('can render without payments', () => {
    const userInfo = {profile: 'spinach'};
    const getUser = sinon.stub();
    const addNotification = sinon.stub();
    const controllerIsReady = sinon.stub();
    const generateCloudCredentialName = sinon.stub();
    const getCloudCredentialNames = sinon.stub();
    const getCloudProviderDetails = sinon.stub();
    const listClouds = sinon.stub();
    const revokeCloudCredential = sinon.stub();
    const updateCloudCredential = sinon.stub();
    const validateForm = sinon.stub();
    const sendAnalytics = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.Account
        acl={acl}
        addNotification={addNotification}
        controllerIsReady={controllerIsReady}
        generateCloudCredentialName={generateCloudCredentialName}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudProviderDetails={getCloudProviderDetails}
        getUser={getUser}
        getCountries={sinon.stub()}
        listClouds={listClouds}
        revokeCloudCredential={revokeCloudCredential}
        updateCloudCredential={updateCloudCredential}
        sendAnalytics={sendAnalytics}
        showPay={false}
        user="spinach@external"
        userInfo={userInfo}
        validateForm={validateForm} />, true);
    const output = component.getRenderOutput();
    const links = [{
      label: 'Primary account'
    }];
    const expected = (
      <juju.components.Panel
        instanceName="account"
        visible={true}>
        <div className="twelve-col">
          <div className="inner-wrapper">
            <juju.components.UserProfileHeader
              avatar=""
              links={links}
              userInfo={userInfo} />
            <juju.components.AccountCredentials
              acl={acl}
              addNotification={addNotification}
              controllerIsReady={controllerIsReady}
              generateCloudCredentialName={generateCloudCredentialName}
              getCloudCredentialNames={getCloudCredentialNames}
              getCloudProviderDetails={getCloudProviderDetails}
              listClouds={listClouds}
              revokeCloudCredential={revokeCloudCredential}
              sendAnalytics={sendAnalytics}
              updateCloudCredential={updateCloudCredential}
              username="spinach@external"
              validateForm={validateForm} />
            {null}
          </div>
        </div>
      </juju.components.Panel>);
    expect(output).toEqualJSX(expected);
  });
});
