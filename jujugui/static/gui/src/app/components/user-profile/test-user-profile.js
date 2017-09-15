/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const EmptyUserProfile = require('./empty-user-profile');
const UserProfile = require('./user-profile');
const UserProfileEntityList = require('./entity-list/entity-list');
const UserProfileModelList = require('./model-list/model-list');
const UserProfileHeader = require('./header/header');

const jsTestUtils = require('../../utils/component-test-utils');

describe('UserProfile', () => {
  let userInfo;

  beforeEach(() => {
    userInfo = {external: 'who-ext', profile: 'who', isCurrent: true};
  });

  it('renders a populated user profile page', () => {
    const acl = {};
    const links = [];
    const addNotification = sinon.stub();
    const changeState = sinon.stub();
    const getDiagramURL = sinon.stub();
    const getKpiMetrics = sinon.stub();
    const listBudgets = sinon.stub();
    const listModelsWithInfo = sinon.stub();
    const destroyModels = sinon.stub();
    const switchModel = sinon.stub();
    const getAgreements = sinon.stub();
    const staticURL = 'test-url';
    const charmstore = {};
    const component = jsTestUtils.shallowRender(
      <UserProfile
        acl={acl}
        addNotification={addNotification}
        charmstore={charmstore}
        d3={{}}
        destroyModels={destroyModels}
        facadesExist={true}
        getAgreements={getAgreements}
        getDiagramURL={getDiagramURL}
        getKpiMetrics={getKpiMetrics}
        listBudgets={listBudgets}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={switchModel}
        interactiveLogin={true}
        changeState={changeState}
        pluralize={sinon.stub()}
        setPageTitle={sinon.stub()}
        staticURL={staticURL}
        storeUser={sinon.stub()}
        userInfo={userInfo} />, true);
    const instance = component.getMountedInstance();
    const bundles = [1];
    const charms = [1, 2];
    const models = [1, 2, 3];
    instance._setEntities('bundles', bundles);
    instance._setEntities('charms', charms);
    instance._setEntities('models', models);
    const output = component.getRenderOutput();
    const content = output.props.children.props.children;
    const expected = (
      <div className="inner-wrapper">
        <UserProfileHeader
          avatar=""
          interactiveLogin={instance._interactiveLogin}
          links={links}
          userInfo={userInfo} />
        {null}
        <div>
          {[<UserProfileModelList
            acl={acl}
            addNotification={addNotification}
            ref="modelList"
            key="modelList"
            changeState={changeState}
            currentModel={undefined}
            destroyModels={destroyModels}
            models={models}
            facadesExist={true}
            listModelsWithInfo={listModelsWithInfo}
            setEntities={instance._setEntities}
            switchModel={switchModel}
            userInfo={userInfo} />,
          <UserProfileEntityList
            addNotification={addNotification}
            ref="bundleList"
            key="bundleList"
            changeState={changeState}
            charmstore={charmstore}
            getDiagramURL={getDiagramURL}
            entities={bundles}
            setEntities={instance._setEntities}
            type='bundle'
            user={userInfo.external} />,
          <UserProfileEntityList
            addNotification={addNotification}
            ref="charmList"
            key="charmList"
            changeState={changeState}
            charmstore={charmstore}
            d3={{}}
            getDiagramURL={getDiagramURL}
            getKpiMetrics={getKpiMetrics}
            entities={charms}
            setEntities={instance._setEntities}
            type='charm'
            user={userInfo.external} />]}
        </div>
      </div>);
    expect(content).toEqualJSX(expected);
  });

  it('renders an empty user profile page', () => {
    const acl = {};
    const links = [];
    const addNotification = sinon.stub();
    const changeState = sinon.stub();
    const getDiagramURL = sinon.stub();
    const getKpiMetrics = sinon.stub();
    const listBudgets = sinon.stub();
    const listModelsWithInfo = sinon.stub();
    const destroyModels = sinon.stub();
    const switchModel = sinon.stub();
    const getAgreements = sinon.stub();
    const staticURL = 'test-url';
    const charmstore = {};
    const component = jsTestUtils.shallowRender(
      <UserProfile
        acl={acl}
        addNotification={addNotification}
        charmstore={charmstore}
        d3={{}}
        destroyModels={destroyModels}
        facadesExist={true}
        getAgreements={getAgreements}
        getDiagramURL={getDiagramURL}
        getKpiMetrics={getKpiMetrics}
        listBudgets={listBudgets}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={switchModel}
        interactiveLogin={true}
        changeState={changeState}
        pluralize={sinon.stub()}
        setPageTitle={sinon.stub()}
        staticURL={staticURL}
        storeUser={sinon.stub()}
        userInfo={userInfo} />, true);
    const instance = component.getMountedInstance();
    instance._setEntities('bundles', []);
    instance._setEntities('charms', []);
    instance._setEntities('models', []);
    const output = component.getRenderOutput();
    const content = output.props.children.props.children;
    const expected = (
      <div className="inner-wrapper">
        <UserProfileHeader
          avatar=""
          interactiveLogin={instance._interactiveLogin}
          links={links}
          userInfo={userInfo} />
        <EmptyUserProfile
          changeState={changeState}
          isCurrentUser={true}
          staticURL={staticURL}
          switchModel={switchModel} />
      </div>);
    expect(content).toEqualJSX(expected);
  });

  it('can log in to charmstore fetch macaroons from the bakery', () => {
    const storeUser = sinon.stub();
    const getStub = sinon.stub().returns('candy');
    const charmstore = {
      bakery: {
        storage: {
          get: getStub
        }
      },
      getMacaroon: sinon.stub()
    };
    const renderer = jsTestUtils.shallowRender(
      <UserProfile
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        destroyModels={sinon.stub()}
        facadesExist={true}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getKpiMetrics={sinon.stub()}
        interactiveLogin={true}
        listBudgets={sinon.stub()}
        listModelsWithInfo={sinon.stub()}
        pluralize={sinon.stub()}
        setPageTitle={sinon.stub()}
        storeUser={storeUser}
        switchModel={sinon.stub()}
        userInfo={userInfo} />, true);
    const instance = renderer.getMountedInstance();
    instance._interactiveLogin();
    if (charmstore.getMacaroon.callCount > 0) {
      assert.fail('Macaroon should have been fetched from bakery');
    }
    assert.equal(storeUser.callCount, 1);
  });

  it('skips the bundle and charm lists when not logged in', () => {
    const changeState = sinon.stub();
    const getDiagramURL = sinon.stub();
    const listBudgets = sinon.stub();
    const listModelsWithInfo = sinon.stub();
    const switchModel = sinon.stub();
    const getAgreements = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <UserProfile
        addNotification={sinon.stub()}
        changeState={changeState}
        charmstore={{}}
        destroyModels={sinon.stub()}
        facadesExist={true}
        getAgreements={getAgreements}
        getDiagramURL={getDiagramURL}
        getKpiMetrics={sinon.stub()}
        interactiveLogin={true}
        listBudgets={listBudgets}
        listModelsWithInfo={listModelsWithInfo}
        pluralize={sinon.stub()}
        setPageTitle={sinon.stub()}
        storeUser={sinon.stub()}
        switchModel={switchModel}
        userInfo={userInfo} />, true);
    const instance = component.getMountedInstance();
    assert.isUndefined(instance.refs.bundleList);
    assert.isUndefined(instance.refs.charmList);
  });
});
