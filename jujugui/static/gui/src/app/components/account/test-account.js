/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');

const Account = require('./account');
const UserProfileHeader = require('../user-profile/header/header');
const Panel = require('../panel/panel');
const AccountCredentials = require('./credentials/credentials');
const AccountPayment = require('./payment/payment');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Account', () => {
  let acl, controllerAPI, initUtils, payment, stripe;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    controllerAPI = {
      getCloudCredentialNames: sinon.stub(),
      listClouds: sinon.stub(),
      reshape: shapeup.reshapeFunc,
      revokeCloudCredential: sinon.stub(),
      updateCloudCredential: sinon.stub()
    };
    initUtils = {
      generateCloudCredentialName: sinon.stub(),
      getCloudProviderDetails: sinon.stub(),
      reshape: shapeup.reshapeFunc,
      validateForm: sinon.stub()
    };
    payment = {
      addAddress: sinon.stub(),
      addBillingAddress: sinon.stub(),
      createPaymentMethod: sinon.stub(),
      createUser: sinon.stub(),
      getCharges: sinon.stub(),
      getCountries: sinon.stub(),
      getReceipt: sinon.stub(),
      getUser: sinon.stub(),
      removeAddress: sinon.stub(),
      removeBillingAddress: sinon.stub(),
      removePaymentMethod: sinon.stub(),
      reshape: shapeup.reshapeFunc,
      updateAddress: sinon.stub(),
      updateBillingAddress: sinon.stub(),
      updatePaymentMethod: sinon.stub()
    };
    stripe = {
      createCardElement: sinon.stub(),
      createToken: sinon.stub(),
      reshape: shapeup.reshapeFunc
    };
  });

  it('can render', () => {
    const userInfo = {profile: 'spinach'};
    const addNotification = sinon.stub();
    const controllerIsReady = sinon.stub();
    const sendAnalytics = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <Account
        acl={acl}
        addNotification={addNotification}
        changeState={sinon.stub()}
        controllerAPI={controllerAPI}
        controllerIsReady={controllerIsReady}
        initUtils={initUtils}
        payment={payment}
        sendAnalytics={sendAnalytics}
        showPay={true}
        stripe={stripe}
        user="spinach@external"
        userInfo={userInfo} />, true);
    const output = component.getRenderOutput();
    const links = [{
      label: 'Primary account'
    }];
    const expected = (
      <Panel
        instanceName="account"
        visible={true}>
        <div className="twelve-col">
          <div className="inner-wrapper">
            <UserProfileHeader
              avatar=""
              changeState={sinon.stub()}
              closeState={{root: null}}
              links={links}
              userInfo={userInfo} />
            <AccountCredentials
              acl={acl}
              addNotification={addNotification}
              controllerAPI={controllerAPI}
              controllerIsReady={controllerIsReady}
              initUtils={initUtils}
              sendAnalytics={sendAnalytics}
              username="spinach@external" />
            <AccountPayment
              acl={acl}
              addNotification={addNotification}
              payment={payment}
              stripe={stripe}
              username="spinach"
              validateForm={initUtils.validateForm} />
          </div>
        </div>
      </Panel>);
    expect(output).toEqualJSX(expected);
  });

  it('can render without payments', () => {
    const userInfo = {profile: 'spinach'};
    const addNotification = sinon.stub();
    const controllerIsReady = sinon.stub();
    const sendAnalytics = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <Account
        acl={acl}
        addNotification={addNotification}
        changeState={sinon.stub()}
        controllerAPI={controllerAPI}
        controllerIsReady={controllerIsReady}
        initUtils={initUtils}
        sendAnalytics={sendAnalytics}
        showPay={false}
        user="spinach@external"
        userInfo={userInfo} />, true);
    const output = component.getRenderOutput();
    const links = [{
      label: 'Primary account'
    }];
    const expected = (
      <Panel
        instanceName="account"
        visible={true}>
        <div className="twelve-col">
          <div className="inner-wrapper">
            <UserProfileHeader
              avatar=""
              changeState={sinon.stub()}
              closeState={{root: null}}
              links={links}
              userInfo={userInfo} />
            <AccountCredentials
              acl={acl}
              addNotification={addNotification}
              controllerAPI={controllerAPI}
              controllerIsReady={controllerIsReady}
              initUtils={initUtils}
              sendAnalytics={sendAnalytics}
              username="spinach@external" />
            {null}
          </div>
        </div>
      </Panel>);
    expect(output).toEqualJSX(expected);
  });
});
