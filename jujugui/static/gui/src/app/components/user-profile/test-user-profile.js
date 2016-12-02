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
  let users;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile', () => { done(); });
  });

  beforeEach(() => {
    users = {charmstore: {
      user: 'user-dalek',
      usernameDisplay: 'test owner'
    }};
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
    const user = users.charmstore;
    const charmstore = {};
    window.flags = {blues: true};
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        acl={acl}
        addNotification={addNotification}
        users={users}
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
        staticURL={staticURL}
        storeUser={sinon.stub()}
        user={user} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const content = output.props.children.props.children;
    const emptyComponent = (
      <juju.components.EmptyUserProfile
        staticURL={staticURL}
        switchModel={switchModel} />
    );
    const lists = [
      <juju.components.UserProfileModelList
        acl={acl}
        addNotification={addNotification}
        ref="modelList"
        key="modelList"
        currentModel={undefined}
        destroyModels={destroyModels}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={switchModel}
        user={user} />,
      <juju.components.UserProfileEntityList
        ref="bundleList"
        key="bundleList"
        changeState={changeState}
        charmstore={charmstore}
        getDiagramURL={getDiagramURL}
        type='bundle'
        user={user}
        users={users} />,
      <juju.components.UserProfileEntityList
        ref="charmList"
        key="charmList"
        changeState={changeState}
        charmstore={charmstore}
        getDiagramURL={getDiagramURL}
        type='charm'
        user={user}
        users={users} />,
      <juju.components.UserProfileAgreementList
        ref="agreementList"
        key="agreementList"
        getAgreements={getAgreements}
        user={user} />,
      <juju.components.UserProfileBudgetList
        ref="budgetList"
        key="budgetList"
        listBudgets={listBudgets}
        user={user} />
    ];
    const expected = (
      <div className="inner-wrapper">
        <juju.components.UserProfileHeader
          users={users}
          avatar=""
          interactiveLogin={instance._interactiveLogin}
          links={links}
          username={users.charmstore.usernameDisplay} />
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

  it('does not pass the charmstore login if interactiveLogin is falsey', () => {
    const pluralize = sinon.stub();
    pluralize.withArgs('model', sinon.match.any).returns('models');
    const links = [];
    const output = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        charmstore={{}}
        switchModel={sinon.stub()}
        listBudgets={sinon.stub()}
        listModelsWithInfo={sinon.stub()}
        changeState={sinon.stub()}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={false}
        pluralize={pluralize}
        storeUser={sinon.stub()}
        user={users.charmstore} />);
    const expected = (
      <juju.components.UserProfileHeader
        users={users}
        avatar=""
        interactiveLogin={undefined}
        links={links}
        username={users.charmstore.usernameDisplay} />);
    assert.deepEqual(output.props.children.props.children.props.children[0],
      expected);
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
        users={users}
        listBudgets={sinon.stub()}
        listModelsWithInfo={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={true}
        pluralize={sinon.stub()}
        storeUser={storeUser}
        user={users.charmstore} />, true);
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
    const user = users.charmstore;
    window.flags = {blues: false};
    const component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={addNotification}
        users={users}
        charmstore={{}}
        getAgreements={getAgreements}
        getDiagramURL={getDiagramURL}
        listBudgets={listBudgets}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={switchModel}
        interactiveLogin={true}
        changeState={changeState}
        pluralize={sinon.stub()}
        storeUser={sinon.stub()}
        user={user} />, true);
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
        users={{}}
        charmstore={{}}
        getAgreements={getAgreements}
        getDiagramURL={getDiagramURL}
        listBudgets={listBudgets}
        listModelsWithInfo={listModelsWithInfo}
        switchModel={switchModel}
        interactiveLogin={true}
        changeState={changeState}
        pluralize={sinon.stub()}
        storeUser={sinon.stub()}
        user={undefined} />, true);
    const instance = component.getMountedInstance();
    assert.isUndefined(instance.refs.bundleList);
    assert.isUndefined(instance.refs.charmList);
  });
});
