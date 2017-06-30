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

describe('UserProfile', () => {
  let userInfo;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile', () => { done(); });
  });

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
      <juju.components.UserProfile
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
    instance._setHasEntities(true);
    const output = component.getRenderOutput();
    const content = output.props.children.props.children;
    const expected = (
      <div className="inner-wrapper">
        <juju.components.UserProfileHeader
          avatar=""
          interactiveLogin={instance._interactiveLogin}
          links={links}
          userInfo={userInfo} />
        <div>
          {[<juju.components.UserProfileModelList
            acl={acl}
            addNotification={addNotification}
            ref="modelList"
            key="modelList"
            changeState={changeState}
            currentModel={undefined}
            destroyModels={destroyModels}
            facadesExist={true}
            listModelsWithInfo={listModelsWithInfo}
            setHasEntities={instance._setHasEntities}
            switchModel={switchModel}
            userInfo={userInfo} />,
          <juju.components.UserProfileEntityList
            addNotification={addNotification}
            ref="bundleList"
            key="bundleList"
            changeState={changeState}
            charmstore={charmstore}
            getDiagramURL={getDiagramURL}
            setHasEntities={instance._setHasEntities}
            type='bundle'
            user={userInfo.external} />,
          <juju.components.UserProfileEntityList
            addNotification={addNotification}
            ref="charmList"
            key="charmList"
            changeState={changeState}
            charmstore={charmstore}
            d3={{}}
            getDiagramURL={getDiagramURL}
            getKpiMetrics={getKpiMetrics}
            setHasEntities={instance._setHasEntities}
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
      <juju.components.UserProfile
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
    const output = component.getRenderOutput();
    const content = output.props.children.props.children;
    const expected = (
      <div className="inner-wrapper">
        <juju.components.UserProfileHeader
          avatar=""
          interactiveLogin={instance._interactiveLogin}
          links={links}
          userInfo={userInfo} />
        <juju.components.EmptyUserProfile
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
      <juju.components.UserProfile
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
      <juju.components.UserProfile
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
