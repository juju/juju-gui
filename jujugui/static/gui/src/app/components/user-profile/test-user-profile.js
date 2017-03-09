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

  afterEach(() => {
    window.flags = {};
  });

  it('renders a populated user profile page', () => {
    const acl = {};
    const links = [];
    const addNotification = sinon.stub();
    const changeState = sinon.stub();
    const getDiagramURL = sinon.stub();
    const listBudgets = sinon.stub();
    const listModelsWithInfo = sinon.stub();
    const destroyModels = sinon.stub();
    const switchModel = sinon.stub();
    const getAgreements = sinon.stub();
    const staticURL = 'test-url';
    const charmstore = {};
    window.flags = {blues: true};
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        acl={acl}
        addNotification={addNotification}
        charmstore={charmstore}
        destroyModels={destroyModels}
        facadesExist={true}
        getAgreements={getAgreements}
        getDiagramURL={getDiagramURL}
        listBudgets={listBudgets}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={switchModel}
        interactiveLogin={true}
        changeState={changeState}
        pluralize={sinon.stub()}
        setPageTitle={sinon.stub()}
        staticURL={staticURL}
        storeUser={sinon.stub()}
        userInfo={userInfo}
      />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const content = output.props.children.props.children;
    const emptyComponent = (
      <juju.components.EmptyUserProfile
        changeState={changeState}
        staticURL={staticURL}
        switchModel={switchModel} />
    );
    const lists = [
      <juju.components.UserProfileModelList
        acl={acl}
        addNotification={addNotification}
        ref="modelList"
        key="modelList"
        changeState={changeState}
        currentModel={undefined}
        destroyModels={destroyModels}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={switchModel}
        userInfo={userInfo}
      />,
      <juju.components.UserProfileEntityList
        ref="bundleList"
        key="bundleList"
        changeState={changeState}
        charmstore={charmstore}
        getDiagramURL={getDiagramURL}
        type='bundle'
        user={userInfo.external}
      />,
      <juju.components.UserProfileEntityList
        ref="charmList"
        key="charmList"
        changeState={changeState}
        charmstore={charmstore}
        getDiagramURL={getDiagramURL}
        type='charm'
        user={userInfo.external}
       />
    ];
    const expected = (
      <div className="inner-wrapper">
        <juju.components.UserProfileHeader
          avatar=""
          interactiveLogin={instance._interactiveLogin}
          links={links}
          userInfo={userInfo}
        />
        <div>
          <juju.components.SectionLoadWatcher
            EmptyComponent={emptyComponent}
            timeout={10}>
            {lists}
          </juju.components.SectionLoadWatcher>
        </div>
      </div>);
    assert.deepEqual(content, expected);
  });

  it('can log in to charmstore fetch macaroons from the bakery', () => {
    const macaroon = sinon.spy();
    const storeUser = sinon.stub();
    const charmstore = {
      bakery: {
        fetchMacaroonFromStaticPath:
          sinon.stub().callsArgWith(0, null, macaroon)
      }
    };
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchModel={sinon.stub()}
        listBudgets={sinon.stub()}
        listModelsWithInfo={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={true}
        pluralize={sinon.stub()}
        setPageTitle={sinon.stub()}
        storeUser={storeUser}
        userInfo={userInfo}
      />, true);
    const instance = renderer.getMountedInstance();
    instance._interactiveLogin();
    assert.equal(charmstore.bakery.fetchMacaroonFromStaticPath.callCount, 1);
    assert.equal(storeUser.callCount, 1);
  });

  it('skips the budget list when blues flag is inactive', () => {
    const addNotification = sinon.stub();
    const changeState = sinon.stub();
    const getDiagramURL = sinon.stub();
    const listBudgets = sinon.stub();
    const listModelsWithInfo = sinon.stub();
    const switchModel = sinon.stub();
    const getAgreements = sinon.stub();
    window.flags = {blues: false};
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={addNotification}
        charmstore={{}}
        getAgreements={getAgreements}
        getDiagramURL={getDiagramURL}
        listBudgets={listBudgets}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={switchModel}
        interactiveLogin={true}
        changeState={changeState}
        pluralize={sinon.stub()}
        setPageTitle={sinon.stub()}
        storeUser={sinon.stub()}
        userInfo={userInfo}
      />, true);
    const instance = component.getMountedInstance();
    assert.isUndefined(instance.refs.budgetList);
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
        charmstore={{}}
        getAgreements={getAgreements}
        getDiagramURL={getDiagramURL}
        listBudgets={listBudgets}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={switchModel}
        interactiveLogin={true}
        changeState={changeState}
        pluralize={sinon.stub()}
        setPageTitle={sinon.stub()}
        storeUser={sinon.stub()}
        userInfo={userInfo}
      />, true);
    const instance = component.getMountedInstance();
    assert.isUndefined(instance.refs.bundleList);
    assert.isUndefined(instance.refs.charmList);
  });
});
